import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const port = parseInt(process.env.PORT ?? '4000', 10);

  return {
    nodeEnv,
    port,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    /** When false, force in-memory locks/cache (dev only). */
    redisEnabled: process.env.REDIS_ENABLED !== 'false',
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
      refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
    },
    trialDays: parseInt(process.env.TRIAL_DAYS ?? '30', 10),
    otp: {
      ttlMinutes: parseInt(process.env.OTP_TTL_MINUTES ?? '10', 10),
      resendCooldownSeconds: parseInt(
        process.env.OTP_RESEND_COOLDOWN_SECONDS ?? '60',
        10,
      ),
      maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: process.env.SMTP_FROM ?? 'DENTA <noreply@denta.uz>',
    },
    storage: {
      /** local | s3 — stay on local until S3 credentials are wired */
      driver: process.env.STORAGE_DRIVER || 'local',
      localDir:
        process.env.STORAGE_LOCAL_DIR ||
        join(process.cwd(), '.uploads'),
      publicBaseUrl:
        process.env.STORAGE_PUBLIC_BASE_URL ||
        process.env.S3_PUBLIC_BASE_URL ||
        `http://localhost:${port}/uploads`,
    },
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      bucket: process.env.S3_BUCKET ?? 'denta',
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    },
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    appWebUrl: process.env.APP_WEB_URL ?? 'http://localhost:3000',
    uploadMaxBytes: parseInt(process.env.UPLOAD_MAX_BYTES ?? '5242880', 10),
    defaultTimezone: process.env.DEFAULT_TIMEZONE ?? 'Asia/Tashkent',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    },
  };
});
