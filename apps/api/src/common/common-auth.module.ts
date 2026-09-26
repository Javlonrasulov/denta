import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit/audit.service';
import { PermissionsService } from './permissions/permissions.service';

@Global()
@Module({
  providers: [PermissionsService, AuditService],
  exports: [PermissionsService, AuditService],
})
export class CommonAuthModule {}
