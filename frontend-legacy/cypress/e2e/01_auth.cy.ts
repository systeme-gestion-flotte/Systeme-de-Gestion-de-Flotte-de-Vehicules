/**
 * Tests d'authentification et de navigation de base
 * Vérifie que l'application démarre, affiche le sidebar et la topbar
 */
describe('Authentification & Navigation', () => {
  beforeEach(() => {
    cy.mockApi();
    cy.visit('/');
  });

  it('affiche la sidebar avec les liens de navigation', () => {
    cy.get('.sidebar').should('be.visible');
    cy.contains('FleetX').should('be.visible');
    cy.get('.sidebar-nav').within(() => {
      cy.contains(/dashboard/i).should('be.visible');
      cy.contains(/véhicules/i).should('be.visible');
      cy.contains(/conducteurs/i).should('be.visible');
      cy.contains(/localisation/i).should('be.visible');
      cy.contains(/maintenance/i).should('be.visible');
    });
  });

  it('affiche la topbar avec le nom d\'utilisateur', () => {
    cy.get('.topbar').should('be.visible');
    cy.get('[data-testid="user-avatar"]').should('be.visible');
  });

  it('affiche le bouton Déconnexion dans la sidebar', () => {
    cy.contains('Déconnexion').should('be.visible');
  });

  it('navigue vers la page Dashboard par défaut', () => {
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
  });

  it('navigue vers /vehicules au clic', () => {
    cy.contains(/véhicules/i).click();
    cy.url().should('include', '/vehicules');
  });

  it('navigue vers /conducteurs au clic', () => {
    cy.contains(/conducteurs/i).click();
    cy.url().should('include', '/conducteurs');
  });

  it('navigue vers /localisation au clic', () => {
    cy.contains(/localisation/i).click();
    cy.url().should('include', '/localisation');
  });

  it('navigue vers /maintenance au clic', () => {
    cy.contains(/maintenance/i).click();
    cy.url().should('include', '/maintenance');
  });
});
