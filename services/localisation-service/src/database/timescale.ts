import { Pool, PoolClient } from 'pg';

let pool: Pool;

export async function initDatabase(): Promise<void> {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://admin:adminpassword@localhost:5433/localisation_db',
    max: 10,
    idleTimeoutMillis: 30000,
  });

  const client: PoolClient = await pool.connect();
  try {
    // Création de la table des positions GPS
    await client.query(`
      CREATE TABLE IF NOT EXISTS positions (
        vehicule_id  TEXT             NOT NULL,
        latitude     DOUBLE PRECISION NOT NULL,
        longitude    DOUBLE PRECISION NOT NULL,
        vitesse      DOUBLE PRECISION NOT NULL,
        horodatage   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
      );
    `);

    // Conversion en hypertable TimescaleDB (partitionnement temporel automatique)
    await client.query(`
      SELECT create_hypertable('positions', 'horodatage', if_not_exists => TRUE);
    `);

    // Index spatial : requêtes par véhicule + plage temporelle
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_positions_vehicule_temps
        ON positions (vehicule_id, horodatage DESC);
    `);

    console.log('TimescaleDB : table positions initialisée avec hypertable');
  } finally {
    client.release();
  }
}

export async function savePosition(position: {
  vehicule_id: string;
  latitude: number;
  longitude: number;
  vitesse: number;
  horodatage?: string;
}): Promise<void> {
  const horodatage = position.horodatage || new Date().toISOString();
  await pool.query(
    `INSERT INTO positions (vehicule_id, latitude, longitude, vitesse, horodatage)
     VALUES ($1, $2, $3, $4, $5)`,
    [position.vehicule_id, position.latitude, position.longitude, position.vitesse, horodatage],
  );
}

export async function getHistorique(
  vehiculeId: string,
  depuis: string,
  jusquA: string,
): Promise<Array<{ vehicule_id: string; latitude: number; longitude: number; vitesse: number; horodatage: string }>> {
  const result = await pool.query(
    `SELECT vehicule_id,
            latitude,
            longitude,
            vitesse,
            horodatage::text AS horodatage
     FROM   positions
     WHERE  vehicule_id = $1
       AND  horodatage >= $2
       AND  horodatage <= $3
     ORDER  BY horodatage ASC`,
    [vehiculeId, depuis, jusquA],
  );
  return result.rows;
}

export async function getLastPosition(vehiculeId: string): Promise<{
  vehicule_id: string;
  latitude: number;
  longitude: number;
  vitesse: number;
  horodatage: string;
} | null> {
  const result = await pool.query(
    `SELECT vehicule_id,
            latitude,
            longitude,
            vitesse,
            horodatage::text AS horodatage
     FROM   positions
     WHERE  vehicule_id = $1
     ORDER  BY horodatage DESC
     LIMIT  1`,
    [vehiculeId],
  );
  return result.rows[0] ?? null;
}
