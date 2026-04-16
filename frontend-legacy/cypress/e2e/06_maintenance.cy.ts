/**
 * Tests de la page Maintenance
 */
describe('Gestion Maintenance', () => {
  beforeEach(() => {
    cy.mockApi();
    cy.visit('/maintenance');
    cy.wait('@getInterventions');
  });

  it('affiche la liste des interventions', () => {
    cy.get('[data-testid="interventions-list"]').should('be.visible');
  });

  it('affiche les 4 interventions de la fixture', () => {
    cy.get('[data-testid^="intervention-card-"]').should('have.length', 4);
  });

  it('affiche les KPI planifiées/en cours/terminées', () => {
    cy.contains('Planifiées').should('be.visible');
    cy.contains('En cours').should('be.visible');
    cy.contains('Terminées').should('be.visible');
  });

  it('affiche les valeurs KPI correctes', () => {
    // 1 PLANIFIEE, 1 EN_COURS, 1 TERMINEE dans la fixture
    cy.get('.kpi-value').eq(0).should('contain', '1'); // planifiées
    cy.get('.kpi-value').eq(1).should('contain', '1'); // en cours
    cy.get('.kpi-value').eq(2).should('contain', '1'); // terminées
  });

  it('filtre par statut PLANIFIEE', () => {
    cy.contains('button', 'PLANIFIEE').click();
    cy.get('[data-testid^="intervention-card-"]').should('have.length', 1);
    cy.contains('Pneus').should('be.visible');
  });

  it('filtre par statut TERMINEE', () => {
    cy.contains('button', 'TERMINEE').click();
    cy.get('[data-testid^="intervention-card-"]').should('have.length', 1);
    cy.contains('Reparation').should('be.visible');
  });

  it('filtre par statut ANNULEE', () => {
    cy.contains('button', 'ANNULEE').click();
    cy.get('[data-testid^="intervention-card-"]').should('have.length', 1);
  });

  it('affiche le bouton Démarrer sur les interventions PLANIFIEE', () => {
    cy.get('[data-testid="btn-start-intervention"]').should('have.length.at.least', 1);
  });

  it('affiche le bouton Terminer sur les interventions EN_COURS', () => {
    cy.get('[data-testid="btn-finish-intervention"]').should('have.length.at.least', 1);
  });

  it('change le statut d\'une intervention en EN_COURS', () => {
    cy.intercept('PATCH', '**/maintenance/interventions/maint-002/statut', { statusCode: 200, body: {} }).as('startIntervention');
    cy.intercept('GET', '**/maintenance/interventions', { fixture: 'maintenance.json' }).as('refreshInterventions');

    cy.get('[data-testid="btn-start-intervention"]').first().click();
    cy.wait('@startIntervention').its('request.body').should('deep.equal', { statut: 'EN_COURS' });
  });

  it('ouvre le modal de création d\'intervention', () => {
    cy.get('[data-testid="btn-create-intervention"]').click();
    cy.get('[data-testid="modal-content"]').should('be.visible');
    cy.contains('Nouvelle intervention').should('be.visible');
  });

  it('soumet le formulaire de création', () => {
    cy.intercept('POST', '**/maintenance/interventions', { statusCode: 201, body: { id: 'maint-new' } }).as('createIntervention');
    cy.intercept('GET', '**/maintenance/interventions', { fixture: 'maintenance.json' }).as('refreshInterventions');

    cy.get('[data-testid="btn-create-intervention"]').click();
    cy.get('[data-testid="input-vehicule-id"]').type('veh-001');
    cy.get('[data-testid="input-description"]').type('Test intervention Cypress');
    cy.get('input[name="dateDebut"]').type('2026-04-20T10:00');
    cy.get('[data-testid="create-intervention-form"]').submit();

    cy.wait('@createIntervention').its('request.body').should('include', {
      vehiculeId: 'veh-001',
      description: 'Test intervention Cypress',
    });
  });

  it('affiche les immatriculations dans les cartes', () => {
    cy.contains('IJ-789-KL').should('be.visible');
    cy.contains('AB-123-CD').should('be.visible');
  });

  it('affiche les coûts des interventions', () => {
    cy.contains('350.00 €').should('be.visible');
    cy.contains('480.00 €').should('be.visible');
    cy.contains('620.00 €').should('be.visible');
  });
});
