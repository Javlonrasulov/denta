import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import { JwtPayload } from '../common/guards/auth.guards';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server?: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  bindServer(server: Server) {
    this.server = server;
  }

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
      return {
        userId: payload.sub,
        clinicId: payload.clinicId,
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
    if (ctx.doctorId) client.join(`doctor:${ctx.doctorId}`);
    if (ctx.clinicId) {
      client.data.activeClinicId = ctx.clinicId;
    }
  }

  switchClinicRoom(
    client: import('socket.io').Socket,
    nextClinicId: string | null,
  ) {
    const prev = client.data.activeClinicId as string | undefined;
    if (prev) client.leave(`clinic:${prev}`);
    if (nextClinicId) {
      client.join(`clinic:${nextClinicId}`);
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
    this.server.to(`doctor:${doctorId}`).emit('slot.updated', payload);
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
    // Tenant-scoped only — never broadcast globally.
    if (data.clinicId) {
      this.server.to(`clinic:${data.clinicId}`).emit(event, payload);
    }
    if (data.doctorId) {
      this.server.to(`doctor:${data.doctorId}`).emit(event, payload);
    }
    this.logger.debug(`${event} emitted`);
  }
}
