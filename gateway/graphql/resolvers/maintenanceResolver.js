const axios = require('axios');

const MAINTENANCE_SERVICE_URL = process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:8002/api/interventions';

const maintenanceResolver = {
  Query: {
    interventions: async (_, params, { token }) => {
      try {
        const response = await axios.get(MAINTENANCE_SERVICE_URL, { 
          params,
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching interventions:', error.message);
        throw new Error('Failed to fetch interventions');
      }
    },
    intervention: async (_, { id }, { token }) => {
      try {
        const response = await axios.get(`${MAINTENANCE_SERVICE_URL}/${id}`, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching intervention ${id}:`, error.message);
        throw new Error('Intervention not found');
      }
    },
  },

  Mutation: {
    createIntervention: async (_, { input }, { token }) => {
      try {
        const response = await axios.post(MAINTENANCE_SERVICE_URL, input, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error('Error creating intervention:', error.message);
        throw new Error('Failed to create intervention');
      }
    },
    updateIntervention: async (_, { id, input }, { token }) => {
      try {
        const response = await axios.put(`${MAINTENANCE_SERVICE_URL}/${id}`, input, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error updating intervention ${id}:`, error.message);
        throw new Error('Failed to update intervention');
      }
    },
    demarrerIntervention: async (_, { id }, { token }) => {
      try {
        const response = await axios.patch(`${MAINTENANCE_SERVICE_URL}/${id}/demarrer`, null, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error starting intervention ${id}:`, error.message);
        throw new Error('Failed to start intervention');
      }
    },
    terminerIntervention: async (_, { id, date_realisation, cout, description }, { token }) => {
      try {
        const response = await axios.patch(`${MAINTENANCE_SERVICE_URL}/${id}/terminer`, {
          date_realisation,
          cout,
          description
        }, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error finishing intervention ${id}:`, error.message);
        throw new Error('Failed to finish intervention');
      }
    },
  },
};

module.exports = maintenanceResolver;
