# Topics Kafka — Système de Gestion de Flotte

## Vue d'ensemble des topics

| Topic | Producteur | Consommateurs | Description |
|---|---|---|---|
| `fleet.vehicules.statut` | Service Véhicules | Conducteurs, Maintenance, Événements | Changement de statut d'un véhicule |
| `fleet.vehicules.created` | Service Véhicules | Maintenance | Nouveau véhicule créé |
| `fleet.conducteurs.assignation` | Service Conducteurs | Véhicules, Événements | Assignation conducteur ↔ véhicule |
| `fleet.maintenance.planifiee` | Service Maintenance | Véhicules, Événements | Intervention planifiée |
| `fleet.maintenance.terminee` | Service Maintenance | Véhicules, Événements | Intervention terminée |
| `fleet.localisation.position` | Service Localisation | Événements | Position GPS en temps réel |
| `fleet.localisation.geofencing` | Service Localisation | Événements | Alerte sortie de zone |
| `fleet.evenements.alerte` | Service Événements | Frontend (via Gateway) | Alerte émise vers les utilisateurs |

---

## Format des messages

### `fleet.vehicules.statut`
Déclenché à chaque changement de statut d'un véhicule.
```json
{
  "eventType": "VEHICULE_STATUT_CHANGE",
  "timestamp": "2026-03-07T10:00:00Z",
  "payload": {
    "vehicule_id": "550e8400-e29b-41d4-a716-446655440000",
    "immatriculation": "AB-123-CD",
    "ancien_statut": "disponible",
    "nouveau_statut": "en_maintenance"
  }
}
```

### `fleet.vehicules.created`
Déclenché à la création d'un nouveau véhicule.
```json
{
  "eventType": "VEHICULE_CREE",
  "timestamp": "2026-03-07T10:00:00Z",
  "payload": {
    "vehicule_id": "550e8400-e29b-41d4-a716-446655440000",
    "immatriculation": "AB-123-CD",
    "marque": "Renault",
    "modele": "Clio",
    "annee": 2022
  }
}
```

### `fleet.conducteurs.assignation`
Déclenché à la création ou la fin d'une assignation.
```json
{
  "eventType": "ASSIGNATION_CREEE",
  "timestamp": "2026-03-07T10:00:00Z",
  "payload": {
    "assignation_id": "660e8400-e29b-41d4-a716-446655440001",
    "vehicule_id": "550e8400-e29b-41d4-a716-446655440000",
    "conducteur_id": "770e8400-e29b-41d4-a716-446655440002",
    "date_depart": "2026-03-07T08:00:00Z",
    "statut": "en_cours"
  }
}
```
> `eventType` peut aussi être `ASSIGNATION_TERMINEE` ou `ASSIGNATION_ANNULEE`

### `fleet.maintenance.planifiee`
Déclenché quand une intervention est planifiée.
```json
{
  "eventType": "MAINTENANCE_PLANIFIEE",
  "timestamp": "2026-03-07T10:00:00Z",
  "payload": {
    "intervention_id": "880e8400-e29b-41d4-a716-446655440003",
    "vehicule_id": "550e8400-e29b-41d4-a716-446655440000",
    "vehicule_immat": "AB-123-CD",
    "type": "revision",
    "date_planifiee": "2026-03-14T09:00:00Z",
    "technicien_id": "keycloak-user-id-technicien"
  }
}
```

### `fleet.maintenance.terminee`
Déclenché quand une intervention est terminée.
```json
{
  "eventType": "MAINTENANCE_TERMINEE",
  "timestamp": "2026-03-07T10:00:00Z",
  "payload": {
    "intervention_id": "880e8400-e29b-41d4-a716-446655440003",
    "vehicule_id": "550e8400-e29b-41d4-a716-446655440000",
    "vehicule_immat": "AB-123-CD",
    "type": "revision",
    "date_realisation": "2026-03-14T11:30:00Z",
    "cout": 250.00
  }
}
```

### `fleet.localisation.position`
Émis à chaque mise à jour de position GPS (haute fréquence).
```json
{
  "eventType": "POSITION_UPDATE",
  "timestamp": "2026-03-07T10:00:00Z",
  "payload": {
    "vehicule_id": "550e8400-e29b-41d4-a716-446655440000",
    "latitude": 49.4431,
    "longitude": 1.0993,
    "vitesse": 52.3
  }
}
```

### `fleet.localisation.geofencing`
Émis quand un véhicule sort d'une zone autorisée.
```json
{
  "eventType": "GEOFENCING_ALERTE",
  "timestamp": "2026-03-07T10:00:00Z",
  "payload": {
    "vehicule_id": "550e8400-e29b-41d4-a716-446655440000",
    "vehicule_immat": "AB-123-CD",
    "latitude": 49.4431,
    "longitude": 1.0993,
    "zone_id": "zone-rouen-centre",
    "type": "sortie_zone"
  }
}
```

### `fleet.evenements.alerte`
Émis par le Service Événements vers tous les abonnés (dashboard, notifications push).
```json
{
  "eventType": "ALERTE_EMISE",
  "timestamp": "2026-03-07T10:00:00Z",
  "payload": {
    "evenement_id": "990e8400-e29b-41d4-a716-446655440004",
    "vehicule_id": "550e8400-e29b-41d4-a716-446655440000",
    "source_service": "localisation",
    "type_alerte": "sortie_zone",
    "severite": "warning",
    "description": "Le véhicule AB-123-CD a quitté la zone autorisée"
  }
}
```

---

## Configuration des topics (à créer au démarrage)

```bash
# Créer tous les topics avec 3 partitions et réplication 1 (dev local)
kafka-topics.sh --create --bootstrap-server localhost:9092 \
  --topic fleet.vehicules.statut    --partitions 3 --replication-factor 1
kafka-topics.sh --create --bootstrap-server localhost:9092 \
  --topic fleet.vehicules.created   --partitions 3 --replication-factor 1
kafka-topics.sh --create --bootstrap-server localhost:9092 \
  --topic fleet.conducteurs.assignation --partitions 3 --replication-factor 1
kafka-topics.sh --create --bootstrap-server localhost:9092 \
  --topic fleet.maintenance.planifiee   --partitions 3 --replication-factor 1
kafka-topics.sh --create --bootstrap-server localhost:9092 \
  --topic fleet.maintenance.terminee    --partitions 3 --replication-factor 1
kafka-topics.sh --create --bootstrap-server localhost:9092 \
  --topic fleet.localisation.position   --partitions 6 --replication-factor 1
kafka-topics.sh --create --bootstrap-server localhost:9092 \
  --topic fleet.localisation.geofencing --partitions 3 --replication-factor 1
kafka-topics.sh --create --bootstrap-server localhost:9092 \
  --topic fleet.evenements.alerte       --partitions 3 --replication-factor 1
```

> **Note :** `fleet.localisation.position` a 6 partitions car c'est le topic le plus chargé
> (mise à jour GPS toutes les secondes par véhicule).
