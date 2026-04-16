/**
 * Tests CRUD de la page Véhicules
 */
describe('Gestion des Véhicules', () => {
  beforeEach(() => {
    cy.login('admin');
    cy.mockApi();
    cy.visit('/vehicules');
    cy.wait('@getVehicules');
  });

  it('affiche la liste des véhicules', () => {
    cy.get('[data-testid="vehicules-table"]').should('be.visible');
    cy.contains('AB-123-CD').should('be.visible');
    cy.contains('EF-456-GH').should('be.visible');
    cy.contains('IJ-789-KL').should('be.visible');
  });

  it('affiche les badges de statut corrects', () => {
    cy.get('[data-testid="status-badge"]').should('have.length.at.least', 3);
  });

  it('filtre par statut DISPONIBLE', () => {
    cy.contains('button', 'DISPONIBLE').click();
    cy.contains('AB-123-CD').should('be.visible');
    cy.contains('IJ-789-KL').should('not.exist'); // EN_MAINTENANCE
  });

  it('filtre par statut EN_COURSE', () => {
    cy.contains('button', 'EN COURSE').click();
    cy.contains('EF-456-GH').should('be.visible');
    cy.contains('AB-123-CD').should('not.exist');
  });

  it('ouvre le modal de création via le bouton Nouveau', () => {
    cy.get('[data-testid="btn-create-vehicule"]').click();
    cy.get('[data-testid="modal-content"]').should('be.visible');
    cy.contains('Nouveau véhicule').should('be.visible');
  });

  it('ferme le modal avec le bouton ✕', () => {
    cy.get('[data-testid="btn-create-vehicule"]').click();
    cy.get('[data-testid="modal-close"]').click();
    cy.get('[data-testid="modal-content"]').should('not.exist');
  });

  it('ferme le modal avec la touche Échap', () => {
    cy.get('[data-testid="btn-create-vehicule"]').click();
    cy.get('[data-testid="modal-content"]').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('[data-testid="modal-content"]').should('not.exist');
  });

  it('ferme le modal en cliquant sur l\'overlay', () => {
    cy.get('[data-testid="btn-create-vehicule"]').click();
    cy.get('[data-testid="modal-overlay"]').click({ force: true });
    cy.get('[data-testid="modal-content"]').should('not.exist');
  });

  it('soumet le formulaire de création avec des données valides', () => {
    cy.intercept('POST', '**/vehicules', { statusCode: 201, body: { id: 'veh-new', immatriculation: 'QR-999-ST' } }).as('createVehicule');
    cy.intercept('GET', '**/vehicules', { fixture: 'vehicles.json' }).as('getVehiculesRefresh');

    cy.get('[data-testid="btn-create-vehicule"]').click();
    cy.get('[data-testid="input-immatriculation"]').type('QR-999-ST');
    cy.get('[data-testid="input-marque"]').type('Toyota');
    cy.get('[data-testid="input-modele"]').type('Yaris');
    cy.get('[data-testid="input-annee"]').type('2024');
    cy.get('[data-testid="create-vehicule-form"]').submit();

    cy.wait('@createVehicule').its('request.body').should('deep.include', {
      immatriculation: 'QR-999-ST',
      marque: 'Toyota',
      modele: 'Yaris',
      annee: 2024,
    });
  });

  it('affiche les champs requis dans le formulaire', () => {
    cy.get('[data-testid="btn-create-vehicule"]').click();
    cy.get('[data-testid="input-immatriculation"]').should('have.attr', 'required');
    cy.get('[data-testid="input-marque"]').should('have.attr', 'required');
    cy.get('[data-testid="input-modele"]').should('have.attr', 'required');
    cy.get('[data-testid="input-annee"]').should('have.attr', 'required');
  });
});
