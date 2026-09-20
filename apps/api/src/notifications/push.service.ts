import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * FCM push abstraction.
 * When FIREBASE_* env vars are missing, methods throw — never fake success.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly configured: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const email = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const key = process.env.FIREBASE_PRIVATE_KEY?.trim();
    this.configured = Boolean(projectId && email && key);
    if (!this.configured) {
      this.logger.warn(
        'Firebase credentials missing — push disabled until FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY are set',
      );
    }
  }

  isConfigured() {
    return this.configured;
  }

  async registerDevice(input: {
    userId: string;
    platform: string;
    token: string;
  }) {
    await this.prisma.deviceToken.upsert({
      where: { token: input.token },
      create: {
        userId: input.userId,
        platform: input.platform,
        token: input.token,
      },
      update: { userId: input.userId, platform: input.platform },
    });
    return { ok: true };
  }

  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, string> },
  ) {
    if (!this.configured) {
      throw new Error(
        'PushService not configured: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY',
      );
    }
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
    });
    if (!tokens.length) return { sent: 0 };
    // Wire firebase-admin messaging here when credentials exist.
    void payload;
    throw new Error(
      'Firebase Admin SDK not initialized — install firebase-admin and wire credentials',
    );
  }
}
