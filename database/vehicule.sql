-- ============================================
-- Service Véhicules - PostgreSQL
-- Migration V1 : Création de la table Vehicule
-- ============================================

CREATE TYPE statut_vehicule AS ENUM (
    'DISPONIBLE',
    'EN_COURSE',
    'EN_MAINTENANCE'
);

CREATE TABLE vehicule (
    id_vehicule     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    immatriculation VARCHAR(20)      NOT NULL UNIQUE,
    marque          VARCHAR(100)     NOT NULL,
    modele          VARCHAR(100)     NOT NULL,
    annee           SMALLINT         NOT NULL CHECK (annee >= 1900 AND annee <= EXTRACT(YEAR FROM NOW()) + 1),
    statut          statut_vehicule  NOT NULL DEFAULT 'DISPONIBLE',
    kilometrage     INTEGER          NOT NULL DEFAULT 0 CHECK (kilometrage >= 0),
    type            VARCHAR(50)      NOT NULL,
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_vehicule_statut         ON vehicule (statut);
CREATE INDEX idx_vehicule_immatriculation ON vehicule (immatriculation);
