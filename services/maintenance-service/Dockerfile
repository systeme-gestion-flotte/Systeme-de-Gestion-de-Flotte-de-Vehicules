FROM python:3.11-slim AS builder

WORKDIR /app

# Copie le fichier des dépendances 
COPY requirements.txt .

# Installation des dépendances dans le répertoire utilisateur
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

RUN useradd -m appuser

# Copie des dépendances Python installées lors de l'étape de build
COPY --from=builder /root/.local /home/appuser/.local

COPY --chown=appuser:appuser . .

ENV PATH=/home/appuser/.local/bin:$PATH

ENV PYTHONUNBUFFERED=1

USER appuser

EXPOSE 8000

# Commande de démarrage avec instrumentation OpenTelemetry
CMD ["opentelemetry-instrument", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]