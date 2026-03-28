const axios = require('axios');

// Le service écoute sur 4000 dans Docker, mais est mappé sur 8081 à l'extérieur
const VEHICULE_SERVICE_URL = process.env.VEHICULE_SERVICE_URL || 'http://localhost:8081/api/vehicules';

const vehiculeResolver = {
  Query: {
    vehicules: async (_, { filter }, { token }) => {
      try {
        const response = await axios.get(VEHICULE_SERVICE_URL, { 
          params: filter,
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        if (error.response) {
          console.error('Error fetching vehicules details:', error.response.status, error.response.data);
        } else {
          console.error('Error fetching vehicules:', error.message);
        }
        throw new Error('Failed to fetch vehicules');
      }
    },
    vehicule: async (_, { id }, { token }) => {
      try {
        const response = await axios.get(`${VEHICULE_SERVICE_URL}/${id}`, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        if (error.response) {
          console.error(`Error fetching vehicule ${id} details:`, error.response.status, error.response.data);
        } else {
          console.error(`Error fetching vehicule ${id}:`, error.message);
        }
        throw new Error('Vehicule not found');
      }
    },
    vehiculesDisponibles: async (_, __, { token }) => {
      try {
        const response = await axios.get(`${VEHICULE_SERVICE_URL}/disponibles`, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching available vehicules:', error.message);
        throw new Error('Failed to fetch available vehicules');
      }
    },
  },

  Mutation: {
    createVehicule: async (_, { input }, { token }) => {
      try {
        const response = await axios.post(VEHICULE_SERVICE_URL, input, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        if (error.response) {
          console.error('Error creating vehicule details:', error.response.status, error.response.data);
        } else {
          console.error('Error creating vehicule:', error.message);
        }
        throw new Error('Failed to create vehicule');
      }
    },
    updateVehicule: async (_, { id, input }, { token }) => {
      try {
        const response = await axios.put(`${VEHICULE_SERVICE_URL}/${id}`, input, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error updating vehicule ${id}:`, error.message);
        throw new Error('Failed to update vehicule');
      }
    },
    deleteVehicule: async (_, { id }, { token }) => {
      try {
        await axios.delete(`${VEHICULE_SERVICE_URL}/${id}`, {
          headers: token ? { Authorization: token } : {}
        });
        return true;
      } catch (error) {
        console.error(`Error deleting vehicule ${id}:`, error.message);
        throw new Error('Failed to delete vehicule');
      }
    },
    updateVehiculeStatut: async (_, { id, statut }, { token }) => {
      try {
        const response = await axios.patch(`${VEHICULE_SERVICE_URL}/${id}/statut`, { statut }, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error updating statut for vehicule ${id}:`, error.message);
        throw new Error('Failed to update vehicule statut');
      }
    },
    updateVehiculeKilometrage: async (_, { id, kilometrage }, { token }) => {
      try {
        const response = await axios.patch(`${VEHICULE_SERVICE_URL}/${id}/kilometrage`, { kilometrage }, {
          headers: token ? { Authorization: token } : {}
        });
        return response.data;
      } catch (error) {
        console.error(`Error updating kilometrage for vehicule ${id}:`, error.message);
        throw new Error('Failed to update vehicule kilometrage');
      }
    },
  },
};

module.exports = vehiculeResolver;
