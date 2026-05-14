// Simulateur GPS pour les tests — génère des positions réalistes autour de Rouen

import { producer } from '../kafka/producer';
import { SEUILS } from '../config/alertes.config';
import { getVehiculeInfo } from '../cache/vehicule-cache';

export interface SimulatedPosition {
  vehicule_id: string;
  latitude: number;
  longitude: number;
  vitesse: number;
  horodatage: string;
}

// État pour le tracking des alertes
const lastVitesseAlert = new Map<string, number>();
const immobileSince = new Map<string, number>();
const lastPositions = new Map<string, { lat: number; lng: number; time: number }>();

async function publierAlertImmobile(vehiculeId: string, immatriculation: string, conducteurId: string | null, dureeMinutes: number) {
  try {
    if (!producer) return;
    await producer.send({
      topic: 'fleet.localisation.immobile',
      messages: [{
        value: JSON.stringify({
          vehicule_id: vehiculeId,
          immatriculation,
          conducteur_id: conducteurId,
          duree_minutes: dureeMinutes,
          timestamp: new Date().toISOString(),
        })
      }]
    });
  } catch (err) { console.error('[Kafka] Erreur immobile:', err); }
}

async function publierAlertVitesse(vehiculeId: string, immatriculation: string, conducteurId: string | null, vitesseKmh: number, limiteKmh: number) {
  try {
    if (!producer) return;
    await producer.send({
      topic: 'fleet.localisation.vitesse',
      messages: [{
        value: JSON.stringify({
          vehicule_id: vehiculeId,
          immatriculation,
          conducteur_id: conducteurId,
          vitesse_kmh: vitesseKmh,
          limite_kmh: limiteKmh,
          timestamp: new Date().toISOString(),
        })
      }]
    });
  } catch (err) { console.error('[Kafka] Erreur vitesse:', err); }
}

async function publierSignalPerdu(vehiculeId: string, immatriculation: string, dernierePosition: { lat: number; lng: number }) {
  try {
    if (!producer) return;
    await producer.send({
      topic: 'fleet.localisation.signal_perdu',
      messages: [{
        value: JSON.stringify({
          vehicule_id: vehiculeId,
          immatriculation,
          derniere_position: dernierePosition,
          timestamp: new Date().toISOString(),
        })
      }]
    });
  } catch (err) { console.error('[Kafka] Erreur signal perdu:', err); }
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
      const now = Date.now();
      
      // Récupération des infos véhicule (cache/mock)
      // Note: on simule un ID numérique pour correspondre au cache si besoin, ou on adapte
      const numericId = VEHICULE_IDS.indexOf(vehiculeId) + 1;
      const info = getVehiculeInfo(numericId);

      try {
        // 1. Détection Excès de Vitesse
        if (position.vitesse > SEUILS.VITESSE_MAX_KMH) {
          const lastAlert = lastVitesseAlert.get(vehiculeId) || 0;
          if (now - lastAlert > 5 * 60 * 1000) { // Cooldown 5 min
            await publierAlertVitesse(vehiculeId, info.immatriculation, info.conducteur_id, position.vitesse, SEUILS.VITESSE_MAX_KMH);
            lastVitesseAlert.set(vehiculeId, now);
          }
        }

        // 2. Détection Immobilité
        const prev = lastPositions.get(vehiculeId);
        if (prev && prev.lat === position.latitude && prev.lng === position.longitude) {
          const immobileSinceTime = immobileSince.get(vehiculeId) || now;
          immobileSince.set(vehiculeId, immobileSinceTime);
          const minutes = (now - immobileSinceTime) / 60000;
          if (minutes >= SEUILS.IMMOBILE_MINUTES && Math.floor(minutes) % 30 === 0) { // Alerte toutes les 30 min
            await publierAlertImmobile(vehiculeId, info.immatriculation, info.conducteur_id, Math.floor(minutes));
          }
        } else {
          immobileSince.delete(vehiculeId);
        }
        lastPositions.set(vehiculeId, { lat: position.latitude, lng: position.longitude, time: now });

        await onPosition(position);
      } catch (err: any) {
        console.error(`Simulateur: erreur pour ${vehiculeId}: ${err.message}`);
      }
    }
  }, intervalMs);
}
