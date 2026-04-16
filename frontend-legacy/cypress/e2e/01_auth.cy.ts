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
      cy.contains('Dashboard').should('be.visible');
      cy.contains('Véhicules').should('be.visible');
      cy.contains('Conducteurs').should('be.visible');
      cy.contains('Localisation').should('be.visible');
      cy.contains('Maintenance').should('be.visible');
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
    cy.contains('Véhicules').click();
    cy.url().should('include', '/vehicules');
  });

  it('navigue vers /conducteurs au clic', () => {
    cy.contains('Conducteurs').click();
    cy.url().should('include', '/conducteurs');
  });

  it('navigue vers /localisation au clic', () => {
    cy.contains('Localisation').click();
    cy.url().should('include', '/localisation');
  });

  it('navigue vers /maintenance au clic', () => {
    cy.contains('Maintenance').click();
    cy.url().should('include', '/maintenance');
  });
});
