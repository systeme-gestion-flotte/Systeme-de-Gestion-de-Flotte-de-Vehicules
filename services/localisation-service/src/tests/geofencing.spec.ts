import { checkGeofencing, isInZone, getZonesForPosition, ZONES } from '../geofencing/zones';

describe('isInZone', () => {
  const zone = ZONES.find((z) => z.id === 'zone-rouen-centre')!;

  it('retourne true si la position est dans la zone', () => {
    expect(isInZone(49.44, 1.09, zone)).toBe(true);
  });

  it('retourne false si la position est hors de la zone', () => {
    expect(isInZone(48.0, 2.0, zone)).toBe(false);
  });

  it('retourne true sur les limites exactes de la zone', () => {
    expect(isInZone(zone.minLat, zone.minLng, zone)).toBe(true);
    expect(isInZone(zone.maxLat, zone.maxLng, zone)).toBe(true);
  });
});

describe('checkGeofencing', () => {
  it('ne détecte pas de violation dans une zone autorisée', () => {
    // Centre de Rouen — zone autorisée uniquement
    const result = checkGeofencing(49.44, 1.09);
    expect(result.violated).toBe(false);
    expect(result.zone).toBeUndefined();
  });

  it('détecte une violation dans la zone industrielle interdite', () => {
    // Coordonnées dans la zone interdite zone-industrielle-interdite
    const result = checkGeofencing(49.42, 1.09);
    expect(result.violated).toBe(true);
    expect(result.zone).toBeDefined();
    expect(result.zone!.type).toBe('INTERDITE');
    expect(result.zone!.id).toBe('zone-industrielle-interdite');
  });

  it('détecte une violation dans la zone port interdite', () => {
    const result = checkGeofencing(49.43, 1.05);
    expect(result.violated).toBe(true);
    expect(result.zone!.id).toBe('zone-port-interdite');
  });

  it('ne détecte pas de violation pour une position neutre', () => {
    // Position très éloignée (Paris)
    const result = checkGeofencing(48.8566, 2.3522);
    expect(result.violated).toBe(false);
  });
});

describe('getZonesForPosition', () => {
  it('retourne les zones correspondant à la position', () => {
    const zones = getZonesForPosition(49.44, 1.09);
    expect(zones.length).toBeGreaterThan(0);
    expect(zones.some((z) => z.id === 'zone-rouen-centre')).toBe(true);
  });

  it('retourne un tableau vide pour une position hors de toute zone', () => {
    const zones = getZonesForPosition(48.8566, 2.3522);
    expect(zones).toHaveLength(0);
  });
});
