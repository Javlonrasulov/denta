import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.types';

/**
 * S3-compatible storage abstraction (MinIO / AWS S3).
 * Uses fetch + AWS Signature V4 would be ideal; for now this is a
 * production-ready interface that throws until AWS SDK is wired when
 * STORAGE_DRIVER=s3. Keeps architecture clean without forcing MinIO locally.
 *
 * When STORAGE_DRIVER=s3, install @aws-sdk/client-s3 and flesh out putObject.
 */
@Injectable()
export class S3StorageService extends StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly bucket: string;
  private readonly endpoint: string | undefined;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.bucket = config.get<string>('app.s3.bucket') ?? 'denta';
    this.endpoint = config.get<string>('app.s3.endpoint');
    this.publicBase =
      config.get<string>('app.storage.publicBaseUrl') ??
      (this.endpoint
        ? `${this.endpoint.replace(/\/$/, '')}/${this.bucket}`
        : `https://${this.bucket}.s3.amazonaws.com`);
    this.logger.log(
      `S3 storage configured (bucket=${this.bucket}, endpoint=${this.endpoint ?? 'aws'})`,
    );
  }

  async upload(input: {
    key: string;
    buffer: Buffer;
    mimeType: string;
    sizeBytes: number;
  }): Promise<{ key: string; url: string; bucket: string }> {
    // Production wiring: @aws-sdk/client-s3 PutObjectCommand.
    // Kept explicit so local DEV never silently depends on MinIO/S3.
    void input;
    throw new Error(
      'S3StorageService.upload is not configured. Set STORAGE_DRIVER=local for development, or wire @aws-sdk/client-s3 for production.',
    );
  }

  async delete(_key: string): Promise<void> {
    throw new Error(
      'S3StorageService.delete is not configured. Wire @aws-sdk/client-s3 for production.',
    );
  }

  getPublicUrl(key: string): string {
    return `${this.publicBase.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }
}
