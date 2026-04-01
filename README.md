# Système de Gestion de Flotte de Véhicules

Projet M1 GIL -- Université de Rouen Normandie (2025-2026).
Architecture microservices distribuée pour la gestion d'une flotte de véhicules.

---

## 1. État de l'Infrastructure

L'infrastructure supporte le développement local via Docker Compose et l'orchestration via Kubernetes (Minikube). 

### Stack Technique
- **Orchestration** : Docker Compose & Kubernetes.
- **Microservices** : Java (Spring), Node.js (Express), Python (FastAPI), Go.
- **Communication** : Kafka (KRaft), gRPC, GraphQL.
- **Passerelle API** : Apollo GraphQL Gateway & Traefik.
- **Sécurité** : Keycloak (SSO/OIDC).
- **Observabilité** : OpenTelemetry, Jaeger, Prometheus, Loki, Grafana.

---

## 2. Développement Local (Docker Compose)

### Lancement rapide
```bash
docker compose up -d --build
```

### Accès aux Services (Développement)

| Service | Port Local | URL / Interface | Authentification |
| :--- | :--- | :--- | :--- |
| **GraphQL Gateway** | **4000** | [Apollo Sandbox](http://localhost:4000) | JWT requis |
| **Keycloak** | 9080 | [Admin Console](http://localhost:9080) | admin / admin |
| **Véhicule Service** | 8081 | REST / GraphQL | Java / Spring Boot |
| **Conducteur Service** | 3000 | REST API | NestJS / TypeScript |
| **Maintenance Service** | **8002** | [FastAPI Docs](http://localhost:8002/docs) | Python / FastAPI |
| **Événement Service** | 8003 | REST API | Python / FastAPI |
| **Localisation Service**| 50051 | gRPC | Go |
| **Grafana** | 3000 | [Dashboard](http://localhost:3000) | admin / admin |
| **Jaeger** | 16686 | [UI Tracing](http://localhost:16686) | - |
| **Kafka UI** | **8085** | Kafka UI | `http://localhost:8085` | Gestion visuelle des topics/messages |
| Keycloak | `http://localhost:9080` | Serveur d'authentification (IAM) |

---

## 3. Déploiement Kubernetes

Toutes les ressources Kubernetes (Manifests, Helm, Ingress) se trouvent dans le dossier `infrastructure/kubernetes`.

👉 **[Voir le guide de déploiement Kubernetes](infrastructure/kubernetes/readme.md)**
👉 **[Voir le guide d'authentification Keycloak](infrastructure/keycloak/readme.md)**

---

## 4. Historique du Développement

### Semaine 3 : Service Véhicule & Qualité
- **Communication** : Publication automatique d'événements Kafka `VEHICLE_CREATED`.
- **Observabilité** : Intégration de l'auto-instrumentation OpenTelemetry.
- **Qualité** : Couverture JaCoCo de **81%** sur le service Java.

### Semaine 4 : Service Maintenance & Intégration (Actuel)
- **Service Maintenance** : Architecture Clean avec FastAPI et SQLAlchemy.
- **Sécurité** : Validation des rôles (`admin`, `technicien`) via Keycloak.
- **Kafka Consumer** : Synchronisation temps réel des véhicules depuis Kafka.
- **Fédération** : Mise en place de l'API Gateway Apollo pour unifier les services.
- **Qualité** : Couverture de tests PyTest de **83%** sur le service Maintenance.

### Semaine 4 : Service Conducteur & Assignations
- **Service Conducteur** : CRUD complet des profils conducteurs avec NestJS/TypeScript et TypeORM + PostgreSQL.
- **Assignations** : Gestion complète du cycle de vie des assignations conducteur-véhicule.
- **Saga Kafka** : Chorégraphie via Kafka — publication de `AssignationDemandee` et consommation de `VehiculeAssigneAvecSucces` / `EchecAssignationVehicule`.
- **Validation métier** : Vérification automatique de la validité du permis avant toute assignation.
- **Qualité** : Couverture Jest de **90%** (78 tests unitaires).

### Semaine 5 : Optimisation Gateway & Kafka
- **Kafka UI** : Ajout d'une interface web de gestion Kafka sur le port `8085`.
- **GraphQL Resolvers** : Correction du mapping `camelCase` ↔ `snake_case` via un utilitaire centralisé.
- **Fédération de données** : Implémentation des relations imbriquées (ex: `Assignation` -> `Vehicule`) au niveau de la gateway.

---

## 5. Tests
Pour lancer les tests d'un service spécifique :
```bash
# Java
cd services/vehicule-service && mvn test
# Python
cd services/maintenance-service && pytest --cov=app
# Node.js (conducteur-service)
cd services/conducteur-service && npm run test:cov
```
