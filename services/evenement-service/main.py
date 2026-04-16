from fastapi import FastAPI, Depends, Security
from auth import require_role
from typing import List

app = FastAPI(title="Service Événements & Missions")

# Données simulées pour la démo
MOCK_MISSIONS = [
    {"id": "M-1234", "title": "Collecte Paris", "destination": "Paris 15", "status": "en_cours", "time": "14:30"},
    {"id": "M-1235", "title": "Livraison Lyon", "destination": "Lyon Est", "status": "en_attente", "time": "09:00"},
    {"id": "M-1233", "title": "Vidange V-001", "destination": "Garage Central", "status": "terminee", "time": "11:00"}
]

MOCK_ALERTS = [
    {"id": "A-001", "type": "critique", "source": "V-102", "message": "Surchauffe moteur", "time": "2 min"},
    {"id": "A-002", "type": "attention", "source": "GPS", "message": "Signal faible", "time": "15 min"},
    {"id": "A-003", "type": "info", "source": "Maintenance", "message": "Révision proche", "time": "1h"}
]

@app.get("/", dependencies=[Depends(require_role("utilisateur", "admin"))])
def read_root():
    return {"status": "ok", "message": "Service Événements fonctionnel"}

@app.get("/alerts", dependencies=[Depends(require_role("technicien", "manager", "admin"))])
def get_alerts():
    return MOCK_ALERTS

@app.get("/health")
def health_check():
    return {"status": "UP"}