/**
 * Tests unitaires visuels du composant StatusBadge
 * via une page de test embarquée (vehicules page)
 */
describe('Composant StatusBadge', () => {
  beforeEach(() => {
    cy.login('utilisateur');
    cy.mockApi();
    cy.visit('/vehicules');
    cy.wait('@getVehicules');
  });

  it('rend des badges pour tous les statuts présents dans la fixture', () => {
    // La fixture contient DISPONIBLE, EN_COURSE, EN_MAINTENANCE
    cy.get('[data-testid="status-badge"]').should('have.length.at.least', 4);
  });

  it('les badges ont une couleur de fond', () => {
    cy.get('[data-testid="status-badge"]').first().should('have.css', 'background-color');
  });

  it('les badges ont un texte lisible', () => {
    cy.get('[data-testid="status-badge"]').each(($badge) => {
      expect($badge.text().trim().length).to.be.greaterThan(0);
    });
  });

  it('affiche "Disponible" pour le statut DISPONIBLE', () => {
    cy.get('[data-testid="status-badge"]').contains('Disponible').should('be.visible');
  });

  it('affiche "En Course" pour le statut EN_COURSE', () => {
    cy.get('[data-testid="status-badge"]').contains('En Course').should('be.visible');
  });

  it('affiche "Maintenance" pour le statut EN_MAINTENANCE', () => {
    cy.get('[data-testid="status-badge"]').contains('Maintenance').should('be.visible');
  });

  it('affiche "Actif" pour les véhicules actifs', () => {
    cy.get('[data-testid="status-badge"]').contains('Actif').should('be.visible');
  });

  it('affiche "Inactif" pour les véhicules inactifs', () => {
    cy.get('[data-testid="status-badge"]').contains('Inactif').should('be.visible');
  });
});
