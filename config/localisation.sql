-- ============================================
-- Service Localisation - TimescaleDB
-- Migration V1 : Création de la hypertable Position
-- ============================================

-- Extension TimescaleDB (doit être activée sur le serveur PostgreSQL)
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE position (
    id_position  UUID             NOT NULL DEFAULT gen_random_uuid(),
    vehicule_id  UUID             NOT NULL,        -- copié, pas de FK inter-service
    latitude     DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
    longitude    DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    vitesse      DOUBLE PRECISION CHECK (vitesse >= 0),   -- km/h, utile pour alertes excès de vitesse
    horodatage   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),  -- colonne de partitionnement TimescaleDB

    PRIMARY KEY (id_position, horodatage)  -- horodatage requis dans la PK pour TimescaleDB
);

-- Conversion en hypertable TimescaleDB partitionnée par horodatage (chunk = 1 jour)
SELECT create_hypertable('position', 'horodatage', chunk_time_interval => INTERVAL '1 day');

-- Politique de compression automatique des chunks de plus de 7 jours
ALTER TABLE position SET (
    timescaledb.compress,
    timescaledb.compress_orderby = 'horodatage DESC',
    timescaledb.compress_segmentby = 'vehicule_id'
);
SELECT add_compression_policy('position', INTERVAL '7 days');

-- Politique de rétention : suppression des données de plus de 1 an
SELECT add_retention_policy('position', INTERVAL '1 year');

-- Index pour les requêtes géographiques et par véhicule
CREATE INDEX idx_position_vehicule   ON position (vehicule_id, horodatage DESC);
CREATE INDEX idx_position_vitesse    ON position (vitesse) WHERE vitesse IS NOT NULL;
