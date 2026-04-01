const axios = require('axios');
const { mapToSnakeCase, mapToCamelCase } = require('./utils');

const BASE_URL = process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:8002';
const MAINTENANCE_URL = `${BASE_URL}/api/interventions`;

const maintenanceResolver = {
  Query: {
    interventions: async (_, params, { token }) => {
      try {
        const response = await axios.get(MAINTENANCE_URL, { 
          params,
          headers: token ? { Authorization: token } : {}
        });
        // FastAPI renvoie { data: [...], total: X }, GraphQL attend le tableau
        const data = response.data.data || response.data;
        const mapped = mapToSnakeCase(data);
        if (Array.isArray(mapped)) {
          return mapped.map(item => {
            if (item.statut) item.statut = item.statut.toUpperCase();
            if (item.type) item.type = item.type.toUpperCase();
            return item;
          });
        }
        if (mapped.statut) mapped.statut = mapped.statut.toUpperCase();
        if (mapped.type) mapped.type = mapped.type.toUpperCase();
        return mapped;
      } catch (error) {
        if (error.response) {
          console.error('Error fetching interventions (Service details):', error.response.status, JSON.stringify(error.response.data));
        } else {
          console.error('Error fetching interventions:', error.message);
        }
        throw new Error('Failed to fetch interventions');
      }
    },
    intervention: async (_, { id }, { token }) => {
      try {
        const response = await axios.get(`${MAINTENANCE_URL}/${id}`, {
          headers: token ? { Authorization: token } : {}
        });
        const data = mapToSnakeCase(response.data);
        if (data.statut) data.statut = data.statut.toUpperCase();
        if (data.type) data.type = data.type.toUpperCase();
        return data;
      } catch (error) {
        if (error.response) {
          console.error(`Error fetching intervention ${id} (Service details):`, error.response.status, JSON.stringify(error.response.data));
        } else {
          console.error(`Error fetching intervention ${id}:`, error.message);
        }
        throw new Error('Intervention not found');
      }
    },
  },

  Mutation: {
    createIntervention: async (_, { input }, { token }) => {
      try {
        const response = await axios.post(MAINTENANCE_URL, input, {
          headers: token ? { Authorization: token } : {}
        });
        const data = mapToSnakeCase(response.data);
        if (data.statut) data.statut = data.statut.toUpperCase();
        if (data.type) data.type = data.type.toUpperCase();
        return data;
      } catch (error) {
        if (error.response) {
          console.error('Error creating intervention (Service details):', error.response.status, JSON.stringify(error.response.data));
        } else {
          console.error('Error creating intervention:', error.message);
        }
        throw new Error('Failed to create intervention');
      }
    },
    updateIntervention: async (_, { id, input }, { token }) => {
      try {
        const response = await axios.put(`${MAINTENANCE_URL}/${id}`, input, {
          headers: token ? { Authorization: token } : {}
        });
        const data = mapToSnakeCase(response.data);
        if (data.statut) data.statut = data.statut.toUpperCase();
        if (data.type) data.type = data.type.toUpperCase();
        return data;
      } catch (error) {
        if (error.response) {
          console.error(`Error updating intervention ${id} (Service details):`, error.response.status, JSON.stringify(error.response.data));
        } else {
          console.error(`Error updating intervention ${id}:`, error.message);
        }
        throw new Error('Failed to update intervention');
      }
    },
    demarrerIntervention: async (_, { id }, { token }) => {
      try {
        const response = await axios.patch(`${MAINTENANCE_URL}/${id}/demarrer`, null, {
          headers: token ? { Authorization: token } : {}
        });
        const data = mapToSnakeCase(response.data);
        if (data.statut) data.statut = data.statut.toUpperCase();
        if (data.type) data.type = data.type.toUpperCase();
        return data;
      } catch (error) {
        if (error.response) {
          console.error(`Error starting intervention ${id} (Service details):`, error.response.status, JSON.stringify(error.response.data));
        } else {
          console.error(`Error starting intervention ${id}:`, error.message);
        }
        throw new Error('Failed to start intervention');
      }
    },
    terminerIntervention: async (_, { id, date_realisation, cout, description }, { token }) => {
      try {
        const response = await axios.patch(`${MAINTENANCE_URL}/${id}/terminer`, {
          date_realisation,
          cout,
          description
        }, {
          headers: token ? { Authorization: token } : {}
        });
        const data = mapToSnakeCase(response.data);
        if (data.statut) data.statut = data.statut.toUpperCase();
        if (data.type) data.type = data.type.toUpperCase();
        return data;
      } catch (error) {
        if (error.response) {
          console.error(`Error finishing intervention ${id} (Service details):`, error.response.status, JSON.stringify(error.response.data));
        } else {
          console.error(`Error finishing intervention ${id}:`, error.message);
        }
        throw new Error('Failed to finish intervention');
      }
    },
  },
};

module.exports = maintenanceResolver;
