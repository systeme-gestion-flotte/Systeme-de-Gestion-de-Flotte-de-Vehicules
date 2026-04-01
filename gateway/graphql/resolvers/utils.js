/**
 * Convertit un objet de camelCase en snake_case
 * Utile pour mapper les réponses des microservices vers le schéma GraphQL
 */
const mapToSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(mapToSnakeCase);

  const result = {};
  for (const key in obj) {
    // Mapping manuel pour les champs connus
    const newKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    // Cas particuliers comme idConducteur -> id_conducteur
    let finalKey = newKey;
    if (key === 'idConducteur') finalKey = 'id_conducteur';
    if (key === 'idVehicule') finalKey = 'id_vehicule';
    if (key === 'idAssignation') finalKey = 'id_assignation';
    if (key === 'idIntervention') finalKey = 'id_intervention';
    if (key === 'idEvenement') finalKey = 'id_evenement';

    result[finalKey] = mapToSnakeCase(obj[key]);
  }
  return result;
};

/**
 * Convertit un objet de snake_case en camelCase
 * Utile pour mapper les inputs GraphQL vers les DTOs des microservices (NestJS)
 */
const mapToCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(mapToCamelCase);

  const result = {};
  for (const key in obj) {
    // Conversion snake_case -> camelCase
    const newKey = key.replace(/([-_][a-z])/g, group =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
    result[newKey] = mapToCamelCase(obj[key]);
  }
  return result;
};

module.exports = { mapToSnakeCase, mapToCamelCase };
