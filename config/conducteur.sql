-- ============================================
-- Service Conducteurs - PostgreSQL
-- Migration V1 : Création des tables Conducteur et Assignation
-- ============================================

CREATE TYPE statut_assignation AS ENUM (
    'planifiee',
    'en_cours',
    'terminee',
    'annulee'
);

CREATE TYPE categorie_permis AS ENUM (
     'A', 
     'B', 
     'C', 
     'D'
);

CREATE TABLE conducteur (
    id_conducteur        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_user_id     VARCHAR(255)  NOT NULL UNIQUE,  -- lien Keycloak, pas de table Utilisateur
    nom                  VARCHAR(100)  NOT NULL,
    prenom               VARCHAR(100)  NOT NULL,
    email                VARCHAR(255)  NOT NULL UNIQUE,
    numero_permis        VARCHAR(50)   NOT NULL UNIQUE,
    categorie            categorie_permis[] NOT NULL,
    date_validite_permis DATE          NOT NULL,
    actif                BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE assignation (
    id_assignation  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicule_id     UUID                NOT NULL,           -- ID copié, pas de FK inter-service
    conducteur_id   UUID                NOT NULL REFERENCES conducteur (id_conducteur) ON DELETE RESTRICT,
    date_depart     TIMESTAMPTZ         NOT NULL,
    date_retour     TIMESTAMPTZ,                            -- NULL si course en cours
    statut          statut_assignation  NOT NULL DEFAULT 'en_cours',
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- Un conducteur ne peut pas avoir deux courses en cours simultanément
    CONSTRAINT chk_dates CHECK (date_retour IS NULL OR date_retour > date_depart)
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_conducteur_keycloak    ON conducteur (keycloak_user_id);
CREATE INDEX idx_conducteur_permis      ON conducteur (numero_permis);
CREATE INDEX idx_assignation_vehicule   ON assignation (vehicule_id);
CREATE INDEX idx_assignation_conducteur ON assignation (conducteur_id);
CREATE INDEX idx_assignation_statut     ON assignation (statut);
