import { Injectable } from '@nestjs/common';
import {
  expandEffectivePermissions,
  type PermissionOverride,
} from '../permissions/permissions';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberOverrides(membershipId: string): Promise<PermissionOverride[]> {
    const rows = await this.prisma.clinicMemberPermission.findMany({
      where: { clinicMemberId: membershipId },
    });
    return rows.map((r) => ({ permission: r.permission, effect: r.effect }));
  }

  async getEffectivePermissions(input: {
    roles: string[];
    membershipId?: string | null;
  }): Promise<string[]> {
    if (input.roles.includes('DENTA_SUPER_ADMIN')) {
      return ['*'];
    }
    const overrides = input.membershipId
      ? await this.getMemberOverrides(input.membershipId)
      : [];
    return [...expandEffectivePermissions(input.roles, overrides)];
  }

  async hasAll(input: {
    roles: string[];
    membershipId?: string | null;
    required: string[];
  }): Promise<boolean> {
    if (input.roles.includes('DENTA_SUPER_ADMIN')) return true;
    const granted = new Set(
      await this.getEffectivePermissions({
        roles: input.roles,
        membershipId: input.membershipId,
      }),
    );
    return input.required.every((p) => granted.has(p));
  }
}
