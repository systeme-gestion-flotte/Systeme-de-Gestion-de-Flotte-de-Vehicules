/**
 * Tests de la page Alertes & Incidents
 */
describe('Alertes Système', () => {
  beforeEach(() => {
    cy.login('admin');
    cy.mockApi();
    
    // Mock the alerts endpoint
    cy.intercept('GET', 'http://localhost:4000/alerts', {
      body: [
        {
          id: 'alert-001',
          type: 'critique',
          source: 'veh-001',
          message: 'Température moteur anormalement élevée.',
          time: '14:32:00'
        },
        {
          id: 'alert-002',
          type: 'attention',
          source: 'veh-002',
          message: 'Pression pneu avant gauche faible.',
          time: '10:15:00'
        }
      ]
    }).as('getAlerts');

    cy.visit('/alerts');
    cy.wait('@getAlerts');
  });

  it('affiche la page des alertes', () => {
    cy.contains('Alertes & Incidents').should('be.visible');
  });

  it('affiche le bon nombre d\'alertes', () => {
    // 2 alertes dans le mock
    cy.get('.count-badge').should('contain', '2');
    cy.get('.alerte-item').should('have.length', 2);
  });

  it('affiche les détails critiques correctement', () => {
    cy.contains('Température moteur anormalement élevée.').should('be.visible');
  });

  it('ouvre la modale lors de la consultation', () => {
    cy.contains('button', 'Consulter').first().click();
    cy.get('[data-testid="modal-content"]').should('be.visible');
    cy.contains('Détails de l\'incident').should('be.visible');
    
    // Check modal contents exist
    cy.get('.alerte-detail-view').should('exist');
    
    // Close modal
    cy.contains('button', 'Fermer').click();
  });

  it('permet d\'acquitter une alerte', () => {
    cy.intercept('DELETE', 'http://localhost:4000/alerts/alert-001', {
      statusCode: 200
    }).as('deleteAlert');

    cy.get('.alerte-item').first().contains('button', 'Acquitter').click();
    cy.wait('@deleteAlert');
    
    // The list should now have one remaining alert
    cy.get('.alerte-item').should('have.length', 1);
    // Since badge count is driven by alerts.length locally after filter:
    cy.get('.count-badge').should('contain', '1');
  });
});
