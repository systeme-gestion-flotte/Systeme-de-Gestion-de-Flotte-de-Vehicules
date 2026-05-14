describe('Smoke Test', () => {
  it('loads the homepage', () => {
    cy.mockApi();
    cy.visit('/');
    cy.get('body').should('exist');
  });
});
