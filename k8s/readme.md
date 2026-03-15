 ## Déploiement
 
### 1. Démarrer Minikube
Dans le ternimal copier ces commandes
```powershell
minikube start
minikube docker-env | Invoke-Expression
```
 
### 2. Builder les images Docker
Dans le ternimal copier ces commandes
```powershell
docker build -t fleet-vehicule-service:latest ./services/vehicule-service
docker build -t fleet-conducteur-service:latest ./services/conducteur-service
docker build -t fleet-maintenance-service:latest ./services/maintenance-service
docker build -t fleet-evenement-service:latest ./services/evenement-service
docker build -t fleet-localisation-service:latest ./services/localisation-service
```
 
### 3. Ajouter les repos Helm
Dans le termianle de freelens copier ces commandes
```powershell
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add strimzi https://strimzi.io/charts/
helm repo update
```
 
### 4. Namespace et secrets
Dans le termianle de freelens copier ces commandes
```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
```
 
### 5. Infrastructure Helm
Dans le termianle de freelens copier ces commandes
```powershell
helm install postgres bitnami/postgresql 
--namespace fleet-management 
--set auth.username=admin 
--set auth.password=adminpassword 
--set auth.database=vehicules_db
```
```powershell
helm install timescaledb bitnami/postgresql 
--namespace fleet-management 
--set auth.username=admin 
--set auth.password=adminpassword 
--set auth.database=localisation_db
```
```powershell
helm install redis bitnami/redis 
--namespace fleet-management
--set auth.enabled=false
helm install strimzi-operator strimzi/strimzi-kafka-operator --namespace fleet-management
```
 
### 6. Kafka (attendre 2 min que Strimzi démarre)
Dans le termianle de freelens copier ces commandes
```powershell
kubectl apply -f k8s/kafka.yaml
```
 
### 7. Microservices
Dans le termianle de freelens copier ces commandes
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
 
### 8. Vérifier
Dans le termianle de freelens copier ces commandes
```powershell
kubectl get all -n fleet-management
helm list -n fleet-management
```
 
## Supprimer le déploiement
Dans le termianle de freelens copier ces commandes
```powershell
kubectl delete namespace fleet-management
helm uninstall postgres timescaledb redis strimzi-operator -n fleet-management
```
 
