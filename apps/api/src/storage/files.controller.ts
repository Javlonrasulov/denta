import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guards';
import { LocalStorageService } from './local-storage.service';
import {
  isPrivateStorageKey,
  sanitizeStorageKey,
  STORAGE_SERVICE,
  StorageService,
} from './storage.types';

/**
 * Authenticated proxy for private uploads (medical/patient files).
 * Public avatars/logos continue to use /uploads/ static serving.
 */
@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly local: LocalStorageService,
    private readonly config: ConfigService,
  ) {}

  @Get('*path')
  async getPrivate(
    @Param('path') path: string | string[],
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = Array.isArray(path) ? path.join('/') : String(path ?? '');
    const key = sanitizeStorageKey(decodeURIComponent(raw));

    if (!isPrivateStorageKey(key)) {
      throw new ForbiddenException({
        code: 'PUBLIC_FILE',
        message: 'Use /uploads/ for public assets',
      });
    }

    const parts = key.split('/');
    const clinicFromKey =
      parts[0] === 'private' ||
      parts[0] === 'patients' ||
      parts[0] === 'medical'
        ? parts[1]
        : null;
    if (
      clinicFromKey &&
      user.clinicId &&
      clinicFromKey !== user.clinicId &&
      !user.roles.includes('DENTA_SUPER_ADMIN')
    ) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'File belongs to another clinic',
      });
    }

    const exists = await this.storage.exists(key);
    if (!exists) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'File not found',
      });
    }

    const driver = (
      this.config.get<string>('app.storage.driver') ?? 'local'
    ).toLowerCase();
    if (driver === 'local') {
      const full = this.local.resolvePath(key);
      res.setHeader('Cache-Control', 'private, no-store');
      return new StreamableFile(createReadStream(full));
    }

    const signed = await this.storage.getSignedUrl(key, 300);
    res.redirect(signed);
    return undefined;
  }
}
