-- ======================================================
-- SEED DATA POUR LA GESTION DE FLOTTE
-- ======================================================

-- 1. BASE VEHICULES
\c vehicules;

TRUNCATE TABLE vehicule CASCADE;

INSERT INTO vehicule (id_vehicule, immatriculation, marque, modele, annee, statut, kilometrage, type, created_at, updated_at) 
VALUES
(gen_random_uuid(), 'AB-123-CD', 'Peugeot', '3008', 2022, 'DISPONIBLE', 15000, 'SUV', NOW(), NOW()),
(gen_random_uuid(), 'EF-456-GH', 'Renault', 'Zoe', 2023, 'EN_COURSE', 5000, 'Electrique', NOW(), NOW()),
(gen_random_uuid(), 'IJ-789-KL', 'Mercedes', 'Sprinter', 2021, 'EN_MAINTENANCE', 45000, 'Utilitaire', NOW(), NOW()),
(gen_random_uuid(), 'MN-012-OP', 'Tesla', 'Model 3', 2024, 'DISPONIBLE', 1200, 'Berline', NOW(), NOW())
ON CONFLICT (immatriculation) DO NOTHING;

-- 2. BASE CONDUCTEURS
\c conducteurs;

TRUNCATE TABLE conducteur CASCADE;

INSERT INTO conducteur (id_conducteur, nom, prenom, email, numero_permis, categorie, date_validite_permis, actif, created_at)
VALUES
(gen_random_uuid(), 'Dupont', 'Jean', 'conducteur@fleet.local', 'PERM-001', '{B}', '2030-01-01', true, NOW()),
(gen_random_uuid(), 'Martin', 'Sophie', 'sophie@fleet.local', 'PERM-002', '{B,C}', '2028-12-31', true, NOW()),
(gen_random_uuid(), 'Leclerc', 'Pierre', 'pierre@fleet.local', 'PERM-003', '{B,D}', '2027-06-15', true, NOW());

-- 3. BASE MAINTENANCE
\c maintenance;

TRUNCATE TABLE interventions CASCADE;

INSERT INTO interventions (id_intervention, vehicule_id, vehicule_immat, technicien_id, type, date_planifiee, statut, cout, description, created_at)
VALUES
(gen_random_uuid(), 'V-102', 'IJ-789-KL', 'technicien-fleet', 'revision', NOW() + interval '2 days', 'planifiee', 250.0, 'Révision des 45k km', NOW()),
(gen_random_uuid(), 'V-001', 'AB-123-CD', 'technicien-fleet', 'reparation', NOW() - interval '1 day', 'en_cours', 500.0, 'Changement plaquettes de frein', NOW());

-- 4. BASE EVENEMENTS
\c evenements;

TRUNCATE TABLE alerts CASCADE;

INSERT INTO alerts (id, type, source, message, time, created_at)
VALUES
(gen_random_uuid(), 'attention', 'V-102', 'Maintenance prévue dans 2 jours', 'Récemment', NOW()),
(gen_random_uuid(), 'info', 'Personnel', 'Conducteur Jean Dupont assigné', '1h', NOW());
