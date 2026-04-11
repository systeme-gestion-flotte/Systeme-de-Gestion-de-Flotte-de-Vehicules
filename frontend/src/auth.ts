import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:9080',
  realm: 'fleet-management',
  clientId: 'fleet-api-gateway',
};

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = (onAuthenticatedCallback: () => void) => {
  keycloak
    .init({
      onLoad: 'login-required',
      checkLoginIframe: false,
      pkceMethod: 'S256',
    })
    .then((authenticated) => {
      if (!authenticated) {
        console.warn('Utilisateur non authentifié !');
      }
      onAuthenticatedCallback();
    })
    .catch((error) => {
      console.error('Erreur lors de l\'initialisation de Keycloak:', error);
    });
};

export default keycloak;
