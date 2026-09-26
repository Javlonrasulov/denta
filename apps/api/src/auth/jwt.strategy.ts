import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser, JwtPayload } from '../common/guards/auth.guards';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('app.jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid token type',
      });
    }

    if (payload.membershipId) {
      const membership = await this.prisma.clinicMember.findFirst({
        where: {
          id: payload.membershipId,
          userId: payload.sub,
          isActive: true,
        },
        select: { id: true, clinicId: true, role: true },
      });
      if (!membership) {
        throw new UnauthorizedException({
          statusCode: 401,
          code: 'WORKSPACE_INACTIVE',
          message: 'Active clinic membership required',
        });
      }
      return {
        id: payload.sub,
        clinicId: membership.clinicId,
        membershipId: membership.id,
        roles: [membership.role],
      };
    }

    return {
      id: payload.sub,
      clinicId: payload.clinicId ?? null,
      membershipId: payload.membershipId ?? null,
      roles: payload.roles ?? [],
    };
  }
}
