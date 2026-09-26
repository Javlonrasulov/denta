import { PermissionEffect, UserRole } from '@prisma/client';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  CLINIC_OWNER: [
    'clinic:read',
    'clinic:update',
    'doctor:manage',
    'patient:read',
    'patient:write',
    'appointment:create',
    'appointment:update',
    'finance:read',
    'finance:write',
    'inventory:manage',
    'reports:read',
    'settings:manage',
    'members:manage',
  ],
  CLINIC_ADMIN: [
    'clinic:read',
    'clinic:update',
    'doctor:manage',
    'patient:read',
    'patient:write',
    'appointment:create',
    'appointment:update',
    'finance:read',
    'inventory:manage',
    'reports:read',
    'members:manage',
  ],
  RECEPTIONIST: [
    'clinic:read',
    'patient:read',
    'patient:write',
    'appointment:create',
    'appointment:update',
  ],
  ACCOUNTANT: ['clinic:read', 'finance:read', 'finance:write', 'reports:read'],
  DOCTOR: [
    'clinic:read',
    'patient:read',
    'appointment:create',
    'appointment:update',
    'finance:read',
  ],
  PATIENT: ['appointment:create', 'appointment:update'],
};

export const ALL_MANAGEABLE_PERMISSIONS = [
  'clinic:read',
  'clinic:update',
  'doctor:manage',
  'patient:read',
  'patient:write',
  'patient:update',
  'appointment:create',
  'appointment:update',
  'finance:read',
  'finance:write',
  'inventory:read',
  'inventory:manage',
  'reports:read',
  'settings:manage',
  'members:manage',
] as const;

export type PermissionOverride = {
  permission: string;
  effect: PermissionEffect | 'ALLOW' | 'DENY';
};

export function roleDefaultPermissions(roles: string[]): Set<string> {
  const set = new Set<string>();
  for (const role of roles) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) set.add(p);
  }
  // Capability implications
  if (set.has('inventory:manage')) set.add('inventory:read');
  if (set.has('patient:write')) set.add('patient:update');
  return set;
}

/** role defaults + ALLOW − DENY (DENY wins). */
export function expandEffectivePermissions(
  roles: string[],
  overrides: PermissionOverride[] = [],
): Set<string> {
  const granted = roleDefaultPermissions(roles);
  for (const o of overrides) {
    const effect = String(o.effect);
    if (effect === 'ALLOW') {
      granted.add(o.permission);
      if (o.permission === 'inventory:manage') granted.add('inventory:read');
      if (o.permission === 'patient:write') granted.add('patient:update');
    }
  }
  for (const o of overrides) {
    const effect = String(o.effect);
    if (effect === 'DENY') {
      granted.delete(o.permission);
      if (o.permission === 'patient:update' || o.permission === 'patient:write') {
        granted.delete('patient:update');
        granted.delete('patient:write');
      }
      if (o.permission === 'inventory:manage') {
        granted.delete('inventory:manage');
        // read may still be explicitly ALLOW'd — only remove if not re-allowed
      }
      if (o.permission === 'inventory:read') {
        granted.delete('inventory:read');
      }
    }
  }
  return granted;
}

export function staffRolesFromMembership(role: UserRole): string[] {
  return [role];
}

export const ASSIGNABLE_STAFF_ROLES: UserRole[] = [
  UserRole.CLINIC_ADMIN,
  UserRole.RECEPTIONIST,
  UserRole.ACCOUNTANT,
  UserRole.DOCTOR,
];
