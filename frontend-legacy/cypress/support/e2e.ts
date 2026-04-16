/// <reference types="cypress" />
// ***********************************************************
// Point d'entrée du support Cypress e2e
// ***********************************************************

import './commands';

// Injecte le stub Keycloak avant chaque test pour bypasser l'auth
beforeEach(() => {
  // Intercepter les appels Keycloak pour éviter les erreurs réseau
  cy.intercept('GET', '**/realms/fleet-management/.well-known/**', {
    statusCode: 200,
    body: { issuer: 'http://localhost:9080/realms/fleet-management' }
  });
  cy.intercept('GET', '**/realms/fleet-management/protocol/openid-connect/certs', {
    statusCode: 200,
    body: { keys: [] }
  });

  // Injecter le stub dans window AVANT le chargement de la page
  cy.window().then((win) => {
    (win as any).__KC_STUB__ = {
      authenticated: true,
      token: 'cypress-fake-token',
      tokenParsed: {
        preferred_username: 'admin-fleet',
        email: 'admin@fleet.local',
        realm_access: { roles: ['admin', 'offline_access'] },
      },
      hasRealmRole: (r: string) => ['admin', 'offline_access'].includes(r),
      logout: () => {},
      updateToken: () => Promise.resolve(true),
    };
  });
});
