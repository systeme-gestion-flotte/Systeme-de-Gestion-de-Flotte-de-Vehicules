const axios = require('axios');

const LOCALISATION_SERVICE_URL = process.env.LOCALISATION_SERVICE_URL || 'http://localhost:50051';

const localisationResolver = {
  Query: {
    dernierePosition: async (_, { vehicule_id }, { token }) => {
      try {
        const response = await axios.get(`${LOCALISATION_SERVICE_URL}/positions/${vehicule_id}/derniere`, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching last position for vehicule ${vehicule_id}:`, error.message);
        throw new Error('Position not found');
      }
    },
    historiquePositions: async (_, { vehicule_id, depuis, jusqu_a, limit }, { token }) => {
      try {
        const response = await axios.get(`${LOCALISATION_SERVICE_URL}/positions/${vehicule_id}/historique`, {
          params: { depuis, jusqu_a, limit },
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching positions history for vehicule ${vehicule_id}:`, error.message);
        throw new Error('Failed to fetch positions history');
      }
    },
    zones: async (_, __, { token }) => {
      try {
        const response = await axios.get(`${LOCALISATION_SERVICE_URL}/zones`, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching zones:', error.message);
        throw new Error('Failed to fetch zones');
      }
    },
    zone: async (_, { id }, { token }) => {
      try {
        const response = await axios.get(`${LOCALISATION_SERVICE_URL}/zones/${id}`, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching zone ${id}:`, error.message);
        throw new Error('Zone not found');
      }
    },
  },

  Mutation: {
    createPosition: async (_, { input }, { token }) => {
      try {
        const response = await axios.post(`${LOCALISATION_SERVICE_URL}/positions`, input, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error('Error creating position:', error.message);
        throw new Error('Failed to create position');
      }
    },
    createZone: async (_, { input }, { token }) => {
      try {
        const response = await axios.post(`${LOCALISATION_SERVICE_URL}/zones`, input, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error('Error creating zone:', error.message);
        throw new Error('Failed to create zone');
      }
    },
    updateZone: async (_, { id, input }, { token }) => {
      try {
        const response = await axios.put(`${LOCALISATION_SERVICE_URL}/zones/${id}`, input, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error updating zone ${id}:`, error.message);
        throw new Error('Failed to update zone');
      }
    },
    deleteZone: async (_, { id }, { token }) => {
      try {
        await axios.delete(`${LOCALISATION_SERVICE_URL}/zones/${id}`, {
          headers: token ? { Authorization: token } : {}
        });
        return true;
      } catch (error) {
        console.error(`Error deleting zone ${id}:`, error.message);
        throw new Error('Failed to delete zone');
      }
    },
  },
};

module.exports = localisationResolver;
