const axios = require('axios');
const { mapToSnakeCase, mapToCamelCase } = require('./utils');

const BASE_URL = process.env.CONDUCTEUR_SERVICE_URL || 'http://localhost:3001';
const CONDUCTEUR_URL = `${BASE_URL}/api/conducteurs`;
const ASSIGNATION_URL = `${BASE_URL}/api/assignations`;

const conducteurResolver = {
  Query: {
    conducteurs: async (_, { actif, page, limit }, { token }) => {
      try {
        const response = await axios.get(CONDUCTEUR_URL, {
          params: { actif, page, limit },
          headers: token ? { Authorization: token } : {},
        });
        const data = response.data.data || response.data;
        return mapToSnakeCase(data);
      } catch (error) {
        console.error('Error fetching conducteurs:', error.message);
        throw new Error('Failed to fetch conducteurs');
      }
    },

    conducteur: async (_, { id }, { token }) => {
      try {
        const response = await axios.get(`${CONDUCTEUR_URL}/${id}`, {
          headers: token ? { Authorization: token } : {},
        });
        return mapToSnakeCase(response.data);
      } catch (error) {
        console.error(`Error fetching conducteur ${id}:`, error.message);
        throw new Error('Conducteur not found');
      }
    },

    assignations: async (_, { statut, vehicule_id }, { token }) => {
      try {
        const response = await axios.get(ASSIGNATION_URL, {
          params: { statut, vehicule_id },
          headers: token ? { Authorization: token } : {},
        });
        const data = response.data.data || response.data;
        return mapToSnakeCase(data);
      } catch (error) {
        console.error('Error fetching assignations:', error.message);
        throw new Error('Failed to fetch assignations');
      }
    },
  },

  Mutation: {
    createConducteur: async (_, { input }, { token }) => {
      try {
        const mappedInput = mapToCamelCase(input);
        const response = await axios.post(CONDUCTEUR_URL, mappedInput, {
          headers: token ? { Authorization: token } : {},
        });
        return mapToSnakeCase(response.data);
      } catch (error) {
        if (error.response) {
          console.error('Error creating conducteur (Service details):', error.response.status, JSON.stringify(error.response.data));
        } else {
          console.error('Error creating conducteur:', error.message);
        }
        throw new Error('Failed to create conducteur');
      }
    },

    updateConducteur: async (_, { id, input }, { token }) => {
      try {
        const mappedInput = mapToCamelCase(input);
        const response = await axios.put(`${CONDUCTEUR_URL}/${id}`, mappedInput, {
          headers: token ? { Authorization: token } : {},
        });
        return mapToSnakeCase(response.data);
      } catch (error) {
        if (error.response) {
          console.error(`Error updating conducteur ${id} (Service details):`, error.response.status, JSON.stringify(error.response.data));
        } else {
          console.error(`Error updating conducteur ${id}:`, error.message);
        }
        throw new Error('Failed to update conducteur');
      }
    },

    deactivateConducteur: async (_, { id }, { token }) => {
      try {
        await axios.delete(`${CONDUCTEUR_URL}/${id}`, {
          headers: token ? { Authorization: token } : {},
        });
        return true;
      } catch (error) {
        console.error(`Error deactivating conducteur ${id}:`, error.message);
        throw new Error('Failed to deactivate conducteur');
      }
    },

    createAssignation: async (_, { input }, { token }) => {
      try {
        const mappedInput = mapToCamelCase(input);
        const response = await axios.post(ASSIGNATION_URL, mappedInput, {
          headers: token ? { Authorization: token } : {},
        });
        return mapToSnakeCase(response.data);
      } catch (error) {
        if (error.response) {
          console.error('Error creating assignation (Service details):', error.response.status, JSON.stringify(error.response.data));
        } else {
          console.error('Error creating assignation:', error.message);
        }
        throw new Error('Failed to create assignation');
      }
    },

    terminerAssignation: async (_, { id, date_retour }, { token }) => {
      try {
        const response = await axios.patch(
          `${ASSIGNATION_URL}/${id}/terminer`,
          { date_retour },
          { headers: token ? { Authorization: token } : {} },
        );
        return mapToSnakeCase(response.data);
      } catch (error) {
        console.error(`Error finishing assignation ${id}:`, error.message);
        throw new Error('Failed to terminate assignation');
      }
    },

    annulerAssignation: async (_, { id }, { token }) => {
      try {
        const response = await axios.patch(
          `${ASSIGNATION_URL}/${id}/annuler`,
          null,
          { headers: token ? { Authorization: token } : {} },
        );
        return mapToSnakeCase(response.data);
      } catch (error) {
        console.error(`Error cancelling assignation ${id}:`, error.message);
        throw new Error('Failed to cancel assignation');
      }
    },
  },
  
  Assignation: {
    vehicule: async (assignation, _, { token }) => {
      // Importations dynamiques pour éviter les dépendances circulaires si nécessaire, 
      // mais ici on peut appeler directement l'URL
      const VEHICULE_SERVICE_URL = process.env.VEHICULE_SERVICE_URL || 'http://localhost:8081/api/vehicules';
      try {
        const response = await axios.get(`${VEHICULE_SERVICE_URL}/${assignation.vehicule_id}`, {
          headers: token ? { Authorization: token } : {}
        });
        return mapToSnakeCase(response.data);
      } catch (error) {
        return null; // On peut retourner null si le véhicule n'est pas trouvé
      }
    },
    conducteur: async (assignation, _, { token }) => {
      try {
        const response = await axios.get(`${CONDUCTEUR_URL}/${assignation.conducteur_id}`, {
          headers: token ? { Authorization: token } : {},
        });
        return mapToSnakeCase(response.data);
      } catch (error) {
        return null;
      }
    }
  }
};

module.exports = conducteurResolver;
