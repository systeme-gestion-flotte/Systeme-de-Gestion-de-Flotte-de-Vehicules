/**
 * Tests CRUD de la page Conducteurs
 */
describe('Gestion des Conducteurs', () => {
  beforeEach(() => {
    cy.mockApi();
    cy.visit('/conducteurs');
    cy.wait('@getConducteurs');
  });

  it('affiche la grille des conducteurs', () => {
    cy.get('[data-testid="conducteurs-grid"]').should('be.visible');
    cy.contains('Jean').should('be.visible');
    cy.contains('Sophie').should('be.visible');
  });

  it('affiche les informations de permis pour chaque conducteur', () => {
    cy.contains('Permis B').should('be.visible');
    cy.contains('Permis C').should('be.visible');
  });

  it('affiche les badges actif/inactif', () => {
    cy.get('[data-testid="status-badge"]').should('have.length.at.least', 2);
  });

  it('filtre les conducteurs par la barre de recherche', () => {
    cy.get('[data-testid="search-conducteur"]').type('Sophie');
    cy.contains('Sophie').should('be.visible');
    cy.contains('Jean').should('not.exist');
  });

  it('efface le filtre en vidant la recherche', () => {
    cy.get('[data-testid="search-conducteur"]').type('Sophie').clear();
    cy.contains('Jean').should('be.visible');
    cy.contains('Sophie').should('be.visible');
  });

  it('ouvre le modal de création', () => {
    cy.get('[data-testid="btn-create-conducteur"]').click();
    cy.get('[data-testid="modal-content"]').should('be.visible');
    cy.contains('Nouveau conducteur').should('be.visible');
  });

  it('ferme le modal avec Échap', () => {
    cy.get('[data-testid="btn-create-conducteur"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-testid="modal-content"]').should('not.exist');
  });

  it('valide les champs requis du formulaire conducteur', () => {
    cy.get('[data-testid="btn-create-conducteur"]').click();
    cy.get('[data-testid="input-prenom"]').should('have.attr', 'required');
    cy.get('[data-testid="input-nom"]').should('have.attr', 'required');
    cy.get('[data-testid="input-email"]').should('have.attr', 'required');
    cy.get('[data-testid="input-permis"]').should('have.attr', 'required');
    cy.get('[data-testid="input-expiration"]').should('have.attr', 'required');
  });

  it('soumet le formulaire de création', () => {
    cy.intercept('POST', '**/conducteurs', { statusCode: 201, body: { id: 'cond-new' } }).as('createConducteur');
    cy.intercept('GET', '**/conducteurs', { fixture: 'conducteurs.json' }).as('getConducteursRefresh');

    cy.get('[data-testid="btn-create-conducteur"]').click();
    cy.get('[data-testid="input-prenom"]').type('Marie');
    cy.get('[data-testid="input-nom"]').type('Curie');
    cy.get('[data-testid="input-email"]').type('marie.curie@fleet.local');
    cy.get('[data-testid="input-permis"]').type('MC123456');
    cy.get('[data-testid="input-expiration"]').type('2030-01-01');
    cy.get('[data-testid="create-conducteur-form"]').submit();

    cy.wait('@createConducteur').its('request.body').should('deep.include', {
      prenom: 'Marie',
      nom: 'Curie',
    });
  });

  it('affiche une carte par conducteur avec avatar', () => {
    cy.get('[data-testid^="conducteur-card-"]').should('have.length.at.least', 2);
    cy.get('.avatar-lg').should('have.length.at.least', 2);
  });
});
