const axios = require('axios');

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
        return response.data.data || response.data;
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
        return response.data;
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
        return response.data.data || response.data;
      } catch (error) {
        console.error('Error fetching assignations:', error.message);
        throw new Error('Failed to fetch assignations');
      }
    },
  },

  Mutation: {
    createConducteur: async (_, { input }, { token }) => {
      try {
        const response = await axios.post(CONDUCTEUR_URL, input, {
          headers: token ? { Authorization: token } : {},
        });
        return response.data;
      } catch (error) {
        console.error('Error creating conducteur:', error.message);
        throw new Error('Failed to create conducteur');
      }
    },

    updateConducteur: async (_, { id, input }, { token }) => {
      try {
        const response = await axios.put(`${CONDUCTEUR_URL}/${id}`, input, {
          headers: token ? { Authorization: token } : {},
        });
        return response.data;
      } catch (error) {
        console.error(`Error updating conducteur ${id}:`, error.message);
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
        const response = await axios.post(ASSIGNATION_URL, input, {
          headers: token ? { Authorization: token } : {},
        });
        return response.data;
      } catch (error) {
        console.error('Error creating assignation:', error.message);
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
        return response.data;
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
        return response.data;
      } catch (error) {
        console.error(`Error cancelling assignation ${id}:`, error.message);
        throw new Error('Failed to cancel assignation');
      }
    },
  },
};

module.exports = conducteurResolver;
