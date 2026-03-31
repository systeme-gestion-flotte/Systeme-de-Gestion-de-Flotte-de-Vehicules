import { ConfigService } from '@nestjs/config';

// Mock PassportStrategy before importing JwtStrategy
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: jest.fn().mockImplementation(() => {
    return class MockPassportStrategy {
      constructor() {}
    };
  }),
}));

jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn().mockReturnValue(() => {}),
}));

jest.mock('passport-jwt', () => ({
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(() => {}),
  },
  Strategy: jest.fn(),
}));

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config = {
          'keycloak.jwksUri': 'http://keycloak:8080/realms/fleet/protocol/openid-connect/certs',
          'keycloak.issuer': 'http://keycloak:8080/realms/fleet',
        };
        return config[key];
      }),
    } as any;

    strategy = new JwtStrategy(configService);
  });

  describe('validate', () => {
    it('doit retourner un user à partir des claims JWT', async () => {
      const payload = {
        sub: 'user-123',
        preferred_username: 'jean.dupont',
        email: 'jean.dupont@example.com',
        realm_access: { roles: ['fleet-manager'] },
        resource_access: { 'fleet-app': { roles: ['admin'] } },
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-123',
        username: 'jean.dupont',
        email: 'jean.dupont@example.com',
        roles: ['fleet-manager', 'admin'],
      });
    });

    it('doit retourner des rôles vides si absents du payload', async () => {
      const payload = {
        sub: 'user-456',
        preferred_username: 'marie.martin',
        email: 'marie.martin@example.com',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-456',
        username: 'marie.martin',
        email: 'marie.martin@example.com',
        roles: [],
      });
    });

    it('doit gérer realm_access absent', async () => {
      const payload = {
        sub: 'user-789',
        preferred_username: 'test.user',
        email: 'test@example.com',
        resource_access: { 'fleet-app': { roles: ['driver'] } },
      };

      const result = await strategy.validate(payload);

      expect(result.roles).toEqual(['driver']);
    });

    it('doit gérer resource_access absent', async () => {
      const payload = {
        sub: 'user-101',
        preferred_username: 'another.user',
        email: 'another@example.com',
        realm_access: { roles: ['user'] },
      };

      const result = await strategy.validate(payload);

      expect(result.roles).toEqual(['user']);
    });
  });
});
