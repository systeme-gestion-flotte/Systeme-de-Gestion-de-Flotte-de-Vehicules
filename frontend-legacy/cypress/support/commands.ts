// ***********************************************
// Commandes Cypress personnalisées
// ***********************************************

/**
 * cy.login(role) — bypass Keycloak en interceptant l'initialisation
 * et en injectant un token simulé dans l'état de l'application.
 * Utilisé en tests e2e pour éviter la dépendance au serveur Keycloak.
 */
Cypress.Commands.add('login', (role: 'admin' | 'manager' | 'technicien' | 'utilisateur' = 'admin') => {
  // Stub Keycloak: on injecte un objet keycloak factice sur window
  cy.window().then((win) => {
    const fakeToken = {
      preferred_username: `test-${role}`,
      email: `${role}@fleet.local`,
      realm_access: { roles: [role, 'offline_access'] },
    };

    // Expose un stub global que initKeycloak détectera
    (win as Window & { __KC_STUB__?: unknown }).__KC_STUB__ = {
      authenticated: true,
      token: 'fake-jwt-token',
      tokenParsed: fakeToken,
      hasRealmRole: (r: string) => r === role || r === 'offline_access',
      logout: () => {},
      updateToken: () => Promise.resolve(true),
    };
  });
});

/**
 * cy.mockApi() — intercepte les appels REST vers localhost:4000
 * avec des fixtures JSON pour isoler les tests du backend.
 */
Cypress.Commands.add('mockApi', () => {
  cy.intercept('GET', '**/vehicules', { fixture: 'vehicles.json' }).as('getVehicules');
  cy.intercept('GET', '**/conducteurs', { fixture: 'conducteurs.json' }).as('getConducteurs');
  cy.intercept('GET', '**/maintenance/interventions', { fixture: 'maintenance.json' }).as('getInterventions');
  cy.intercept('GET', '**/localisation/positions/latest', { body: [] }).as('getPositions');
});

// Type augmentation pour TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(role?: 'admin' | 'manager' | 'technicien' | 'utilisateur'): Chainable<void>;
      mockApi(): Chainable<void>;
    }
  }
}

export {};
