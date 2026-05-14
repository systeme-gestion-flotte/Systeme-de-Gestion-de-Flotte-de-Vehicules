from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import database, models
from app.services import crud
from app.schemas import schemas
from app.core.auth import require_role

router = APIRouter()

@router.get("/alerts", response_model=List[schemas.AlerteSchema])
def get_alerts(
    non_lues: bool = False,
    db: Session = Depends(database.get_db),
    user: dict = Depends(require_role("technicien", "manager", "admin", "conducteur", "utilisateur"))
):
    # 1. Identifier le rôle principal (insensible à la casse)
    user_roles = [r.lower() for r in user.get("realm_access", {}).get("roles", [])]
    possible_roles = ["admin", "manager", "conducteur", "technicien"]
    role_principal = next((r for r in possible_roles if r in user_roles), None)
    
    # 2. Extraire l'ID utilisateur (claim 'sub' dans Keycloak)
    user_id_from_token = user.get("sub")

    # 3. Retourner les alertes filtrées
    return crud.get_active_alerts(
        db, 
        role=role_principal, 
        user_id=user_id_from_token, 
        non_lues=non_lues
    )

@router.post("/alerts/{id}/marquer-lu")
def mark_alert_read(
    id: str,
    db: Session = Depends(database.get_db),
    user: dict = Depends(require_role("technicien", "manager", "admin", "conducteur", "utilisateur"))
):
    alert = db.query(models.Alerte).filter(models.Alerte.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    alert.is_read = True
    db.commit()
    return {"ok": True}

@router.delete("/alerts/{id}")
def dismiss_alert(
    id: str,
    db: Session = Depends(database.get_db),
    user: dict = Depends(require_role("technicien", "manager", "admin", "conducteur", "utilisateur"))
):
    success = crud.dismiss_alert(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    return {"status": "dismissed"}

@router.get("/health")
def health_check():
    return {"status": "UP"}
