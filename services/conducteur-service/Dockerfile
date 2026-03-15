FROM node:18-alpine AS builder

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de configuration des dépendances pour utiliser le cache Docker
COPY package*.json ./

# Installation de TOUTES les dépendances (y compris celles de développement nécessaires pour la compilation)
RUN npm install

# Copie de tout le code source
COPY . .

# Compilation du code TypeScript (NestJS génère par défaut un dossier 'dist')
RUN npm run build

# ==========================================
# Étape 2 : Production (Image finale allégée et sécurisée)
# ==========================================
FROM node:18-alpine

WORKDIR /app

# Création d'un utilisateur non-root pour des raisons de sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copie des fichiers package.json depuis l'étape de build
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Installation UNIQUEMENT des dépendances de production (image plus légère)
RUN npm ci --only=production

# Copie du code compilé (le dossier 'dist') depuis l'étape de build
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Bascule sur l'utilisateur sécurisé non-root
USER nodejs

# Exposition du port utilisé par ton service (par défaut 3000 dans NestJS, à adapter si besoin)
EXPOSE 3000

# Commande de démarrage ciblant le fichier compilé
CMD ["node", "dist/main.js"]