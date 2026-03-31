import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

const mockExecutionContext = (user: any, handlerRoles: string[] | undefined, classRoles?: string[]) => ({
  getHandler: jest.fn().mockReturnValue({}),
  getClass: jest.fn().mockReturnValue({}),
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue({ user }),
  }),
});

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  it('doit autoriser si aucun rôle requis', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = mockExecutionContext(null, undefined);

    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('doit autoriser si tableau de rôles vide', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const context = mockExecutionContext({ roles: [] }, []);

    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('doit autoriser si l\'utilisateur possède le rôle requis', () => {
    reflector.getAllAndOverride.mockReturnValue(['fleet-manager']);
    const context = mockExecutionContext({ roles: ['fleet-manager', 'user'] }, ['fleet-manager']);

    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('doit autoriser si l\'utilisateur possède l\'un des rôles requis', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin', 'fleet-manager']);
    const context = mockExecutionContext({ roles: ['fleet-manager'] }, ['admin', 'fleet-manager']);

    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('doit lever ForbiddenException si aucun user dans la requête', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = mockExecutionContext(null, ['admin']);

    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context as any)).toThrow('Accès refusé: authentification requise');
  });

  it('doit lever ForbiddenException si l\'utilisateur ne possède pas le rôle requis', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = mockExecutionContext({ roles: ['user'] }, ['admin']);

    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context as any)).toThrow('Accès refusé: rôle requis: admin');
  });

  it('doit vérifier avec getAllAndOverride sur le handler et la classe', () => {
    reflector.getAllAndOverride.mockReturnValue(['driver']);
    const context = mockExecutionContext({ roles: ['driver'] }, ['driver']);

    guard.canActivate(context as any);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
  });
});
