const axios = require('axios');

// Service URLs (should be in .env in production)
const SERVICES = {
  VEHICULE: process.env.VEHICULE_SERVICE_URL || 'http://localhost:8081/api/vehicules',
  CONDUCTEUR: process.env.CONDUCTEUR_SERVICE_URL || 'http://localhost:3002/api/conducteurs',
  MAINTENANCE: process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:8002/api/interventions',
  EVENEMENT: process.env.EVENEMENT_SERVICE_URL || 'http://localhost:8003/api/evenements',
  LOCALISATION: process.env.LOCALISATION_SERVICE_URL || 'http://localhost:50051', 
};

const resolvers = {
  Query: {
    // Vehicules
    vehicules: async (_, { filter }) => {
      const response = await axios.get(SERVICES.VEHICULE, { params: filter });
      return response.data;
    },
    vehicule: async (_, { id }) => {
      const response = await axios.get(`${SERVICES.VEHICULE}/${id}`);
      return response.data;
    },
    vehiculesDisponibles: async () => {
      const response = await axios.get(`${SERVICES.VEHICULE}/disponibles`);
      return response.data;
    },

    // Conducteurs
    conducteurs: async (_, { actif, page, limit }) => {
      const response = await axios.get(SERVICES.CONDUCTEUR, { params: { actif, page, limit } });
      return response.data.data;
    },
    conducteur: async (_, { id }) => {
      const response = await axios.get(`${SERVICES.CONDUCTEUR}/${id}`);
      return response.data;
    },
    assignations: async (_, { statut, vehicule_id }) => {
      const response = await axios.get(`${SERVICES.CONDUCTEUR}/assignations`, { params: { statut, vehicule_id } });
      return response.data;
    },

    // Maintenance
    interventions: async (_, params) => {
      const response = await axios.get(SERVICES.MAINTENANCE, { params });
      return response.data;
    },
    intervention: async (_, { id }) => {
      const response = await axios.get(`${SERVICES.MAINTENANCE}/${id}`);
      return response.data;
    },

    // Evenements
    evenements: async (_, params) => {
      const response = await axios.get(SERVICES.EVENEMENT, { params });
      return response.data;
    },
    evenement: async (_, { id }) => {
      const response = await axios.get(`${SERVICES.EVENEMENT}/${id}`);
      return response.data;
    },

    // Localisation
    dernierePosition: async (_, { vehicule_id }) => {
      const response = await axios.get(`${SERVICES.LOCALISATION}/positions/${vehicule_id}/derniere`);
      return response.data;
    },
  },

  Mutation: {
    // Vehicules
    createVehicule: async (_, { input }) => {
      const response = await axios.post(SERVICES.VEHICULE, input);
      return response.data;
    },
    deleteVehicule: async (_, { id }) => {
      await axios.delete(`${SERVICES.VEHICULE}/${id}`);
      return true;
    },

    // Conducteurs
    createConducteur: async (_, { input }) => {
      const response = await axios.post(SERVICES.CONDUCTEUR, input);
      return response.data;
    },

    // Maintenance
    createIntervention: async (_, { input }) => {
      const response = await axios.post(SERVICES.MAINTENANCE, input);
      return response.data;
    },

    // Evenements
    acquitterEvenement: async (_, { id }) => {
      const response = await axios.patch(`${SERVICES.EVENEMENT}/${id}/acquitter`);
      return response.data;
    },
  }
};

module.exports = resolvers;
