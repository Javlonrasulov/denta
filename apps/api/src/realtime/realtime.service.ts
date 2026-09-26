import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import { JwtPayload } from '../common/guards/auth.guards';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server?: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  bindServer(server: Server) {
    this.server = server;
  }

  /**
   * Mirror JwtStrategy: membershipId/clinicId must be an active ClinicMember.
   * Never trust raw JWT clinicId alone.
   */
  async authenticateToken(token?: string): Promise<{
    userId: string;
    clinicId?: string | null;
    doctorId?: string;
  } | null> {
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('app.jwt.accessSecret'),
      });
      if (payload.type !== 'access') return null;

      if (payload.membershipId) {
        const membership = await this.prisma.clinicMember.findFirst({
          where: {
            id: payload.membershipId,
            userId: payload.sub,
            isActive: true,
          },
          select: { clinicId: true },
        });
        if (!membership) return null;
        return {
          userId: payload.sub,
          clinicId: membership.clinicId,
        };
      }

      if (payload.clinicId) {
        const membership = await this.prisma.clinicMember.findFirst({
          where: {
            userId: payload.sub,
            clinicId: payload.clinicId,
            isActive: true,
          },
          select: { clinicId: true },
        });
        if (!membership) {
          return { userId: payload.sub, clinicId: null };
        }
        return {
          userId: payload.sub,
          clinicId: membership.clinicId,
        };
      }

      return {
        userId: payload.sub,
        clinicId: null,
      };
    } catch {
      return null;
    }
  }

  joinClientRooms(
    client: import('socket.io').Socket,
    ctx: { userId: string; clinicId?: string | null; doctorId?: string },
  ) {
    client.join(`user:${ctx.userId}`);
    if (ctx.clinicId) client.join(`clinic:${ctx.clinicId}`);
    // Clinic-scoped doctor room — avoids cross-clinic bleed on doctor:{id}.
    if (ctx.doctorId && ctx.clinicId) {
      client.join(`doctor:${ctx.doctorId}:clinic:${ctx.clinicId}`);
    }
    if (ctx.clinicId) {
      client.data.activeClinicId = ctx.clinicId;
    }
    if (ctx.doctorId) {
      client.data.doctorId = ctx.doctorId;
    }
  }

  switchClinicRoom(
    client: import('socket.io').Socket,
    nextClinicId: string | null,
  ) {
    const prev = client.data.activeClinicId as string | undefined;
    const doctorId = client.data.doctorId as string | undefined;
    if (prev) {
      client.leave(`clinic:${prev}`);
      if (doctorId) client.leave(`doctor:${doctorId}:clinic:${prev}`);
    }
    if (nextClinicId) {
      client.join(`clinic:${nextClinicId}`);
      if (doctorId) client.join(`doctor:${doctorId}:clinic:${nextClinicId}`);
      client.data.activeClinicId = nextClinicId;
    } else {
      client.data.activeClinicId = null;
    }
  }

  emitAppointmentCreated(payload: unknown) {
    this.emitToAppointment(payload, 'appointment.created');
  }

  emitAppointmentUpdated(payload: unknown) {
    this.emitToAppointment(payload, 'appointment.updated');
  }

  emitAppointmentCancelled(payload: unknown) {
    this.emitToAppointment(payload, 'appointment.cancelled');
  }

  emitSlotUpdated(doctorId: string, payload: unknown) {
    if (!this.server) return;
    const data = payload as { clinicId?: string };
    if (data.clinicId) {
      this.server
        .to(`doctor:${doctorId}:clinic:${data.clinicId}`)
        .emit('slot.updated', payload);
      this.server.to(`clinic:${data.clinicId}`).emit('slot.updated', payload);
    }
    this.logger.debug(`slot.updated → doctor:${doctorId}`);
  }

  emitNotification(userId: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit('notification.created', payload);
  }

  private emitToAppointment(
    payload: unknown,
    event:
      | 'appointment.created'
      | 'appointment.updated'
      | 'appointment.cancelled',
  ) {
    if (!this.server) return;
    const data = payload as {
      clinicId?: string;
      doctorId?: string;
      patientId?: string;
    };
    // Tenant-scoped only — never broadcast globally or to bare doctor:{id}.
    if (data.clinicId) {
      this.server.to(`clinic:${data.clinicId}`).emit(event, payload);
      if (data.doctorId) {
        this.server
          .to(`doctor:${data.doctorId}:clinic:${data.clinicId}`)
          .emit(event, payload);
      }
    }
    this.logger.debug(`${event} emitted`);
  }
}
