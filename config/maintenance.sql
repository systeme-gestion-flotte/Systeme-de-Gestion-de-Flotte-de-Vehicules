-- ============================================
-- Service Maintenance - PostgreSQL
-- Migration V1 : Création de la table Intervention
-- ============================================

CREATE TYPE type_intervention AS ENUM (
    'revision',
    'reparation',
    'controle_technique'
);

CREATE TYPE statut_intervention AS ENUM (
    'planifiee',
    'en_cours',
    'terminee'
);

CREATE TABLE intervention (
    id_intervention  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicule_id      UUID                  NOT NULL,        -- copié via événement Kafka, pas de FK
    vehicule_immat   VARCHAR(20)           NOT NULL,        -- dénormalisé pour affichage rapide
    technicien_id    VARCHAR(255)          NOT NULL,        -- ID Keycloak du technicien
    type             type_intervention     NOT NULL,
    date_planifiee   TIMESTAMPTZ           NOT NULL,
    date_realisation TIMESTAMPTZ,                           -- NULL tant que non terminée
    statut           statut_intervention   NOT NULL DEFAULT 'planifiee',
    cout             NUMERIC(10, 2)        CHECK (cout >= 0),
    description      TEXT,
    created_at       TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_dates CHECK (date_realisation IS NULL OR date_realisation >= date_planifiee)
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_intervention_vehicule  ON intervention (vehicule_id);
CREATE INDEX idx_intervention_statut    ON intervention (statut);
CREATE INDEX idx_intervention_date      ON intervention (date_planifiee);
CREATE INDEX idx_intervention_technicien ON intervention (technicien_id);
