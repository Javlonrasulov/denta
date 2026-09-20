import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { dirname, join } from 'path';
import { StorageService } from './storage.types';

/**
 * Local filesystem storage for development.
 * Files land under STORAGE_LOCAL_DIR (default: apps/api/.uploads).
 */
@Injectable()
export class LocalStorageService extends StorageService implements OnModuleInit {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly root: string;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.root =
      config.get<string>('app.storage.localDir') ||
      join(process.cwd(), '.uploads');
    const port = config.get<number>('app.port') ?? 4000;
    this.publicBase =
      config.get<string>('app.storage.publicBaseUrl') ||
      `http://localhost:${port}/uploads`;
  }

  async onModuleInit() {
    await mkdir(this.root, { recursive: true });
    this.logger.log(`Local storage root: ${this.root}`);
  }

  async upload(input: {
    key: string;
    buffer: Buffer;
    mimeType: string;
    sizeBytes: number;
  }) {
    const fullPath = join(this.root, input.key);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.buffer);
    const bucket =
      this.config.get<string>('app.s3.bucket') ?? 'denta-local';
    return {
      key: input.key,
      url: this.getPublicUrl(input.key),
      bucket,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.root, key));
    } catch {
      /* ignore missing */
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicBase.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }
}
