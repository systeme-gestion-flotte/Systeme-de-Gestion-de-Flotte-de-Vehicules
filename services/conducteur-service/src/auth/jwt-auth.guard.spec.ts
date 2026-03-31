import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn().mockReturnValue(
    class MockAuthGuard {
      canActivate(_context: any): any {
        return true;
      }
    },
  ),
}));

import { JwtAuthGuard, IS_PUBLIC_KEY } from './jwt-auth.guard';

const mockContext = () => ({
  getHandler: jest.fn().mockReturnValue({}),
  getClass: jest.fn().mockReturnValue({}),
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue({}),
  }),
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new JwtAuthGuard(reflector);
  });

  describe('canActivate', () => {
    it('doit retourner true si la route est publique', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = mockContext();

      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        expect.anything(),
        expect.anything(),
      ]);
    });

    it('doit déléguer à super.canActivate si la route n\'est pas publique', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = mockContext();
      const superProto = Object.getPrototypeOf(JwtAuthGuard.prototype);
      const superSpy = jest.spyOn(superProto, 'canActivate').mockReturnValue(true);

      const result = guard.canActivate(context as any);

      expect(superSpy).toHaveBeenCalledWith(context);
      expect(result).toBe(true);
      superSpy.mockRestore();
    });

    it('doit déléguer à super.canActivate si isPublic est undefined', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = mockContext();
      const superProto = Object.getPrototypeOf(JwtAuthGuard.prototype);
      const superSpy = jest.spyOn(superProto, 'canActivate').mockReturnValue(true);

      guard.canActivate(context as any);

      expect(superSpy).toHaveBeenCalledWith(context);
      superSpy.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('doit retourner l\'utilisateur si valide', () => {
      const user = { userId: '123', username: 'jean.dupont' };
      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('doit lever UnauthorizedException si user est null', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null)).toThrow('Token JWT invalide ou manquant');
    });

    it('doit propager l\'erreur passée en premier argument', () => {
      const error = new UnauthorizedException('Token expiré');
      expect(() => guard.handleRequest(error, null)).toThrow(error);
    });

    it('doit lever l\'erreur si err est fourni même avec un user', () => {
      const error = new UnauthorizedException('Erreur auth');
      expect(() => guard.handleRequest(error, { userId: '1' })).toThrow(error);
    });
  });
});
