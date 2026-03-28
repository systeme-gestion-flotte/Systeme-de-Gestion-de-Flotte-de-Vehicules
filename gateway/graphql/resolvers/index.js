const vehiculeResolver = require('./vehiculeResolver');
const conducteurResolver = require('./conducteurResolver');
const maintenanceResolver = require('./maintenanceResolver');
const evenementResolver = require('./evenementResolver');
const localisationResolver = require('./localisationResolver');

const resolvers = {
  Query: {
    ...vehiculeResolver.Query,
    ...conducteurResolver.Query,
    ...maintenanceResolver.Query,
    ...evenementResolver.Query,
    ...localisationResolver.Query,
  },
  Mutation: {
    ...vehiculeResolver.Mutation,
    ...conducteurResolver.Mutation,
    ...maintenanceResolver.Mutation,
    ...evenementResolver.Mutation,
    ...localisationResolver.Mutation,
  },
};

module.exports = resolvers;
