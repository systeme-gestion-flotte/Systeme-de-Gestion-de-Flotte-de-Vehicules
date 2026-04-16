import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:9080',
  realm: 'fleet-management',
  clientId: 'fleet-frontend',
};

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = (onAuthenticatedCallback: () => void, onErrorCallback?: (error: any) => void) => {
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
      console.error('Erreur init Keycloak:', error);
      if (onErrorCallback) onErrorCallback(error);
    });
};

export default keycloak;
