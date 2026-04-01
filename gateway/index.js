const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { loadFilesSync } = require('@graphql-tools/load-files');
const { mergeTypeDefs } = require('@graphql-tools/merge');
const path = require('path');

// 1. Importer notre Cuisinier (Nos resolvers)
const resolvers = require('./graphql/resolvers/index.js');

// 2. Charger et fusionner tous nos Menus (Nos fichiers .graphql)
// 2. Charger et fusionner tous nos Menus (Nos fichiers .graphql)
const typesPaths = path.join(__dirname, './graphql/schema');
const typesArray = loadFilesSync(typesPaths, { extensions: ['graphql'] });
const typeDefs = mergeTypeDefs(typesArray);

// 3. Fabriquer le Serveur Gateway
async function startGateway() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {
      // Récupérer le token Authorization (Bearer ...)
      const token = req.headers.authorization || '';
      return { token };
    },
  });

  console.log(`🚀 Gateway GraphQL prête et fonctionnelle sur : ${url}`);
}

startGateway();