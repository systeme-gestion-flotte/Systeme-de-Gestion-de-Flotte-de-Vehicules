FROM node:18-alpine AS builder

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances pour utiliser le cache Docker
COPY package*.json ./

# Installation de toutes les dépendances
RUN npm install

# Copie de tout le code source (y compris les dossiers contenant tes fichiers .proto)
COPY . .

# Compilation du code TypeScript vers le dossier 'dist'
RUN npm run build

# ==========================================
# Étape 2 : Production (Image finale allégée et sécurisée)
# ==========================================
FROM node:18-alpine

WORKDIR /app

# Création d'un utilisateur non-root pour des raisons de sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copie des fichiers package.json
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Installation UNIQUEMENT des dépendances de production
RUN npm ci --omit=dev

# Copie du code compilé (TypeScript -> JavaScript)
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# ⚠️ ÉTAPE CRUCIALE POUR gRPC : 
# Les fichiers .proto ne sont pas compilés par TypeScript. Il faut donc 
# les copier manuellement dans l'image finale pour que gRPC puisse les lire.
# (Adapte le chemin 'src/proto' selon la structure de ton projet)
COPY --from=builder --chown=nodejs:nodejs /app/src/proto ./dist/proto

# Bascule sur l'utilisateur sécurisé non-root
USER nodejs

# Exposition du port gRPC (50051 est le port standard pour gRPC, au lieu du 3000)
EXPOSE 50051

# Commande de démarrage
CMD ["node", "dist/main.js"]