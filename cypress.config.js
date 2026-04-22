module.exports = {
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'frontend-legacy/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'frontend-legacy/cypress/support/e2e.ts',
    fixturesFolder: 'frontend-legacy/cypress/fixtures',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
};


