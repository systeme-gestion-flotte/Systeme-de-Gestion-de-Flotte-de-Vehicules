# Guide de l'Observabilité (Loki, Grafana, Jaeger)

Ce guide résume l'installation et la configuration des outils de logs et de traces pour le projet.

##  1. Installation de l'infrastructure

Les outils ont été installés via Helm sur le namespace `fleet-management` :

```powershell
# Loki (Logs)
helm install loki grafana/loki-stack --namespace fleet-management

# Prometheus & Grafana (Métriques et Dashboards)
helm install obs prometheus-community/kube-prometheus-stack --namespace fleet-management

# Jaeger (Traces distribuées)
kubectl run jaeger --image=jaegertracing/all-in-one:latest -n fleet-management --port=16686
kubectl expose pod jaeger -n fleet-management --type=NodePort --port=16686
```

## 2. Correction du conflit de configuration

Un conflit empêchait Grafana de démarrer (`CrashLoopBackOff`) car Loki et Prometheus essayaient tous les deux d'être la source de données **par défaut**.

**Action réalisée :**
Le ConfigMap `loki-loki-stack` a été modifié pour passer `isDefault: true` à `false`. Prometheus reste ainsi la source par défaut pour les metrics, et Loki est disponible pour les logs.

##  3. Accès aux interfaces graphiques

### Grafana (Logs et Dashboards)
*   **Commande :** `kubectl port-forward svc/obs-grafana 8082:80 -n fleet-management`
*   **URL :** [http://localhost:8082](http://localhost:8082)
*   **Utilisateur :** `admin`
*   **Mot de passe :** `e3SR8Al54bt0M7tx9S4xTqD8NFUVsGrObBu1wFGx`

### Jaeger (Traces)
*   **Commande :** `kubectl port-forward svc/jaeger 16686:16686 -n fleet-management`
*   **URL :** [http://localhost:16686](http://localhost:16686)

##  4. Comment voir les logs ?

1. Connectez-vous à **Grafana**.
2. Allez dans l'onglet **Explore** (icône boussole ).
3. Sélectionnez **Loki** dans le menu déroulant en haut à gauche.
4. Utilisez le filtre `app` (ex: `vehicule-service`) pour voir les logs du microservice.
