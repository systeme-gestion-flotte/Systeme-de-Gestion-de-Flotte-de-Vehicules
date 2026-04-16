import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:9080',
  realm: 'fleet-management',
  clientId: 'fleet-frontend',
};

const keycloak = new Keycloak(keycloakConfig);

/** Initialise Keycloak en mode silencieux (pas de redirection automatique). */
export const initKeycloak = (
  onReady: () => void,
  onErrorCallback?: (error: unknown) => void,
) => {
  keycloak
    .init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
      pkceMethod: 'S256',
    })
    .then(() => onReady())
    .catch((error) => {
      console.error("Erreur d'initialisation Keycloak :", error);
      onErrorCallback?.(error);
    });
};

/** Décode un JWT sans vérification de signature (client-side uniquement). */
function parseJwt(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      ),
    );
  } catch {
    return {};
  }
}

/**
 * Authentifie un utilisateur via le formulaire personnalisé (Direct Access Grant).
 * Nécessite que le client Keycloak ait "Direct Access Grants" activé.
 */
export const loginWithCredentials = async (
  username: string,
  password: string,
): Promise<void> => {
  const url = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: keycloakConfig.clientId,
      username,
      password,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { error_description?: string }).error_description ??
        'Identifiants incorrects',
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    id_token?: string;
  };

  // Injecte les tokens dans l'instance Keycloak pour que le reste de l'app
  // fonctionne normalement (keycloak.token, keycloak.hasRealmRole, etc.)
  (keycloak as unknown as Record<string, unknown>).authenticated = true;
  keycloak.token        = data.access_token;
  keycloak.refreshToken = data.refresh_token;
  keycloak.idToken      = data.id_token;
  keycloak.tokenParsed  = parseJwt(data.access_token) as Keycloak['tokenParsed'];
};

export default keycloak;
