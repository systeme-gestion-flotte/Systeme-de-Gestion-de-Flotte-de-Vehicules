#!/bin/bash
set -e

echo "Création des différentes bases de données..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE vehicules;
    CREATE DATABASE conducteurs;
    CREATE DATABASE maintenance;
    CREATE DATABASE evenements;
    CREATE DATABASE keycloak;
EOSQL

echo "Exécution des scripts SQL pour chaque base..."
# On utilise les fichiers .sql qui sont dans ton dossier config
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "vehicules_db" -f /app-config/vehicule.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "conducteurs_db" -f /app-config/conducteur.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "maintenance_db" -f /app-config/maintenance.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "evenements_db" -f /app-config/evenement.sql

echo "Initialisation terminée avec succès !"