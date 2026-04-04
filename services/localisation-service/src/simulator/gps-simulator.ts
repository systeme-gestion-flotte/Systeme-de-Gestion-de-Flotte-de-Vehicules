// Simulateur GPS pour les tests — génère des positions réalistes autour de Rouen

export interface SimulatedPosition {
  vehicule_id: string;
  latitude: number;
  longitude: number;
  vitesse: number;
  horodatage: string;
}

// Identifiants des véhicules simulés
const VEHICULE_IDS = ['550e8400-e29b-41d4-a716-446655440000', 'VEH-001', 'VEH-002', 'VEH-003', 'VEH-004', 'VEH-005'];

// Position de départ : centre de Rouen
const BASE_LAT = 49.443232;
const BASE_LNG = 1.099971;

// État interne : positions courantes par véhicule (dérive progressive)
const currentPositions: Map<string, { lat: number; lng: number }> = new Map(
  VEHICULE_IDS.map((id) => [
    id,
    {
      lat: BASE_LAT + (Math.random() - 0.5) * 0.04,
      lng: BASE_LNG + (Math.random() - 0.5) * 0.04,
    },
  ]),
);

/**
 * Génère une nouvelle position simulée pour un véhicule donné.
 * La position dérive légèrement à chaque appel pour simuler un mouvement réaliste.
 */
export function generatePosition(vehiculeId: string): SimulatedPosition {
  const current = currentPositions.get(vehiculeId) ?? { lat: BASE_LAT, lng: BASE_LNG };

  // Dérive aléatoire de ±0.002° (~200 m) par tick
  const newLat = current.lat + (Math.random() - 0.5) * 0.004;
  const newLng = current.lng + (Math.random() - 0.5) * 0.004;

  currentPositions.set(vehiculeId, { lat: newLat, lng: newLng });

  return {
    vehicule_id: vehiculeId,
    latitude: Math.round(newLat * 1_000_000) / 1_000_000,
    longitude: Math.round(newLng * 1_000_000) / 1_000_000,
    vitesse: Math.round(Math.random() * 130),
    horodatage: new Date().toISOString(),
  };
}

/**
 * Lance la simulation GPS pour tous les véhicules.
 * Appelle onPosition à chaque tick pour chaque véhicule.
 * @returns Le timer pour pouvoir l'arrêter avec clearInterval()
 */
export function startSimulator(
  onPosition: (position: SimulatedPosition) => Promise<void> | void,
  intervalMs = 5000,
): ReturnType<typeof setInterval> {
  console.log(`Simulateur GPS démarré — ${VEHICULE_IDS.length} véhicules, intervalle ${intervalMs}ms`);

  return setInterval(async () => {
    for (const vehiculeId of VEHICULE_IDS) {
      const position = generatePosition(vehiculeId);
      try {
        await onPosition(position);
      } catch (err: any) {
        console.error(`Simulateur: erreur pour ${vehiculeId}: ${err.message}`);
      }
    }
  }, intervalMs);
}
