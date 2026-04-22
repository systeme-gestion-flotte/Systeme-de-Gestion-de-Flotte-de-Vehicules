# Documentation API / Architecture d'Intégration

Ce document liste les principes d'intégration, l'architecture des microservices et indique comment utiliser les API REST de la Gateway unifiée.

## 1. Architecture Globale (API Gateway)

Plutôt que d'exposer publiquement les 5 microservices métiers sur des ports distincts, le système utilise une **API Gateway unifiée** (Express / Apollo) qui se charge de :
1. **Routage de requêtes HTTP (Proxying REST)**
2. **Exposition d'appels GraphQL fédérés**

**URL de base de l'API externe :** `http://localhost:4000`

### 1.1 Microservices Sous-jacents

- **`vehicule-service`** (Java/Spring) : Gère le CRUD des véhicules.
- **`conducteur-service`** (NestJS) : Gère les conducteurs et les assignations (via saga Kafka).
- **`maintenance-service`** (FastAPI) : Gère le cycle de vie des révisions et réparations.
- **`evenement-service`** (FastAPI) : S'occupe du traitement analytique et des alertes.
- **`localisation-service`** (Node.js/TimescaleDB) : Traitement de la télémétrie spatiale et du geofencing.

## 2. Spécifications OpenAPI

Chaque microservice dispose de sa spécification OpenAPI complète et contractuelle. Vous pouvez trouver les fichiers source dans le dossier :
`gateway/openapi/`

La liste des fichiers de référence inclus dans ce projet :
- `vehicule-openapi.yaml` : Paramètres complets pour le CRUD véhicule (incluant la mise à jour des kilométrages).
- `conducteur-openapi.yaml` : Gestion des conducteurs.
- `maintenance-openapi.yaml` : CRUD des interventions.
- `localisation-openapi.yaml` : Requêtes télémetriques et zones.
- `evenement-openapi.yaml` : Consultation des alertes temps réel.

## 3. Principaux Endpoints REST (Accessibles via la Gateway)

Toutes les requêtes ci-dessous nécessitent un header d'authentification valide `Authorization: Bearer <TOKEN_JWT_KEYCLOAK>`, avec des rôles adéquats selon l'action (ex: `manager` ou `admin` pour des écritures).

| Endpoint Gateway | Verbes HTTP supportés | Service Cible | Description |
| :--- | :--- | :--- | :--- |
| `/vehicules` | `GET`, `POST` | `vehicule-service` | Liste les véhicules ou crée un nouveau véhicule. |
| `/vehicules/{id}` | `GET`, `PUT`, `DELETE` | `vehicule-service` | Opérations unitaires sur un véhicule. |
| `/vehicules/{id}/statut` | `PATCH` | `vehicule-service` | Met à jour uniquement le statut (ex: `EN_COURSE`). |
| `/conducteurs` | `GET`, `POST` | `conducteur-service` | Gestion des conducteurs (un `GET` d'un paramètre liste retourne l'entièreté des conducteurs). |
| `/maintenance` | `GET`, `POST`, `PUT`, `DELETE`| `maintenance-service` | Interface des opérations de maintenance logicielle. |
| `/localisation/positions/{vehicule_id}`| `GET` | `localisation-service` | Profil d'historique ou dernière position GPS via base Time Series. |
| `/alerts` | `GET` | `evenement-service` | Récupère l'historique des alertes levées par le moteur. |

## 4. Authentification (Tokens Keycloak)

Le système IAM responsable de la sécurisation est Keycloak (OAuth2 / OIDC). Pour interagir avec l'API Gateway hors interface web, un token d'accès doit être fourni :

**Point d'accès Token Endpoint :**
`http://localhost:9080/realms/fleet-management/protocol/openid-connect/token`

**Exemple d'obtention de token (grant type password) :**
```bash
curl -X POST 'http://localhost:9080/realms/fleet-management/protocol/openid-connect/token' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'client_id=fleet-frontend' \
--data-urlencode 'username=manager-fleet' \
--data-urlencode 'password=manager1234!'
```
*Extrayez le paramètre JSON `access_token` de la réponse, et placez-le dans le Header de vos requêtes HTTP : `Authorization: Bearer my-token`.*
