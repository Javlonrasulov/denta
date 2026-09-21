import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

/**
 * FCM push via Firebase Admin SDK.
 * Disabled (no fake success) until FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY are set.
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private configured = false;
  private app: admin.app.App | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.trim();

    if (!projectId || !clientEmail || !privateKeyRaw) {
      this.logger.warn(
        'Firebase credentials missing — push disabled until FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY are set',
      );
      return;
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    try {
      this.app =
        admin.apps.length > 0
          ? admin.app()
          : admin.initializeApp({
              credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
              }),
            });
      this.configured = true;
      this.logger.log(`Firebase Admin initialized (project=${projectId})`);
    } catch (err) {
      this.configured = false;
      this.logger.error(
        `Firebase Admin init failed: ${err instanceof Error ? err.message : String(err)}`,
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
    const platform = input.platform.toLowerCase();
    const token = input.token.trim();
    if (!token) {
      return { ok: false, reason: 'empty_token' };
    }

    await this.prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId: input.userId,
        platform,
        token,
      },
      update: { userId: input.userId, platform },
    });
    return { ok: true };
  }

  async unregisterDevice(userId: string, token: string) {
    await this.prisma.deviceToken.deleteMany({
      where: { userId, token },
    });
    return { ok: true };
  }

  /**
   * Best-effort FCM send. Returns sent count; never invents success when unconfigured.
   * Invalid tokens are pruned.
   */
  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<{ sent: number; configured: boolean }> {
    if (!this.configured || !this.app) {
      return { sent: 0, configured: false };
    }

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
    });
    if (!tokens.length) return { sent: 0, configured: true };

    const messaging = this.app.messaging();
    const data = Object.fromEntries(
      Object.entries(payload.data ?? {}).map(([k, v]) => [k, String(v)]),
    );

    let sent = 0;
    const stale: string[] = [];

    // Prefer multicast when available (≤500 tokens)
    const chunk = tokens.map((t) => t.token);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data,
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });

      response.responses.forEach((res, idx) => {
        if (res.success) {
          sent += 1;
          return;
        }
        const code = res.error?.code ?? '';
        if (
          code.includes('registration-token-not-registered') ||
          code.includes('invalid-registration-token') ||
          code.includes('invalid-argument')
        ) {
          stale.push(chunk[idx]);
        } else {
          this.logger.warn(
            `FCM send failed for token …${chunk[idx].slice(-6)}: ${res.error?.message}`,
          );
        }
      });
    } catch (err) {
      this.logger.error(
        `FCM multicast failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (stale.length) {
      await this.prisma.deviceToken.deleteMany({
        where: { token: { in: stale } },
      });
    }

    return { sent, configured: true };
  }
}
