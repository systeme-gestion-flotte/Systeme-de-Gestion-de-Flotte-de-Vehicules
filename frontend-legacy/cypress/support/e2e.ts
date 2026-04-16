/// <reference types="cypress" />
// ***********************************************************
// Point d'entrée du support Cypress e2e
// ***********************************************************

import './commands';

// Injecte le stub Keycloak avant chaque test pour bypasser l'auth
// Intercepter les appels Keycloak pour éviter les erreurs réseau
beforeEach(() => {
  cy.intercept('GET', '**/realms/fleet-management/.well-known/**', {
    statusCode: 200,
    body: { issuer: 'http://localhost:9080/realms/fleet-management' }
  });
  cy.intercept('GET', '**/realms/fleet-management/protocol/openid-connect/certs', {
    statusCode: 200,
    body: { keys: [] }
  });
});

// Injecter le stub dans window AVANT chaque chargement de page
Cypress.on('window:before:load', (win) => {
  const role = Cypress.env('CY_ROLE') || 'admin';
  const username = `test-${role}`;
  
  (win as any).__KC_STUB__ = {
    authenticated: true,
    token: 'cypress-fake-token',
    tokenParsed: {
      preferred_username: username,
      email: `${role}@fleet.local`,
      realm_access: { roles: [role, 'offline_access'] },
    },
    hasRealmRole: (r: string) => {
      const roles = [role, 'offline_access'];
      return roles.includes(r);
    },
    logout: () => {},
    updateToken: () => Promise.resolve(true),
  };
});
