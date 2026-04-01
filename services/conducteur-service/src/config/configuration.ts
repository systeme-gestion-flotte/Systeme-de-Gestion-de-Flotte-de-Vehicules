export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL || 'postgresql://admin:adminpassword@localhost:5432/conducteurs',
  },
  kafka: {
    broker: process.env.KAFKA_BROKER || 'localhost:9092',
    groupId: process.env.KAFKA_GROUP_ID || 'conducteur-service-group',
    topics: {
      assignationDemandee: 'fleet.conducteurs.assignation',
      vehiculesEvents: 'vehicle-events',
    },
  },
  keycloak: {
    issuer: process.env.KEYCLOAK_ISSUER || 'http://keycloak:8080/realms/fleet',
    jwksUri: process.env.KEYCLOAK_JWKS_URI || 'http://keycloak:8080/realms/fleet/protocol/openid-connect/certs',
  },
  telemetry: {
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
  },
});
