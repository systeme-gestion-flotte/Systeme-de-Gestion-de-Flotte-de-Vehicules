# Livrable 1 - Contrats API et configuration Keycloak

Ce document regroupe les elements demandes pour le livrable 1:
- Contrats REST OpenAPI/Swagger
- Contrat GraphQL (schema)
- Configuration Keycloak (realm, roles, clients OAuth2)

## 1) Contrats REST OpenAPI

Les contrats REST sont definis par microservice:
- Vehicule/api/openapi.yaml
- Conducteur/api/openapi.yaml
- maintenance/api/openapi.yaml
- Localisation/api/openapi.yaml
- Evenement/api/openapi.yaml

### Securite OpenAPI

Tous les contrats REST declarent:
- `security` globale basee sur OAuth2 Keycloak
- `components.securitySchemes.oauth2Keycloak` (Authorization Code)
- `components.securitySchemes.bearerAuth` (JWT Bearer, compatibilite)

Endpoints OAuth2 utilises:
- Authorization URL: `http://localhost:8080/realms/fleet-management/protocol/openid-connect/auth`
- Token URL: `http://localhost:8080/realms/fleet-management/protocol/openid-connect/token`

Scopes documentes:
- `utilisateur`
- `technicien`
- `manager`
- `admin`

## 2) Contrat GraphQL

Le schema GraphQL global est defini dans:
- graphql/fleet-schema.graphql

Le schema couvre:
- Domaines: Vehicule, Conducteur, Assignation, Maintenance, Localisation, Evenement
- `Query` pour consultation et dashboards
- `Mutation` pour operations metier
- `Subscription` pour temps reel (position, alertes, changement statut intervention)
- Types, enums et inputs alignes avec les contrats REST

## 3) Configuration Keycloak

Le realm est defini dans:
- realm-fleet.json

### Realm
- Nom: `fleet-management`
- Brute force protection activee
- Politique SSL `external`
- Session/token lifespan de base configure

### Roles
- `admin`
- `manager`
- `technicien`
- `utilisateur`

### Client scopes OAuth2
- `fleet.read`
- `fleet.write`
- `fleet.admin`

### Clients OAuth2/OIDC
- `fleet-frontend`:
  - Public client
  - Authorization Code + PKCE (S256)
  - Redirect URIs localhost (3000, 5173)
- `fleet-api-gateway`:
  - Confidential client
  - Service account active
- `vehicle-service`, `driver-service`, `maintenance-service`, `location-service`, `event-service`:
  - Confidential clients
  - Service accounts actives
  - Secrets a remplacer en environnement reel

## 4) Matrice d'acces recommandee

- `utilisateur`: consultation de ses ressources, operations standard de lecture
- `technicien`: operations de maintenance et consultation technique
- `manager`: creation/modification des ressources metier
- `admin`: administration complete

## 5) Points de verification avant rendu

1. Importer `realm-fleet.json` dans Keycloak (realm import).
2. Remplacer tous les secrets `change-me-*` par des secrets forts.
3. Verifier la recuperation JWT depuis Keycloak avec le frontend.
4. Verifier la validation JWT cote API Gateway/microservices.
5. Generer ou previsualiser Swagger UI pour chaque fichier OpenAPI.
6. Valider le schema GraphQL avec un outil de lint/parse GraphQL.
