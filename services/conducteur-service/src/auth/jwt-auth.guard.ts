import { ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';

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

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info?: any) {
    if (err || !user) {
      const logger = new Logger('JwtAuthGuard');
      logger.error(`Validation failed: ${err?.message || info?.message || 'No user/token found'}`);
      throw err || new UnauthorizedException('Token JWT invalide ou manquant');
    }
    return user;
  }
}
