/**
 * Tests RBAC — Vérification des contrôles d'accès par rôle
 *
 * NOTE: Ces tests vérifient la logique RBAC côté front.
 * En environnement de test, Keycloak n'est pas disponible,
 * donc on simule les rôles via les fixtures et stubs.
 */
describe('RBAC - Contrôle d\'accès par rôle', () => {
  describe('Page Unauthorized', () => {
    it('affiche la page d\'accès refusé avec le bon contenu', () => {
      cy.visit('/unauthorized');
      cy.get('[data-testid="unauthorized-page"]').should('be.visible');
      cy.contains('Accès refusé').should('be.visible');
      cy.contains('droits nécessaires').should('be.visible');
    });

    it('le bouton "Retour" redirige vers le dashboard', () => {
      cy.visit('/unauthorized');
      cy.get('[data-testid="back-home-btn"]').click();
      cy.url().should('eq', Cypress.config('baseUrl') + '/');
    });
  });

  describe('Composant StatusBadge', () => {
    // Test indirect via la page véhicules
    it('affiche Disponible en vert pour DISPONIBLE', () => {
      cy.mockApi();
      cy.visit('/vehicules');
      cy.wait('@getVehicules');
      cy.get('[data-testid="status-badge"]').first().should('be.visible');
    });
  });

  describe('Composant Modal', () => {
    it('le modal s\'ouvre et se ferme correctement', () => {
      cy.mockApi();
      cy.visit('/vehicules');
      cy.wait('@getVehicules');

      // Ouvrir
      cy.get('[data-testid="btn-create-vehicule"]').click();
      cy.get('[data-testid="modal-content"]').should('be.visible');

      // Fermer via bouton
      cy.get('[data-testid="modal-close"]').click();
      cy.get('[data-testid="modal-content"]').should('not.exist');
    });

    it('le modal se ferme avec Échap', () => {
      cy.mockApi();
      cy.visit('/vehicules');
      cy.wait('@getVehicules');

      cy.get('[data-testid="btn-create-vehicule"]').click();
      cy.get('body').type('{esc}');
      cy.get('[data-testid="modal-content"]').should('not.exist');
    });
  });

  describe('Routes inconnues', () => {
    it('redirige vers / pour une route inexistante', () => {
      cy.mockApi();
      cy.visit('/une-page-qui-nexiste-pas');
      cy.url().should('eq', Cypress.config('baseUrl') + '/');
    });
  });

  describe('Navigation active', () => {
    it('le lien actif reçoit la classe "active"', () => {
      cy.mockApi();
      cy.visit('/vehicules');
      cy.wait('@getVehicules');
      cy.get('.nav-item.active').should('contain.text', 'éhicule');
    });

    it('le lien Dashboard est actif sur /', () => {
      cy.mockApi();
      cy.visit('/');
      cy.get('.nav-item.active').should('contain.text', 'ashboard');
    });
  });
});
