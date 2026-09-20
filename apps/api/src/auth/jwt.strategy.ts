import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser, JwtPayload } from '../common/guards/auth.guards';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('app.jwt.accessSecret'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (payload.type !== 'access') {
      return null as unknown as AuthUser;
    }
    return {
      id: payload.sub,
      clinicId: payload.clinicId,
      roles: payload.roles ?? [],
    };
  }
}
