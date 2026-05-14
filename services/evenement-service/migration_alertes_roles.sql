-- Migration : Ajout du système d'alertes par rôle
-- Exécution idempotente (IF NOT EXISTS)

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS role_cible VARCHAR(50);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS user_id_cible VARCHAR(255);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS source_topic VARCHAR(100);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS severite VARCHAR(20) DEFAULT 'info';

CREATE INDEX IF NOT EXISTS idx_alerts_role_cible ON alerts(role_cible);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id_cible ON alerts(user_id_cible);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
