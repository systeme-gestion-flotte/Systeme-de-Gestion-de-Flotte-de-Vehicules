// ***********************************************
// Commandes Cypress personnalisées
// ***********************************************

/**
 * cy.login(role) — bypass Keycloak en interceptant l'initialisation
 * et en injectant un token simulé dans l'état de l'application.
 * Utilisé en tests e2e pour éviter la dépendance au serveur Keycloak.
 */
Cypress.Commands.add('login', (role: 'admin' | 'manager' | 'technicien' | 'utilisateur' = 'admin') => {
  Cypress.env('CY_ROLE', role);
});

/**
 * cy.mockApi() — intercepte les appels REST vers localhost:4000
 * avec des fixtures JSON pour isoler les tests du backend.
 */
Cypress.Commands.add('mockApi', () => {
  cy.intercept('GET', 'http://localhost:4000/vehicules', { fixture: 'vehicles.json' }).as('getVehicules');
  cy.intercept('GET', 'http://localhost:4000/conducteurs', { fixture: 'conducteurs.json' }).as('getConducteurs');
  cy.intercept('GET', 'http://localhost:4000/maintenance/interventions', { fixture: 'maintenance.json' }).as('getInterventions');
  cy.intercept('GET', 'http://localhost:4000/localisation/positions/latest', { body: [] }).as('getPositions');
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
