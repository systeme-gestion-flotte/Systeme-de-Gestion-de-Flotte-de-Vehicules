# Système de Gestion de Flotte de Véhicules

Projet M1 GIL -- Université de Rouen Normandie (2025-2026).
Architecture microservices distribuée pour la gestion d'une flotte de véhicules.

---

## 1. État de l'Infrastructure (Semaine 2)

L'infrastructure supporte le développement local via Docker Compose et l'orchestration via Kubernetes (Minikube). Tous les composants sont déployés dans le namespace `fleet-management` sur Kubernetes.

### Stack Technique
- **Orchestration** : Kubernetes (Minikube) & Docker Compose.
- **Bus & Data** : Apache Kafka (Strimzi), PostgreSQL (Bitnami), Redis.
- **Passerelle API** : Traefik (Ingress Controller).
- **Sécurité** : Keycloak (SSO).
- **Observabilité** : OpenTelemetry (Collector), Jaeger, Prometheus, Loki, Grafana.

---

## 2. Développement Local (Docker Compose)

### Lancement
```bash
docker compose up -d
```

### Accès aux Services (Ports et Routes)

| Service | Port Local (Docker) | Route K8s (Ingress) | Type / Info |
| :--- | :--- | :--- | :--- |
| **Keycloak Admin** | http://localhost:9080 | - | admin / admin |
| **PostgreSQL** | localhost:5432 | - | admin / adminpassword |
| **pgAdmin** | http://localhost:5050 | - | admin@flotte.com / admin |
| **Véhicule Service** | http://localhost:8081 | `api.fleet.local/api/vehicules` | REST (Port 4000) + GraphQL |
| **Conducteur Service** | http://localhost:3001 | `api.fleet.local/api/conducteurs` | Node.js (Port 3000) |
| **Maintenance Service** | http://localhost:8002 | `api.fleet.local/api/maintenance` | Python (Port 8000) |
| **Événement Service** | http://localhost:8003 | `api.fleet.local/api/evenements` | Python/FastAPI (Port 8000) |
| **Localisation Service**| localhost:50051 | `api.fleet.local/api/localisation` | gRPC (Port 50051) |
| **Redis** | localhost:6379| - | No Auth |
| **Kafka** | localhost:9092| - | KRaft / Strimzi |

> [!NOTE]
> Pour accéder aux routes Kubernetes, assurez-vous d'avoir ajouté `$(minikube ip) api.fleet.local` à votre fichier `/etc/hosts`.

---

## 3. Déploiement Kubernetes (Minikube)

### Étape 1 : Préparer l'environnement
```bash
minikube start
minikube addons enable ingress
# Configurer Docker pour utiliser Minikube
eval $(minikube docker-env)
```

### Étape 2 : Namespace et Secrets
```bash
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/secrets.yaml
```

### Étape 3 : Déployer l'Infrastructure (Helm)
```bash
# Ajouter les dépôts Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add strimzi https://strimzi.io/charts/
helm repo add traefik https://helm.traefik.io/traefik
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Installer les composants (Postgres, Redis, Kafka, Observabilité)
helm install traefik traefik/traefik -n fleet-management
helm install postgres bitnami/postgresql -n fleet-management --set auth.password=adminpassword --set auth.database=vehicules_db
helm install redis bitnami/redis -n fleet-management --set auth.enabled=false
helm install strimzi-operator strimzi/strimzi-kafka-operator -n fleet-management
helm install obs prometheus-community/kube-prometheus-stack -n fleet-management
```

### Étape 4 : Déployer les Microservices
```bash
# Builder les images dans Minikube
docker build -t fleet-vehicule-service:latest ./services/vehicule-service
docker build -t fleet-conducteur-service:latest ./services/conducteur-service

# Appliquer les manifests K8s
kubectl apply -f infrastructure/k8s/kafka.yaml
kubectl apply -f infrastructure/k8s/vehicule-deployment.yaml
kubectl apply -f infrastructure/k8s/vehicule-service.yaml
kubectl apply -f infrastructure/k8s/ingress.yaml
```

---

## 4. Implémentation Microservice (Semaine 3)

Le `vehicule-service` implémente les fonctionnalités de communication inter-services et d'observabilité.

### Fonctionnalités
- **GraphQL** : Point d'entrée à l'adresse `/graphql`.
- **Kafka** : Publication d'événements `VEHICLE_CREATED` et `VEHICLE_UPDATED`.
- **Telemetry** : Traces distribuées via OpenTelemetry Collector et Jaeger.

### Qualité et Tests
- **Couverture JaCoCo** : **81%** atteinte (Objectif > 80%).
- **Tests** : 23 tests unitaires et d'intégration validés.

Exécution des tests :
```bash
cd services/vehicule-service
mvn clean test jacoco:report
```




