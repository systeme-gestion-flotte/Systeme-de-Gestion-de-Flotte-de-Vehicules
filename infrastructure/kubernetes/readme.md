# Système de Gestion de Flotte de Véhicules - Infrastructure

Ce dossier contient toute l'infrastructure du projet, divisée en deux parties :
- `helm/` : Les modèles (Templates) dynamiques pour déployer plusieurs services sans dupliquer le code (ex: *fleet-app*).
- `kubernetes/` : Les fichiers de configuration K8s purs (Namespace, Secrets, Ingress, Keycloak, etc.).

---

##  Guide de Déploiement

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

### 4. Initialiser la Sécurité et Configuration de Base
```powershell
# 1. Créer le namespace et appliquer les secrets
kubectl apply -f infrastructure/kubernetes/namespace/namespace.yaml
kubectl apply -f infrastructure/kubernetes/secrets.yaml

# 2. Déployer Keycloak en K8s natif (avec son ConfigMap)
kubectl apply -f infrastructure/kubernetes/keycloak/
```

### 5. Infrastructure Tierce (Databases, Redis, Ingress Controller)
```powershell
# Traefik (ingress controller)
helm install traefik traefik/traefik --namespace fleet-management

# Bases de données PostgreSQL (une par service)
helm install postgres bitnami/postgresql --namespace fleet-management --set auth.username=admin --set auth.password=adminpassword --set auth.database=vehicules_db
# (Répéter l'opération pour postgres-conducteur, postgres-maintenance, etc.)

# Redis
helm install redis bitnami/redis --namespace fleet-management --set auth.enabled=false

# Kafka via Strimzi
helm install strimzi-operator strimzi/strimzi-kafka-operator --namespace fleet-management

# Attendre 2 min que l'opérateur Strimzi démarre, puis déployer Kafka :
kubectl apply -f infrastructure/kubernetes/kafka/kafka.yaml
```

### 6. Observabilité

Grâce à notre Stack "Umbrella Chart" Helm (`fleet-observabilite`), **une seule commande** installe : 
- Prometheus (Métriques)
- Grafana (Dashboards)
- Loki / Promtail (Logs)
- Jaeger (Tracing distribué)

Le tout nativement lié (Grafana aura déjà accès à Loki et Jaeger) :

```powershell
# 1. Mettre à jour et télécharger les dépendances officielles
helm dependency update ./infrastructure/helm/fleet-observabilite

# 2. Déployer toute la stack d'observabilité métier
helm install fleet-obs ./infrastructure/helm/fleet-observabilite -n fleet-management -f ./infrastructure/helm/fleet-observabilite/config/values-grafana.yaml -f ./infrastructure/helm/fleet-observabilite/config/values-prometheus.yaml -f ./infrastructure/helm/fleet-observabilite/config/values-loki.yaml
```

### 7. Déployer les Microservices de la flotte

Vous avez désormais 2 options pour déployer vos applications :

** OPTION A : La méthode Helm "Pro" (Recommandée)**
Utilise notre gabarit unique dans le dossier `helm/fleet-app/` couplé à votre fichier `values` spécifique.
```powershell
helm install vehicule-service ./infrastructure/helm/fleet-app -f ./infrastructure/helm/values-vehicule.yaml --namespace fleet-management

# *Pour déployer les autres, il suffira de créer des fichiers `values-conducteur.yaml`, etc. et de lancer la même commande avec le nouveau fichier !*
```

** OPTION B : La méthode Kubernetes Native (Historique)**
```powershell
kubectl apply -f infrastructure/kubernetes/deployment/
kubectl apply -f infrastructure/kubernetes/service/
```

### 8. Exposer via Ingress API
```powershell
kubectl apply -f infrastructure/kubernetes/ingress/ingress.yaml
```

### 9. Vérifier le système
```powershell
kubectl get all -n fleet-management
helm list -n fleet-management
```

---

##  Supprimer le déploiement
```powershell
kubectl delete namespace fleet-management
# N'oubliez pas d'ajouter les noms de vos déploiements Helm (vehicule-service, etc.)
helm uninstall traefik postgres redis strimzi-operator fleet-obs vehicule-service -n fleet-management
```
---

##  Architecture et Design Pattern Helm (Pour Rapport Final)

Dans le cadre de l'optimisation de cette infrastructure, nous avons implémenté une approche **Helm de type "Umbrella/Template Pattern"**. 

**Pourquoi ce choix ?**
Au lieu de maintenir des dizaines de fichiers YAML redondants pour chaque microservice (ce qui augmente le risque d'erreur humaine et rend la maintenance complexe), nous avons créé un **Chart générique unique** appelé `fleet-app`.

**Fonctionnement :**
1. **Le Template K8s** : Le dossier `helm/fleet-app/templates` contient des structures Kubernetes abstraites avec des variables (ex: `{{ .Values.image.repository }}`).
2. **Le Fichier de Définition** : Chaque service possède un fichier `values-[service].yaml` ultra-léger (environ 15 lignes) qui injecte ses données (ports, variables d'environnement, lien Keycloak, bases de données).

**Bénéfices de cette approche pro :**
- **Maintenance Centralisée** : Si nous devons ajouter des "Liveness Probes" (Healthchecks) ou modifier les limites de mémoire (RAM/CPU), une seule modification dans le chart `fleet-app` sera immédiatement répercutée sur l'ensemble de la flotte de microservices.
- **Réduction de la dette technique** : Passage de ~65 lignes de YAML par service à un fichier de ~15 lignes.
- **Automatisation CI/CD facilitée** : Une seule commande Helm suffit pour re-déployer n'importe quel service.

> *Note : Les anciens fichiers natifs Kubernetes (`*-deployment.yaml`) ont été conservés temporairement dans `infrastructure/kubernetes/deployment` à des fins de comparaison, de sauvegarde et de démonstration technique.*

---
