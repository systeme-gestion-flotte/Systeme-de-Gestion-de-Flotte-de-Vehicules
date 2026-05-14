// src/cache/vehicule-cache.ts

export interface VehiculeInfo {
  immatriculation: string;
  conducteur_id:   string | null;
}

let cache = new Map<number, VehiculeInfo>();

// Mock statique pour le développement et le simulateur
const VEHICULES_MOCK: Record<number, VehiculeInfo> = {
  1: { immatriculation: "AB-123-CD", conducteur_id: "uuid-conducteur-1" },
  2: { immatriculation: "EF-456-GH", conducteur_id: "uuid-conducteur-2" },
  3: { immatriculation: "IJ-789-KL", conducteur_id: "uuid-conducteur-3" },
};

/**
 * Rafraîchit le cache en appelant les services internes.
 * En mode développement/simulateur, utilise les données mockées.
 */
export async function rafraichirCache(): Promise<void> {
  try {
    /*
    const responseVehicules = await fetch('http://vehicule-service:4000/vehicules', {
      headers: { 'Authorization': `Bearer ${SERVICE_JWT}` }
    });
    // ... logique de parsing et remplissage du Map ...
    */

    // Pour l'instant, on remplit avec le mock
    Object.entries(VEHICULES_MOCK).forEach(([id, info]) => {
      cache.set(Number(id), info);
    });

    console.log('[Cache] Cache véhicule/conducteur mis à jour');
  } catch (err) {
    console.error('[Cache] Erreur lors du rafraîchissement du cache:', err);
    // On garde l'ancien cache en cas d'erreur
  }
}

/**
 * Récupère les informations d'un véhicule de manière synchrone depuis le cache.
 */
export function getVehiculeInfo(vehiculeId: number): VehiculeInfo {
  return cache.get(vehiculeId) ?? {
    immatriculation: `VEHICULE-${vehiculeId}`,
    conducteur_id:   null,
  };
}

// Initialisation au chargement du module (pour le mock)
Object.entries(VEHICULES_MOCK).forEach(([id, info]) => {
  cache.set(Number(id), info);
});
