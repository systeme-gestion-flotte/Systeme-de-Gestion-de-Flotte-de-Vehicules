import express, { Request, Response } from 'express';
import { getHistorique, getLastPosition } from '../database/timescale';

const app = express();
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'localisation-service', timestamp: new Date().toISOString() });
});

// ── Historique d'un véhicule sur une plage temporelle ─────────────────────────
// GET /api/positions/:vehiculeId/historique?depuis=ISO&jusqu_a=ISO
app.get('/api/positions/:vehiculeId/historique', async (req: Request, res: Response) => {
  const { vehiculeId } = req.params;
  const { depuis, jusqu_a } = req.query as { depuis?: string; jusqu_a?: string };

  if (!depuis || !jusqu_a) {
    return res.status(400).json({
      error: 'Les paramètres depuis et jusqu_a (ISO 8601) sont obligatoires',
    });
  }

  try {
    const positions = await getHistorique(vehiculeId, depuis, jusqu_a);
    res.json({ vehiculeId, count: positions.length, positions });
  } catch (err: any) {
    console.error('Erreur récupération historique:', err.message);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ── Dernière position connue d'un véhicule ────────────────────────────────────
// GET /api/positions/:vehiculeId/last
app.get('/api/positions/:vehiculeId/last', async (req: Request, res: Response) => {
  const { vehiculeId } = req.params;

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
});

export function startHttpServer(port: number): void {
  app.listen(port, () => {
    console.log(`Serveur HTTP démarré sur le port ${port}`);
    console.log(`  GET /health`);
    console.log(`  GET /api/positions/:vehiculeId/historique?depuis=ISO&jusqu_a=ISO`);
    console.log(`  GET /api/positions/:vehiculeId/last`);
  });
}
