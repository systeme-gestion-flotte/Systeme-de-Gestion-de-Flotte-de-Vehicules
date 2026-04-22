/**
 * Tests de la page Localisation (carte Leaflet + WebSocket)
 */
describe('Suivi Localisation', () => {
  beforeEach(() => {
    cy.login('admin');
    cy.mockApi();
    cy.visit('/localisation');
    cy.wait('@getPositions');
  });

  it('affiche la page de localisation', () => {
    cy.contains(/suivi/i).should('be.visible');
  });

  it('affiche le conteneur de la carte Leaflet', () => {
    cy.get('[data-testid="leaflet-map"]').should('be.visible');
    // Leaflet rend un canvas ou SVG + tiles
    cy.get('.leaflet-container').should('exist');
  });

  it('affiche l\'indicateur de connexion WebSocket', () => {
    cy.get('[data-testid="ws-status"]').should('be.visible');
  });

  it('affiche l\'état de la connexion WebSocket', () => {
    cy.get('[data-testid="ws-status"]').should('exist');
  });

  it('affiche le panneau latéral des véhicules', () => {
    cy.get('.loc-sidebar').should('be.visible');
    cy.contains('Véhicules').should('be.visible');
  });

  it('affiche un message d\'attente quand aucune position n\'est disponible', () => {
    cy.contains('En attente de données GPS').should('be.visible');
  });

  it('affiche les marqueurs et le panneau si des positions sont injectées', () => {
    // Simuler des positions via l'API
    cy.intercept('GET', 'http://localhost:4000/localisation/positions/latest', {
      body: [
        {
          vehicule_id: 'veh-mock-123',
          immatriculation: 'AB-MOCK-CD',
          statut: 'EN_COURSE',
          latitude: 49.4431,
          longitude: 1.0993,
          vitesse: 62,
          horodatage: new Date().toISOString(),
        },
      ],
    }).as('getPositionsFull');

    cy.visit('/localisation');
    cy.wait('@getPositionsFull');

    cy.get('[data-testid^="vehicle-item-"]').should('have.length.at.least', 1);
    cy.contains('veh-mock-123').should('exist');
    cy.contains('62 km/h').should('exist');
  });

  it('sélectionne un véhicule et affiche ses détails', () => {
    cy.intercept('GET', 'http://localhost:4000/localisation/positions/latest', {
      body: [{
        vehicule_id: 'veh-mock-123',
        immatriculation: 'AB-MOCK-CD',
        statut: 'DISPONIBLE',
        latitude: 49.4431,
        longitude: 1.0993,
        vitesse: 0,
        horodatage: new Date().toISOString(),
      }],
    }).as('getPositionsSingle');

    cy.visit('/localisation');
    cy.wait('@getPositionsSingle');

    cy.get('[data-testid="vehicle-item-veh-mock-123"]').first().click({ force: true });
    cy.get('[data-testid="vehicle-details"]').should('exist');
    cy.get('[data-testid="vehicle-details"]').contains('veh-mock-123').should('exist');
  });
});
