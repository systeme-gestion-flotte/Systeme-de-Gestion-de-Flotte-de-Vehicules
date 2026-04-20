import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // montée en charge
    { duration: '1m', target: 20 },  // plateau
    { duration: '20s', target: 0 },  // descente
  ],
};

const BASE_URL = 'http://api-gateway:4000';

export default function () {
  // 1. Liste des véhicules
  const resVehicules = http.get(`${BASE_URL}/vehicules`);
  check(resVehicules, {
    'status is 200 (Vehicles)': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Liste des conducteurs
  const resConducteurs = http.get(`${BASE_URL}/conducteurs`);
  check(resConducteurs, {
    'status is 200 (Drivers)': (r) => r.status === 200,
  });

  sleep(1);

  // 3. Status du Gateway
  const resRoot = http.get(`${BASE_URL}/`);
  check(resRoot, {
    'status is 200 (Gateway OK)': (r) => r.status === 200,
  });

  sleep(2);
}
