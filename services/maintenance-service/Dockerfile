FROM python:3.11-slim AS builder

WORKDIR /app

# Copie uniquement le fichier des dépendances pour optimiser le cache Docker
COPY requirements.txt .

# Installation des dépendances dans le répertoire utilisateur cible pour faciliter la copie
RUN pip install --user --no-cache-dir -r requirements.txt

# ==========================================
# Étape 2 : Production (Image finale allégée et sécurisée)
# ==========================================
FROM python:3.11-slim

WORKDIR /app

# Création d'un utilisateur non-root par mesure de sécurité
RUN useradd -m appuser

# Copie des dépendances Python installées lors de l'étape de build
COPY --from=builder /root/.local /home/appuser/.local

# Copie du code source de l'application avec les bons droits
COPY --chown=appuser:appuser . .

# Définition des variables d'environnement (ajout du chemin des exécutables comme uvicorn)
ENV PATH=/home/appuser/.local/bin:$PATH
# Désactive la mise en buffer de Python pour voir les logs immédiatement dans Docker
ENV PYTHONUNBUFFERED=1

# Bascule sur l'utilisateur sécurisé non-root
USER appuser

# Exposition du port (FastAPI utilise généralement 8000 par défaut)
EXPOSE 8000

# Commande de démarrage (à adapter si ton fichier principal ne s'appelle pas main.py)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]