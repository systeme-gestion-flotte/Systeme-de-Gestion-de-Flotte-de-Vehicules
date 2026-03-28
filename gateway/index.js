const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const resolvers = require('./graphql/resolvers');

// Load all .graphql files from gateway/openapi
const openapiDir = join(__dirname, 'openapi');
const typeDefs = readdirSync(openapiDir)
  .filter(file => file.endsWith('.graphql'))
  .map(file => readFileSync(join(openapiDir, file), 'utf8'))
  .join('\n');

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  console.log(`🚀 Gateway ready at ${url}`);
}

startServer();
