import { publishGeofencingAlert } from '../kafka/producer';
import { getVehiculeInfo } from '../cache/vehicule-cache';
import { producer } from '../kafka/producer';

export async function publierAlertGeofence(
  vehiculeId: number,
  immatriculation: string,
  conducteurId: string,
  zoneNom: string,
  type: 'sortie_zone_autorisee' | 'entree_zone_interdite'
): Promise<void> {
  try {
    if (!producer) return;
    await producer.send({
      topic: 'fleet.localisation.geofence.sortie',
      messages: [{
        value: JSON.stringify({
          vehicule_id:     vehiculeId,
          immatriculation: immatriculation,
          conducteur_id:   conducteurId,
          zone_nom:        zoneNom,
          type:            type,
          timestamp:       new Date().toISOString(),
        })
      }]
    });
    console.log(`[Kafka] Alerte geofence publiée : ${type} pour ${immatriculation} dans ${zoneNom}`);
  } catch (err) {
    console.error('[Kafka] Erreur publication geofence:', err);
  }
}

export interface Zone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeter: number; // Rayon en mètres
  type: 'AUTORISEE' | 'INTERDITE';
}

// Zones de test centrées sur Rouen (Cercles)
export const ZONES: Zone[] = [
  {
    id: 'zone-rouen-agglo',
    name: 'Agglomération de Rouen',
    lat: 49.44, 
    lng: 1.09,
    radiusMeter: 7000, // 7km pour couvrir toute l'agglo
    type: 'AUTORISEE',
  },
  {
    id: 'zone-industrielle-interdite',
    name: 'Zone Industrielle Interdite',
    lat: 49.42, 
    lng: 1.09,
    radiusMeter: 800,
    type: 'INTERDITE',
  },
  {
    id: 'zone-port-interdite',
    name: 'Port de Rouen — Zone Restreinte',
    lat: 49.43, 
    lng: 1.05,
    radiusMeter: 1000,
    type: 'INTERDITE',
  },
];

/**
 * Calcule la distance entre deux points GPS en mètres (Approximation Haversine)
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function isInZone(lat: number, lng: number, zone: Zone): boolean {
  const distance = getDistance(lat, lng, zone.lat, zone.lng);
  return distance <= zone.radiusMeter;
}

export interface GeofencingResult {
  violated: boolean;
  zone?: Zone;
}

export function checkGeofencing(lat: number, lng: number): GeofencingResult {
  for (const zone of ZONES) {
    if (zone.type === 'INTERDITE' && isInZone(lat, lng, zone)) {
      return { violated: true, zone };
    }
  }
  return { violated: false };
}

export function getZonesForPosition(lat: number, lng: number): Zone[] {
  return ZONES.filter((z) => isInZone(lat, lng, z));
}
