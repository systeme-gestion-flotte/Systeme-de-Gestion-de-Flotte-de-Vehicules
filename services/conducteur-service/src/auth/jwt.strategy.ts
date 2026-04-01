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
      issuer,
      algorithms: ['RS256'],
      ignoreExpiration: false,
    });

    this.logger.debug(`Initializing JwtStrategy with:`);
    this.logger.debug(`- jwksUri: ${jwksUri}`);
    this.logger.debug(`- issuer: ${issuer}`);
  }

  async validate(payload: any) {
    this.logger.debug(`JWT validated successfully for user: ${payload.preferred_username}`);
    const roles = payload?.realm_access?.roles || [];
    const azp = payload?.azp;
    const resourceRoles = azp ? (payload?.resource_access?.[azp]?.roles || []) : [];

    return {
      userId: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      roles: [...roles, ...resourceRoles],
    };
  }
}
