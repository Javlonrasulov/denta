import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { access, mkdir, unlink, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { dirname, join } from 'path';
import {
  isPrivateStorageKey,
  sanitizeStorageKey,
  StorageService,
  type StorageVisibility,
} from './storage.types';

/**
 * Local filesystem storage.
 * Public avatar/logo keys are served under /uploads/.
 * Private medical keys use private/ prefix — serve via authenticated API proxy only.
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
    await mkdir(join(this.root, 'private'), { recursive: true });
    this.logger.log(`Local storage root: ${this.root}`);
  }

  async upload(input: {
    key: string;
    buffer: Buffer;
    mimeType: string;
    sizeBytes: number;
    visibility?: StorageVisibility;
  }) {
    const visibility =
      input.visibility ??
      (isPrivateStorageKey(input.key) ? 'private' : 'public');
    const key = sanitizeStorageKey(
      visibility === 'private' && !isPrivateStorageKey(input.key)
        ? `private/${input.key}`
        : input.key,
    );
    const fullPath = join(this.root, key);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.buffer);
    const bucket = this.config.get<string>('app.s3.bucket') ?? 'denta-local';
    return {
      key,
      url: this.getPublicUrl(key),
      bucket,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.root, sanitizeStorageKey(key)));
    } catch {
      /* ignore missing */
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(join(this.root, sanitizeStorageKey(key)), constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    const safe = sanitizeStorageKey(key);
    if (isPrivateStorageKey(safe)) {
      // Not a public CDN URL — clients must use authenticated /api/v1/files proxy.
      const apiBase =
        this.config.get<string>('app.appWebUrl')?.replace(/\/$/, '') ??
        'https://denta.taomim.uz';
      return `${apiBase}/api/v1/files/${encodeURIComponent(safe)}`;
    }
    return `${this.publicBase.replace(/\/$/, '')}/${safe}`;
  }

  async getSignedUrl(key: string, _expiresInSeconds = 300): Promise<string> {
    // Local: signed URLs are authenticated API routes (token required by guard).
    void _expiresInSeconds;
    return this.getPublicUrl(sanitizeStorageKey(key));
  }

  resolvePath(key: string): string {
    return join(this.root, sanitizeStorageKey(key));
  }
}
