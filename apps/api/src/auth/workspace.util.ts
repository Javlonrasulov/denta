import { UserRole } from '@prisma/client';
import { expandEffectivePermissions } from '../common/permissions/permissions';
import { PermissionsService } from '../common/permissions/permissions.service';
import { PrismaService } from '../prisma/prisma.service';

export type WorkspaceDto = {
  clinicId: string;
  clinicName: string;
  membershipId: string;
  role: UserRole;
  isActive: boolean;
};

export type ActiveWorkspaceDto = WorkspaceDto & {
  permissions: string[];
};

export async function listActiveWorkspaces(
  prisma: PrismaService,
  userId: string,
): Promise<WorkspaceDto[]> {
  const members = await prisma.clinicMember.findMany({
    where: { userId, isActive: true },
    include: { clinic: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return members.map((m) => ({
    clinicId: m.clinicId,
    clinicName: m.clinic.name,
    membershipId: m.id,
    role: m.role,
    isActive: m.isActive,
  }));
}

export async function resolveWorkspaceSelection(input: {
  prisma: PrismaService;
  permissions: PermissionsService;
  userId: string;
  preferredMembershipId?: string | null;
  preferredClinicId?: string | null;
}): Promise<{
  workspaces: WorkspaceDto[];
  active: ActiveWorkspaceDto | null;
  requiresWorkspaceSelection: boolean;
  roles: string[];
}> {
  const workspaces = await listActiveWorkspaces(input.prisma, input.userId);

  let chosen: WorkspaceDto | null = null;
  if (input.preferredMembershipId) {
    chosen =
      workspaces.find((w) => w.membershipId === input.preferredMembershipId) ??
      null;
  }
  if (!chosen && input.preferredClinicId) {
    chosen =
      workspaces.find((w) => w.clinicId === input.preferredClinicId) ?? null;
  }
  if (!chosen && workspaces.length === 1) {
    chosen = workspaces[0];
  }

  const requiresWorkspaceSelection = workspaces.length > 1 && !chosen;

  if (!chosen) {
    // Patient-only / no membership: fall back to global role assignments
    const roleRows = await input.prisma.userRoleAssignment.findMany({
      where: { userId: input.userId },
    });
    return {
      workspaces,
      active: null,
      requiresWorkspaceSelection,
      roles: roleRows.map((r) => r.role),
    };
  }

  const perms = await input.permissions.getEffectivePermissions({
    roles: [chosen.role],
    membershipId: chosen.membershipId,
  });

  return {
    workspaces,
    active: { ...chosen, permissions: perms },
    requiresWorkspaceSelection: false,
    roles: [chosen.role],
  };
}
