import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
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

    let auth = await this.realtime.authenticateToken(token);
    if (!auth) {
      client.disconnect(true);
      return;
    }

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId: auth.userId },
      select: { id: true, clinics: { where: { isActive: true }, take: 1 } },
    });

    const clinicId =
      auth.clinicId ?? doctor?.clinics[0]?.clinicId ?? null;

    this.realtime.joinClientRooms(client, {
      userId: auth.userId,
      clinicId,
      doctorId: doctor?.id,
    });
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }
}
