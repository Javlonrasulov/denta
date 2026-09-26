import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  isPrivateStorageKey,
  sanitizeStorageKey,
  StorageService,
  type StorageVisibility,
} from './storage.types';

/**
 * S3-compatible storage (AWS S3 / MinIO).
 * Wired when STORAGE_DRIVER=s3 and @aws-sdk/client-s3 is available.
 * Until credentials + SDK are present, methods fail loudly (no fake success).
 */
@Injectable()
export class S3StorageService extends StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly bucket: string;
  private readonly endpoint: string | undefined;
  private readonly publicBase: string;
  private readonly ready: boolean;

  constructor(private readonly config: ConfigService) {
    super();
    this.bucket = config.get<string>('app.s3.bucket') ?? 'denta';
    this.endpoint = config.get<string>('app.s3.endpoint');
    this.publicBase =
      config.get<string>('app.storage.publicBaseUrl') ??
      (this.endpoint
        ? `${this.endpoint.replace(/\/$/, '')}/${this.bucket}`
        : `https://${this.bucket}.s3.amazonaws.com`);
    const access = config.get<string>('app.s3.accessKey');
    const secret = config.get<string>('app.s3.secretKey');
    this.ready = Boolean(access && secret);
    this.logger.log(
      `S3 storage configured (bucket=${this.bucket}, endpoint=${this.endpoint ?? 'aws'}, ready=${this.ready})`,
    );
  }

  private assertReady(): void {
    if (!this.ready) {
      throw new Error(
        'S3StorageService is not ready. Set S3_ACCESS_KEY + S3_SECRET_KEY, or use STORAGE_DRIVER=local.',
      );
    }
    throw new Error(
      'S3StorageService SDK not wired yet. Install @aws-sdk/client-s3 and implement PutObject/GetSignedUrl, or use STORAGE_DRIVER=local.',
    );
  }

  async upload(input: {
    key: string;
    buffer: Buffer;
    mimeType: string;
    sizeBytes: number;
    visibility?: StorageVisibility;
  }): Promise<{ key: string; url: string; bucket: string }> {
    void input;
    this.assertReady();
    return { key: '', url: '', bucket: this.bucket };
  }

  async delete(_key: string): Promise<void> {
    void _key;
    this.assertReady();
  }

  async exists(_key: string): Promise<boolean> {
    void _key;
    this.assertReady();
    return false;
  }

  getPublicUrl(key: string): string {
    const safe = sanitizeStorageKey(key);
    if (isPrivateStorageKey(safe)) {
      return `${this.publicBase.replace(/\/$/, '')}/${safe}`;
    }
    return `${this.publicBase.replace(/\/$/, '')}/${safe}`;
  }

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    void expiresInSeconds;
    void sanitizeStorageKey(key);
    this.assertReady();
    return '';
  }
}
