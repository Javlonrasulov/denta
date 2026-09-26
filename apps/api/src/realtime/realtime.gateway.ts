import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly realtime: RealtimeService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.realtime.bindServer(server);
    this.logger.log('Realtime gateway initialized');
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '') as
        | string
        | undefined);

    const auth = await this.realtime.authenticateToken(token);
    if (!auth) {
      client.disconnect(true);
      return;
    }

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    // Prefer JWT/session clinic context — never arbitrary first clinic.
    const clinicId = auth.clinicId ?? null;
    client.data.userId = auth.userId;

    this.realtime.joinClientRooms(client, {
      userId: auth.userId,
      clinicId,
      doctorId: doctor?.id,
    });
  }

  @SubscribeMessage('workspace.switch')
  async onWorkspaceSwitch(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { clinicId?: string; token?: string },
  ) {
    const token =
      body?.token ??
      (client.handshake.auth?.token as string | undefined) ??
      undefined;
    const auth = await this.realtime.authenticateToken(token);
    if (!auth || auth.userId !== client.data.userId) {
      return { ok: false, code: 'UNAUTHORIZED' };
    }
    const clinicId = body?.clinicId;
    if (!clinicId) {
      return { ok: false, code: 'VALIDATION_ERROR' };
    }
    const membership = await this.prisma.clinicMember.findFirst({
      where: {
        userId: auth.userId,
        clinicId,
        isActive: true,
      },
    });
    if (!membership) {
      return { ok: false, code: 'FORBIDDEN' };
    }
    this.realtime.switchClinicRoom(client, clinicId);
    return { ok: true, clinicId };
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }
}
