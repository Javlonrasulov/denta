import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AppError } from '../common/filters/global-exception.filter';
import { Public } from '../common/guards/auth.guards';
import { LegalService } from './legal.service';
import type { LegalDocumentKind } from './legal.types';

const KINDS: readonly LegalDocumentKind[] = ['terms', 'privacy'];

@ApiTags('legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get('versions')
  versions() {
    return this.legal.publicVersions();
  }

  /** Client App (patient) edition of Terms / Privacy. */
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get('client/:kind')
  clientDocument(@Param('kind') kind: string, @Query('locale') locale?: unknown) {
    if (!KINDS.includes(kind as LegalDocumentKind)) {
      throw new AppError('NOT_FOUND', 'Legal document not found', 404);
    }
    return this.legal.getClientDocument(
      kind as LegalDocumentKind,
      typeof locale === 'string' ? locale.slice(0, 16) : undefined,
    );
  }
}
