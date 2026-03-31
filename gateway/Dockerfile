# Etape de build & run pour Node.js
FROM node:18-alpine

# Dossier d'application dans le container
WORKDIR /app

# Copie uniquement des fichiers package pour utiliser le cache Docker
COPY package*.json ./

# Installer uniquement les dépendances de prod
RUN npm install

# Copier le reste du code source (resolvers, typeDefs)
COPY . .

# Exposer le port par défaut Apollo StandaloneServer
EXPOSE 4000

# Commande de démarrage définie dans package.json ("start": "node index.js")
CMD ["npm", "start"]
