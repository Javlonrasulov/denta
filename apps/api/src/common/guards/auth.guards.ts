import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export type JwtPayload = {
  sub: string;
  clinicId?: string | null;
  roles: string[];
  type: 'access' | 'refresh';
};

export type AuthUser = {
  id: string;
  clinicId?: string | null;
  roles: string[];
  email?: string | null;
  phone?: string | null;
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    }
    return user;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const roles = request.user?.roles ?? [];
    // Super admin bypass
    if (roles.includes('DENTA_SUPER_ADMIN')) return true;
    // Role → permission expansion (central map)
    const granted = expandPermissions(roles);
    return required.every((p) => granted.has(p));
  }
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
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

function expandPermissions(roles: string[]): Set<string> {
  const set = new Set<string>();
  for (const role of roles) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) set.add(p);
  }
  return set;
}
