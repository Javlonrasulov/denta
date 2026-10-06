import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/** Minimum gap between DB writes per membership; the UI shows minute precision. */
const WRITE_INTERVAL_MS = 15_000;

export type AppPlatform = 'android' | 'ios';

/**
 * Detects requests made by the Expo mobile apps: newer builds send `X-Client-App`,
 * older APKs are recognised by the React Native HTTP stack user agent.
 */
export function mobileAppPlatform(req: Request): AppPlatform | null {
  const clientApp = header(req, 'x-client-app');
  const declared = header(req, 'x-device-platform')?.toLowerCase();
  const ua = header(req, 'user-agent') ?? '';

  if (clientApp) {
    if (clientApp !== 'doctor' && clientApp !== 'client') return null;
    if (declared === 'android' || declared === 'ios') return declared;
    if (/okhttp|dalvik/i.test(ua)) return 'android';
    if (/cfnetwork/i.test(ua)) return 'ios';
    return null;
  }
  if (/okhttp|dalvik/i.test(ua)) return 'android';
  if (/cfnetwork|darwin/i.test(ua) && !/mozilla/i.test(ua)) return 'ios';
  return null;
}

function header(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  return typeof value === 'string' ? value : undefined;
}

@Injectable()
export class AppActivityService {
  private readonly logger = new Logger(AppActivityService.name);
  private readonly lastWrite = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  touch(membershipId: string, platform: AppPlatform): void {
    const now = Date.now();
    const previous = this.lastWrite.get(membershipId) ?? 0;
    if (now - previous < WRITE_INTERVAL_MS) return;
    this.lastWrite.set(membershipId, now);

    // Raw update keeps ClinicMember.updatedAt meaningful (no @updatedAt bump).
    // Prisma stores DateTime as UTC in a timezone-less column, so convert explicitly.
    this.prisma.$executeRaw`
      UPDATE "ClinicMember"
      SET "lastAppSeenAt" = (${new Date(now).toISOString()}::timestamptz AT TIME ZONE 'UTC'),
          "lastAppPlatform" = ${platform}
      WHERE "id" = ${membershipId}
    `.catch((err: unknown) => {
      this.lastWrite.delete(membershipId);
      this.logger.warn(`lastAppSeenAt update failed: ${String(err)}`);
    });
  }
}
