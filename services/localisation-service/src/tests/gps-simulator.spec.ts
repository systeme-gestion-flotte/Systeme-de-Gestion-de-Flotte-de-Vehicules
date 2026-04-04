import { generatePosition, startSimulator } from '../simulator/gps-simulator';

describe('generatePosition', () => {
  it('génère une position avec les champs requis', () => {
    const position = generatePosition('VEH-001');
    expect(position.vehicule_id).toBe('VEH-001');
    expect(typeof position.latitude).toBe('number');
    expect(typeof position.longitude).toBe('number');
    expect(typeof position.vitesse).toBe('number');
    expect(position.horodatage).toBeDefined();
  });

  it('génère une vitesse comprise entre 0 et 130 km/h', () => {
    for (let i = 0; i < 50; i++) {
      const { vitesse } = generatePosition('VEH-002');
      expect(vitesse).toBeGreaterThanOrEqual(0);
      expect(vitesse).toBeLessThanOrEqual(130);
    }
  });

  it('génère un horodatage ISO 8601 valide', () => {
    const { horodatage } = generatePosition('VEH-003');
    expect(new Date(horodatage).toISOString()).toBe(horodatage);
  });

  it('génère des positions différentes sur des appels successifs', () => {
    const p1 = generatePosition('VEH-004');
    const p2 = generatePosition('VEH-004');
    // La dérive est aléatoire — très peu probable que lat ET lng soient identiques
    const sameCoords = p1.latitude === p2.latitude && p1.longitude === p2.longitude;
    expect(sameCoords).toBe(false);
  });

  it("génère des coordonnées proches de Rouen (dans ±1°)", () => {
    const position = generatePosition('VEH-005');
    expect(Math.abs(position.latitude - 49.443232)).toBeLessThan(1);
    expect(Math.abs(position.longitude - 1.099971)).toBeLessThan(1);
  });
});

describe('startSimulator', () => {
  it('appelle le callback pour chaque tick', async () => {
    const received: string[] = [];
    const timer = startSimulator((pos) => {
      received.push(pos.vehicule_id);
    }, 50);

    await new Promise((resolve) => setTimeout(resolve, 120));
    clearInterval(timer);

    // 2 ticks × 5 véhicules = 10 appels minimum
    expect(received.length).toBeGreaterThanOrEqual(10);
  });
});
