-- ============================================
-- Service Événements - PostgreSQL
-- Migration V1 : Création de la table Evenement
-- ============================================

CREATE TYPE type_alerte AS ENUM (
    'sortie_zone',
    'exces_vitesse',
    'panne',
    'maintenance_due',
    'accident',
    'autre'
);

CREATE TYPE severite_alerte AS ENUM (
    'info',
    'warning',
    'critical'
);

CREATE TABLE evenement (
    id_evenement    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicule_id     UUID              NOT NULL,         -- ID copié, pas de FK inter-service
    source_service  VARCHAR(50)       NOT NULL,         -- ex: 'localisation', 'maintenance', 'vehicule'
    type_alerte     type_alerte       NOT NULL,
    severite        severite_alerte   NOT NULL DEFAULT 'info',
    description     TEXT,
    acquitte        BOOLEAN           NOT NULL DEFAULT FALSE,
    horodatage      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_evenement_vehicule     ON evenement (vehicule_id);
CREATE INDEX idx_evenement_type         ON evenement (type_alerte);
CREATE INDEX idx_evenement_severite     ON evenement (severite);
CREATE INDEX idx_evenement_acquitte     ON evenement (acquitte) WHERE acquitte = FALSE;  -- index partiel
CREATE INDEX idx_evenement_horodatage   ON evenement (horodatage DESC);
