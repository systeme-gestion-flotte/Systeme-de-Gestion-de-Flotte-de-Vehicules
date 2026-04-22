require('./tracing');
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { loadFilesSync } = require('@graphql-tools/load-files');
const { mergeTypeDefs } = require('@graphql-tools/merge');
const path = require('path');
const axios = require('axios');
const http = require('http');

const resolvers = require('./graphql/resolvers/index.js');
const typesPaths = path.join(__dirname, './graphql/schema');
const typesArray = loadFilesSync(typesPaths, { extensions: ['graphql'] });
const typeDefs = mergeTypeDefs(typesArray);

async function startGateway() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(cors());
  app.use(express.json());

  // Middleware de logging pour diagnostic
  app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.url}`);
    next();
  });

  // Sécurité: Timeout global pour éviter de bloquer le front si un service est HS
  axios.defaults.timeout = 5000;

  // --- REST BRIDGE (Generic Proxy Helper) ---
  const proxyTo = (targetBaseUrl, serviceName) => async (req, res) => {
    // req.url contient déjà le path relatif si on utilise app.use()
    // Si on utilise app.all('/path*', ...), req.url est le path complet
    // On va extraire la partie après le préfixe
    const prefix = req.route.path.replace('*', '');
    const subPath = req.url.startsWith(prefix) ? req.url.substring(prefix.length) : req.url;
    const url = targetBaseUrl + subPath;

    try {
      console.log(`[Gateway Proxy] ${req.method} ${req.url} -> ${url}`);
      const config = {
        method: req.method,
        url: url,
        headers: { 
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json'
        },
        data: req.method !== 'GET' ? req.body : undefined,
        params: req.query
      };
      
      const resp = await axios(config);
      console.log(`[Gateway Success] ${serviceName} responded with ${resp.status}`);
      res.status(resp.status).json(resp.data);
    } catch (e) {
      const status = e.response?.status || 500;
      console.error(`[Gateway Error] ${serviceName} URL: ${url} | Status: ${status} | Msg: ${e.message}`);
      if (e.response?.data) {
        console.error(`[Gateway Error Detail]`, JSON.stringify(e.response.data).substring(0, 200));
      }
      res.status(status).json(e.response?.data || { error: e.message });
    }
  };

  // Routes proxyifiées
  app.all('/vehicules*', proxyTo('http://fleet-vehicule-service:4000/api/vehicules', 'Vehicules'));
  app.all('/conducteurs*', proxyTo('http://fleet-conducteur-service:3000/api/conducteurs', 'Conducteurs'));
  app.all('/maintenance*', proxyTo('http://fleet-maintenance-service:8000/api', 'Maintenance'));
  app.all('/localisation*', proxyTo('http://fleet-localisation-service:3002', 'Localisation'));
  app.all('/alerts*', proxyTo('http://fleet-evenement-service:8000/alerts', 'Alertes'));

  // Route dédiée pour les Utilisateurs (Stateful Mock pour démo)
  let mockUsers = [
    { id: '1', username: 'admin-fleet', email: 'admin@fleet.local', roles: ['admin'], firstName: 'Admin', lastName: 'Flotte' },
    { id: '2', username: 'manager-fleet', email: 'manager@fleet.local', roles: ['manager', 'admin'], firstName: 'Manager', lastName: 'Flotte' },
    { id: '3', username: 'technicien-fleet', email: 'tech@fleet.local', roles: ['technicien'], firstName: 'Technicien', lastName: 'Flotte' },
    { id: '4', username: 'conducteur-fleet', email: 'conducteur@fleet.local', roles: ['utilisateur'], firstName: 'Jean', lastName: 'Dupont' },
    { id: '5', username: 'jack.dubois', email: 'jackdubois@gmail.com', roles: ['utilisateur'], firstName: 'Jack', lastName: 'Dubois' },
    { id: '6', username: 'pierre.leclerc', email: 'pierre@fleet.local', roles: ['utilisateur'], firstName: 'Pierre', lastName: 'Leclerc' },
    { id: '7', username: 'sophie.martin', email: 'sophie@fleet.local', roles: ['utilisateur'], firstName: 'Sophie', lastName: 'Martin' }
  ];

  app.get('/users', (req, res) => res.json(mockUsers));
  
  app.post('/users', (req, res) => {
    const newUser = { ...req.body, id: Date.now().toString() };
    mockUsers.push(newUser);
    res.status(201).json(newUser);
  });

  app.put('/users/:id', (req, res) => {
    const idx = mockUsers.findIndex(u => u.id === req.params.id);
    if (idx >= 0) {
      mockUsers[idx] = { ...mockUsers[idx], ...req.body };
      res.json(mockUsers[idx]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  app.delete('/users/:id', (req, res) => {
    mockUsers = mockUsers.filter(u => u.id !== req.params.id);
    res.status(204).send();
  });

  // --- GraphQL Endpoint ---
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => ({ token: req.headers.authorization || '' }),
  }));

  app.get('/', (req, res) => res.json({ status: "Gateway REST/GraphQL OK" }));

  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Gateway hybride (REST + GraphQL) prête sur http://localhost:4000`);
}

startGateway().catch(err => {
  console.error("Erreur lancement Gateway:", err);
});