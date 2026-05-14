# Guide d'Installation et de Déploiement

Ce guide détaille les étapes nécessaires pour installer et déployer le Système de Gestion de Flotte de Véhicules sur votre environnement local avec Docker.

## 1. Prérequis

Avant de commencer, assurez-vous de disposer des éléments suivants sur votre machine :
- **Git** : pour cloner le dépôt.
- **Docker** : version 20.10.x ou supérieure (avec Docker Engine démarré).
- **Docker Compose** : version plugin V2.

*Optionnel pour le développement local hors Docker :*
- **Java 17** et **Maven** (pour les services Spring Boot).
- **Node.js 18+** et **npm** (pour les services TypeScript/NestJS).
- **Python 3.10+** (pour les services FastAPI).

## 2. Installation (Déploiement Complet Clé en Main)

L'ensemble de l'infrastructure (bases de données, courtiers de messages, backend, et frontend) est conteneurisé.

### Étape 1 : Cloner le dépôt
```bash
git clone <url-du-repo>
cd Systeme-de-Gestion-de-Flotte-de-Vehicules
```

### Étape 2 : Démarrer l'infrastructure
Lancer la pile Docker complète. L'option `--build` permet de forcer la reconstruction des images personnalisées (microservices).
```bash
docker compose up -d --build
```

### Étape 3 : Initialisation et Seeding
Lors du démarrage :
1. Les bases de données PostgreSQL et TimescaleDB sont initialisées via `database/init-databases.sql`.
2. Le conteneur **Keycloak** importe sa configuration initiale (`auth/realm-export.json`).
3. Le conteneur **db-seeder** peuple automatiquement les tables (`vehicules`, `conducteurs`, etc.) avec des jeux de données fictifs pour pouvoir tester l'application directement.

## 3. Accès aux Services et Interfaces

Une fois les conteneurs démarrés, voici comment accéder aux différentes briques de l'application :

| Interface / Service | URL d'accès | Identifiants par défaut | Description |
| :--- | :--- | :--- | :--- |
| **Interface Frontend (React)** | [http://localhost:5173](http://localhost:5173) | Voir section Utilisateurs (Keycloak) | L'application web principale. |
| **API Gateway (Apollo GraphQL)** | [http://localhost:4000](http://localhost:4000) | Requiert JWT | Point d'entrée unifié pour toutes les requêtes REST et GraphQL. |
| **Keycloak (Console d'administration)** | [http://localhost:9080](http://localhost:9080) | `admin` / `admin` | Gestionnaire d'identités (IAM) et SSO de l'application. |
| **Grafana (Dashboards)** | [http://localhost:3101](http://localhost:3101) | `admin` / `admin` | Visualisation des métriques, logs et traces. |
| **Kafka UI** | [http://localhost:8085](http://localhost:8085) | Sans authentification | Interface pour inspecter les topics et événements Kafka. |
| **Jaeger UI (Traces)** | [http://localhost:16686](http://localhost:16686) | Sans authentification | Interface pour l'analyse des traces OpenTelemetry. |

## 4. Utilisateurs de test (Keycloak)

L'application sécurise les accès via Role-Based Access Control (RBAC). Vous pouvez utiliser ces comptes de test pour expérimenter les différentes fonctionnalités :

- **Administrateur** (`admin-fleet` / `Admin1234!`) : Accès total à tous les modules.
- **Manager** (`manager-fleet` / `manager1234!`) : Gestion opérationnelle (création, assignation).
- **Technicien** (`technicien-fleet` / `technicien1234!`) : Accès focalisé sur le module de gestion des maintenances.
- **Conducteur** (`conducteur-fleet` / `conducteur1234!`) : Accès limité, visualisation de profil et alertes de maintenance.

## 5. Dépannage Basique

**Re-création propre des données :**
Si l'application est dans un état instable, vous pouvez purger complètement les données et redémarrer :
```bash
docker compose down -v
docker compose up -d --build
```
*(Le tag `-v` supprime tous les volumes nommés, effaçant ainsi les bases de données et topics Kafka).*

**Vérification des logs :**
Pour vérifier le comportement d'un service spécifique (ex: le service véhicules ou la Gateway) :
```bash
docker compose logs -f vehicule-service
docker compose logs -f api-gateway
```
