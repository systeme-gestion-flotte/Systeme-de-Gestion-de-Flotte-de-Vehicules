from fastapi import FastAPI, Depends, Security
from auth import require_role

app = FastAPI()

@app.get("/", dependencies=[Depends(require_role("utilisateur", "admin"))])
def read_root():
    return {"status": "ok", "message": "Service Evenement sécurisé"}

@app.get("/health")
def health_check():
    return {"status": "UP"}