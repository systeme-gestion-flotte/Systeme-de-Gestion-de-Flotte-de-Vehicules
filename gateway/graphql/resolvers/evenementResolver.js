const axios = require('axios');

const BASE_URL = process.env.EVENEMENT_SERVICE_URL || 'http://localhost:8003';
const EVENEMENT_URL = `${BASE_URL}/api/evenements`;

const evenementResolver = {
  Query: {
    evenements: async (_, params, { token }) => {
      try {
        const response = await axios.get(EVENEMENT_URL, { 
          params,
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching evenements:', error.message);
        throw new Error('Failed to fetch evenements');
      }
    },
    evenement: async (_, { id }, { token }) => {
      try {
        const response = await axios.get(`${EVENEMENT_URL}/${id}`, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching evenement ${id}:`, error.message);
        throw new Error('Evenement not found');
      }
    },
    evenementsCritiques: async (_, __, { token }) => {
      try {
        const response = await axios.get(`${EVENEMENT_URL}/critiques`, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching critical evenements:', error.message);
        throw new Error('Failed to fetch critical evenements');
      }
    },
    statsEvenements: async (_, { depuis }, { token }) => {
      try {
        const response = await axios.get(`${EVENEMENT_URL}/stats`, { 
          params: { depuis },
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching evenement stats:', error.message);
        throw new Error('Failed to fetch evenement stats');
      }
    },
  },

  Mutation: {
    acquitterEvenement: async (_, { id }, { token }) => {
      try {
        const response = await axios.patch(`${EVENEMENT_URL}/${id}/acquitter`, null, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error acquitting evenement ${id}:`, error.message);
        throw new Error('Failed to acquit evenement');
      }
    },
  },
};

module.exports = evenementResolver;
