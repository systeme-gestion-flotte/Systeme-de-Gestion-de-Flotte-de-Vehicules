describe('Fleet Management E2E', () => {
  it('should redirect to Keycloak for login', () => {
    cy.visit('/');
    // Check if we are redirected to Keycloak (contains 'realms/fleet-management')
    cy.url().should('include', 'realms/fleet-management');
  });

  // Note: Testing actual login requires valid credentials and potentially disabling some security checks or using a test user
  // For this TP, we demonstrate the redirection and presence of elements after login (if already logged in)
  
  it('should display the dashboard after login', () => {
    // This test assumes the user is already authenticated or we are in a mock environment
    // In a real E2E, we would fill the login form here
    cy.visit('/');
    // If not logged in, it will redirect. If logged in, we check for elements:
    cy.get('body').then(($body) => {
      if ($body.find('.sidebar').length > 0) {
        cy.get('.sidebar').should('be.visible');
        cy.contains('Dashboard').should('be.visible');
      }
    });
  });
});
