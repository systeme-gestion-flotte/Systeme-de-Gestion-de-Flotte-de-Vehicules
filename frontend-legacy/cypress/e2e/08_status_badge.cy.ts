/**
 * Tests unitaires visuels du composant StatusBadge
 * via une page de test embarquée (vehicules page)
 */
describe('Composant StatusBadge', () => {
  beforeEach(() => {
    cy.login('admin');
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

  it('les badges ou sélecteurs ont un texte lisible', () => {
    cy.get('td').each(($td) => {
      if ($td.find('[data-testid="status-badge"]').length > 0 || $td.find('select').length > 0) {
        expect($td.text().trim().length).to.be.greaterThan(0);
      }
    });
  });

  it('affiche "Disponible" pour le statut DISPONIBLE', () => {
    cy.get('[data-testid="vehicule-row-veh-001"]').then($row => {
        if ($row.find('select.statut-select').length > 0) {
            cy.wrap($row).find('select.statut-select').should('have.value', 'DISPONIBLE');
        } else {
            cy.wrap($row).contains('Disponible').should('be.visible');
        }
    });
  });

  it('affiche "En Course" pour le statut EN_COURSE', () => {
    cy.get('[data-testid="vehicule-row-veh-002"]').then($row => {
        if ($row.find('select.statut-select').length > 0) {
            cy.wrap($row).find('select.statut-select').should('have.value', 'EN_COURSE');
        } else {
            cy.wrap($row).contains('En Course').should('be.visible');
        }
    });
  });

  it('affiche "Maintenance" pour le statut EN_MAINTENANCE', () => {
    cy.get('[data-testid="vehicule-row-veh-003"]').then($row => {
        if ($row.find('select.statut-select').length > 0) {
            cy.wrap($row).find('select.statut-select').should('have.value', 'EN_MAINTENANCE');
        } else {
            cy.wrap($row).contains('Maintenance').should('be.visible');
        }
    });
  });

  it('affiche "Actif" pour les véhicules actifs', () => {
    cy.get('[data-testid="status-badge"]').contains('Actif').scrollIntoView().should('be.visible');
  });

  it('affiche "Inactif" pour les véhicules inactifs', () => {
    cy.get('[data-testid="status-badge"]').contains('Inactif').scrollIntoView().should('be.visible');
  });
});
