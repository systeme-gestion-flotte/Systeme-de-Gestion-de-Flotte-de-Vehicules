from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import database
from app.services import crud
from app.schemas import schemas
from app.core.auth import require_role

router = APIRouter()

@router.get("/alerts", response_model=List[schemas.AlerteSchema])
def get_alerts(
    db: Session = Depends(database.get_db),
    user: dict = Depends(require_role("technicien", "manager", "admin"))
):
    return crud.get_active_alerts(db)

@router.delete("/alerts/{id}")
def dismiss_alert(
    id: str,
    db: Session = Depends(database.get_db),
    user: dict = Depends(require_role("technicien", "manager", "admin"))
):
    success = crud.dismiss_alert(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    return {"status": "dismissed"}

@router.get("/health")
def health_check():
    return {"status": "UP"}
