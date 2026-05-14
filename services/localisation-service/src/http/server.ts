import express, { Request, Response } from 'express';
import { getHistorique, getLastPosition, savePosition, getLatestAllPositions } from '../database/timescale';
import { checkAuth, checkRole } from './auth';
import { ZONES, Zone } from '../geofencing/zones';
import { randomUUID } from 'crypto';

const app = express();
app.use(express.json());

// Application du middleware d'authentification sur toutes les routes API
// Sauf /health
app.use('/api/positions', checkAuth);
app.use('/api/zones', checkAuth);
// Support des routes sans préfixe /api demandées par la gateway
app.use('/positions', checkAuth);
app.use('/zones', checkAuth);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'localisation-service', timestamp: new Date().toISOString() });
});

// ── Historique d'un véhicule ──────────────────────────────────────────────────
// Match gateway expectation: /positions/:vehicule_id/historique
const getHistoriqueHandler = async (req: Request, res: Response) => {
  const vehiculeId = req.params.vehiculeId || req.params.vehicule_id;
  const { depuis, jusqu_a } = req.query as { depuis?: string; jusqu_a?: string };

  if (!depuis) {
    return res.status(400).json({ error: 'Le paramètre depuis (ISO 8601) est obligatoire' });
  }

  try {
    const positions = await getHistorique(vehiculeId, depuis, jusqu_a || new Date().toISOString());
    res.json(positions);
  } catch (err: any) {
    console.error('Erreur récupération historique:', err.message);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

app.get('/api/positions/:vehiculeId/historique', getHistoriqueHandler);
app.get('/positions/:vehicule_id/historique', getHistoriqueHandler);

// ── Dernière position connue ──────────────────────────────────────────────────
// Match gateway expectation: /positions/:vehicule_id/derniere
const getLastPositionHandler = async (req: Request, res: Response) => {
  const vehiculeId = req.params.vehiculeId || req.params.vehicule_id;

  try {
    const position = await getLastPosition(vehiculeId);
    if (!position) {
      return res.status(404).json({ error: `Aucune position trouvée pour le véhicule ${vehiculeId}` });
    }
    res.json(position);
  } catch (err: any) {
    console.error('Erreur récupération dernière position:', err.message);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

app.get('/api/positions/:vehiculeId/last', getLastPositionHandler);
app.get('/positions/:vehicule_id/derniere', getLastPositionHandler);

// ── Latest positions pour TOUS les véhicules (utilisé par la gateway/front) ──
app.get(['/api/positions/latest', '/positions/latest'], async (req: Request, res: Response) => {
  try {
    const positions = await getLatestAllPositions();
    res.json(positions);
  } catch (err: any) {
    console.error('Erreur récupération latest positions:', err.message);
    res.status(500).json({ error: 'Erreur interne' });
  }
});

// ── Gestion des Zones (Géofencing) ─────────────────────────────────────────────
// GET /zones
app.get(['/api/zones', '/zones'], (req: Request, res: Response) => {
  res.json(ZONES);
});

// GET /zones/:id
app.get(['/api/zones/:id', '/zones/:id'], (req: Request, res: Response) => {
  const zone = ZONES.find(z => z.id === req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone non trouvée' });
  res.json(zone);
});

// POST /positions
app.post(['/api/positions', '/positions'], async (req: Request, res: Response) => {
  const { vehicule_id, latitude, longitude, vitesse, horodatage } = req.body;

  if (!vehicule_id || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Champs obligatoires manquants : vehicule_id, latitude, longitude' });
  }

  try {
    const position = {
      vehicule_id,
      latitude,
      longitude,
      vitesse: vitesse || 0,
      horodatage: horodatage || new Date().toISOString()
    };
    await savePosition(position);
    res.status(201).json({ ...position, id_position: randomUUID() });
  } catch (err: any) {
    console.error('Erreur création position:', err.message);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Mutations Zones
app.post(['/api/zones', '/zones'], checkRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { nom, type, latitude_centre, longitude_centre, rayon_metres } = req.body;

  if (!nom || !type || latitude_centre === undefined || longitude_centre === undefined) {
    return res.status(400).json({ error: 'Champs obligatoires manquants pour la zone' });
  }

  const newZone: any = {
    id_zone: randomUUID(),
    nom: nom,
    type,
    latitude_centre,
    longitude_centre,
    rayon_metres
  };

  ZONES.push({
    id: newZone.id_zone,
    name: newZone.nom,
    type: newZone.type,
    lat: latitude_centre,
    lng: longitude_centre,
    radiusMeter: rayon_metres
  });
  
  res.status(201).json(newZone);
});

app.put(['/api/zones/:id', '/zones/:id'], checkRole(['admin', 'manager', 'technicien']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { nom, type, latitude_centre, longitude_centre, rayon_metres } = req.body;

  const index = ZONES.findIndex((z) => z.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Zone non trouvée' });
  }

  const updatedZone: Zone = {
    ...ZONES[index],
    name: nom || ZONES[index].name,
    type: type || ZONES[index].type,
  };

  if (latitude_centre !== undefined) updatedZone.lat = latitude_centre;
  if (longitude_centre !== undefined) updatedZone.lng = longitude_centre;
  if (rayon_metres !== undefined) updatedZone.radiusMeter = rayon_metres;

  ZONES[index] = updatedZone;
  res.json(updatedZone);
});

app.delete(['/api/zones/:id', '/zones/:id'], checkRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const index = ZONES.findIndex((z) => z.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Zone non trouvée' });
  }

  ZONES.splice(index, 1);
  res.status(200).json({ success: true, message: `Zone ${id} supprimée` });
});

import http from 'http';

export function startHttpServer(port: number): http.Server {
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`Serveur HTTP démarré sur le port ${port}`);
    console.log(`  GET /health`);
    console.log(`  GET /api/positions/:vehiculeId/historique?depuis=ISO&jusqu_a=ISO`);
    console.log(`  GET /api/positions/:vehiculeId/last`);
  });
  return server;
}
