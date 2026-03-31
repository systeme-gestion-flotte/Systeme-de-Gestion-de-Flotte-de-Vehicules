import configuration from './configuration';

describe('configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('doit retourner la configuration par défaut', () => {
    delete process.env.PORT;
    delete process.env.DATABASE_URL;
    delete process.env.KAFKA_BROKER;
    delete process.env.KAFKA_GROUP_ID;
    delete process.env.KEYCLOAK_ISSUER;
    delete process.env.KEYCLOAK_JWKS_URI;
    delete process.env.JAEGER_ENDPOINT;

    const config = configuration();

    expect(config.port).toBe(3000);
    expect(config.database.url).toBe('postgresql://admin:adminpassword@localhost:5432/conducteurs');
    expect(config.kafka.broker).toBe('localhost:9092');
    expect(config.kafka.groupId).toBe('conducteur-service-group');
    expect(config.kafka.topics.assignationDemandee).toBe('fleet.conducteurs.assignation');
    expect(config.kafka.topics.vehiculesEvents).toBe('fleet.vehicules.events');
    expect(config.keycloak.issuer).toBe('http://keycloak:8080/realms/fleet');
    expect(config.keycloak.jwksUri).toBe('http://keycloak:8080/realms/fleet/protocol/openid-connect/certs');
    expect(config.telemetry.jaegerEndpoint).toBe('http://jaeger:14268/api/traces');
  });

  it('doit utiliser les variables d\'environnement si définies', () => {
    process.env.PORT = '4000';
    process.env.DATABASE_URL = 'postgresql://user:pass@db:5432/mydb';
    process.env.KAFKA_BROKER = 'kafka:9092';
    process.env.KAFKA_GROUP_ID = 'my-group';
    process.env.KEYCLOAK_ISSUER = 'http://keycloak:8080/realms/myrealm';
    process.env.KEYCLOAK_JWKS_URI = 'http://keycloak:8080/realms/myrealm/protocol/openid-connect/certs';
    process.env.JAEGER_ENDPOINT = 'http://jaeger:14268/api/traces';

    const config = configuration();

    expect(config.port).toBe(4000);
    expect(config.database.url).toBe('postgresql://user:pass@db:5432/mydb');
    expect(config.kafka.broker).toBe('kafka:9092');
    expect(config.kafka.groupId).toBe('my-group');
    expect(config.keycloak.issuer).toBe('http://keycloak:8080/realms/myrealm');
    expect(config.keycloak.jwksUri).toBe('http://keycloak:8080/realms/myrealm/protocol/openid-connect/certs');
    expect(config.telemetry.jaegerEndpoint).toBe('http://jaeger:14268/api/traces');
  });

  it('doit parser le port en entier', () => {
    process.env.PORT = '8080';
    const config = configuration();
    expect(config.port).toBe(8080);
    expect(typeof config.port).toBe('number');
  });

  it('doit utiliser le port par défaut 3000 si PORT n\'est pas un nombre', () => {
    process.env.PORT = 'invalide';
    const config = configuration();
    expect(config.port).toBe(3000);
  });
});
