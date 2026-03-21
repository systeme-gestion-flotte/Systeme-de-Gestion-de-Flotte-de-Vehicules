# Système de Gestion de Flotte de Véhicules

## Déploiement

### 1. Démarrer Minikube
Dans le terminal PowerShell :
```powershell
minikube start
minikube docker-env | Invoke-Expression
```

### 2. Builder les images Docker
```powershell
docker build -t fleet-vehicule-service:latest ./services/vehicule-service
docker build -t fleet-conducteur-service:latest ./services/conducteur-service
docker build -t fleet-maintenance-service:latest ./services/maintenance-service
docker build -t fleet-evenement-service:latest ./services/evenement-service
docker build -t fleet-localisation-service:latest ./services/localisation-service
```

### 3. Ajouter les repos Helm
```powershell
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add strimzi https://strimzi.io/charts/
helm repo add traefik https://helm.traefik.io/traefik
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update
```

### 4. Namespace et secrets
```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
```

### 5. Infrastructure Helm
```powershell
# Traefik (ingress controller)
helm install traefik traefik/traefik --namespace fleet-management

# Bases de données PostgreSQL (une par service)
helm install postgres bitnami/postgresql --namespace fleet-management --set auth.username=admin --set auth.password=adminpassword --set auth.database=vehicules_db
helm install postgres-conducteur bitnami/postgresql --namespace fleet-management --set auth.username=admin --set auth.password=adminpassword --set auth.database=conducteurs_db
helm install postgres-maintenance bitnami/postgresql --namespace fleet-management --set auth.username=admin --set auth.password=adminpassword --set auth.database=maintenance_db
helm install postgres-evenement bitnami/postgresql --namespace fleet-management --set auth.username=admin --set auth.password=adminpassword --set auth.database=evenements_db
helm install timescaledb bitnami/postgresql --namespace fleet-management --set auth.username=admin --set auth.password=adminpassword --set auth.database=localisation_db

# Redis
helm install redis bitnami/redis --namespace fleet-management --set auth.enabled=false

# Kafka via Strimzi
helm install strimzi-operator strimzi/strimzi-kafka-operator --namespace fleet-management

# Observabilité
helm install obs prometheus-community/kube-prometheus-stack --namespace fleet-management
helm install loki grafana/loki-stack --namespace fleet-management
helm install otel-collector open-telemetry/opentelemetry-collector --set mode=deployment --set image.repository="otel/opentelemetry-collector-contrib" --namespace fleet-management
```

### 6. Kafka (attendre 2 min que Strimzi démarre)
```powershell
kubectl apply -f k8s/kafka.yaml
```

### 7. Jaeger
```powershell
kubectl run jaeger --image=jaegertracing/all-in-one:latest -n fleet-management --port=16686
kubectl expose pod jaeger -n fleet-management --type=NodePort --port=16686
```

### 8. Microservices
```powershell
kubectl apply -f k8s/vehicule-deployment.yaml
kubectl apply -f k8s/vehicule-service.yaml
kubectl apply -f k8s/conducteur-deployment.yaml
kubectl apply -f k8s/conducteur-service.yaml
kubectl apply -f k8s/maintenance-deployment.yaml
kubectl apply -f k8s/maintenance-service.yaml
kubectl apply -f k8s/evenement-deployment.yaml
kubectl apply -f k8s/evenement-service.yaml
kubectl apply -f k8s/localisation-deployment.yaml
kubectl apply -f k8s/localisation-service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 9. Vérifier
```powershell
kubectl get all -n fleet-management
helm list -n fleet-management
```

### 10. Accès Traefik Dashboard (optionnel)
```powershell
kubectl port-forward $(kubectl get pods --selector "app.kubernetes.io/name=traefik" -n fleet-management --output=name) 9000:9000 -n fleet-management
# Dashboard accessible sur http://localhost:9000/dashboard/
```

---

## Supprimer le déploiement
```powershell
kubectl delete namespace fleet-management
helm uninstall traefik postgres postgres-conducteur postgres-maintenance postgres-evenement timescaledb redis strimzi-operator obs loki otel-collector -n fleet-management
```