import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const jwksUri = configService.get<string>('keycloak.jwksUri');
    const issuer = configService.get<string>('keycloak.issuer');

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: 'account',
      issuer,
      algorithms: ['RS256'],
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const roles = payload?.realm_access?.roles || [];
    const resourceRoles = payload?.resource_access?.['fleet-app']?.roles || [];

    return {
      userId: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      roles: [...roles, ...resourceRoles],
    };
  }
}
