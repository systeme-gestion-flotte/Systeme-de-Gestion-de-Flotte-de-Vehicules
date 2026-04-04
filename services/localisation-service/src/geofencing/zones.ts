export interface Zone {
  id: string;
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  type: 'AUTORISEE' | 'INTERDITE';
}

// Zones de test centrées sur Rouen et ses alentours
export const ZONES: Zone[] = [
  {
    id: 'zone-rouen-centre',
    name: 'Rouen Centre',
    minLat: 49.43,
    maxLat: 49.46,
    minLng: 1.07,
    maxLng: 1.12,
    type: 'AUTORISEE',
  },
  {
    id: 'zone-industrielle-interdite',
    name: 'Zone Industrielle Interdite',
    minLat: 49.415,
    maxLat: 49.425,
    minLng: 1.085,
    maxLng: 1.095,
    type: 'INTERDITE',
  },
  {
    id: 'zone-port-interdite',
    name: 'Port de Rouen — Zone Restreinte',
    minLat: 49.425,
    maxLat: 49.435,
    minLng: 1.04,
    maxLng: 1.06,
    type: 'INTERDITE',
  },
];

export function isInZone(lat: number, lng: number, zone: Zone): boolean {
  return (
    lat >= zone.minLat &&
    lat <= zone.maxLat &&
    lng >= zone.minLng &&
    lng <= zone.maxLng
  );
}

export interface GeofencingResult {
  violated: boolean;
  zone?: Zone;
}

/**
 * Vérifie si une position GPS viole une zone interdite.
 * Retourne la première zone interdite dans laquelle le véhicule se trouve.
 */
export function checkGeofencing(lat: number, lng: number): GeofencingResult {
  for (const zone of ZONES) {
    if (zone.type === 'INTERDITE' && isInZone(lat, lng, zone)) {
      return { violated: true, zone };
    }
  }
  return { violated: false };
}

/**
 * Retourne toutes les zones (autorisées et interdites) dans lesquelles
 * se trouve la position donnée.
 */
export function getZonesForPosition(lat: number, lng: number): Zone[] {
  return ZONES.filter((z) => isInZone(lat, lng, z));
}
