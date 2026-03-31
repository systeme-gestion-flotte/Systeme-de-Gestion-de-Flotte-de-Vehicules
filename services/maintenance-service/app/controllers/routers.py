from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.schemas import schemas
from app.services import crud
from app.database import models
from app.database.database import get_db
from app.core.auth import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["Interventions"])

@router.get("/interventions")
def list_interventions(
    statut: Optional[str] = None, 
    type: Optional[str] = None, 
    vehicule_id: Optional[str] = None, 
    technicien_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    skip = (page - 1) * limit
    data, total = crud.get_interventions(db, statut, type, vehicule_id, technicien_id, skip, limit)
    return {"data": data, "total": total}

@router.post("/interventions", response_model=schemas.InterventionSchema, status_code=201)
def create_intervention(
    dto: schemas.CreateInterventionDto,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin", "manager", "technicien"))
):
    return crud.create_intervention(db, dto)

@router.get("/interventions/{id}", response_model=schemas.InterventionSchema)
def get_intervention(id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    item = crud.get_intervention_by_id(db, id)
    if not item:
        raise HTTPException(status_code=404, detail="Not Found")
    return item

@router.put("/interventions/{id}", response_model=schemas.InterventionSchema)
def update_intervention(
    id: str, 
    dto: schemas.UpdateInterventionDto, 
    db: Session = Depends(get_db), 
    user: dict = Depends(require_role("admin", "manager", "technicien"))
):
    item = crud.update_intervention(db, id, dto)
    if not item:
        raise HTTPException(status_code=404, detail="Not Found")
    return item

@router.delete("/interventions/{id}", status_code=204)
def delete_intervention(
    id: str, 
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin"))
):
    try:
        success = crud.delete_intervention(db, id)
        if not success:
            raise HTTPException(status_code=404, detail="Not Found")
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return None

@router.patch("/interventions/{id}/demarrer", response_model=schemas.InterventionSchema)
def demarrer_intervention(
    id: str, 
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin", "manager", "technicien"))
):
    item = crud.start_intervention(db, id)
    if not item:
        raise HTTPException(status_code=404, detail="Not Found")
    return item

@router.patch("/interventions/{id}/terminer", response_model=schemas.InterventionSchema)
def terminer_intervention(
    id: str, 
    dto: schemas.TerminerInterventionDto,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin", "manager", "technicien"))
):
    item = crud.finish_intervention(db, id, dto)
    if not item:
        raise HTTPException(status_code=404, detail="Not Found")
    return item

@router.get("/interventions/vehicule/{vehicule_id}", response_model=List[schemas.InterventionSchema])
def get_interventions_vehicule(
    vehicule_id: str, 
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    return crud.get_interventions_by_vehicule(db, vehicule_id)

@router.get("/interventions/planifiees/prochaines", response_model=List[schemas.InterventionSchema])
def get_prochaines_interventions(
    jours: int = 7, 
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    return crud.get_prochaines_interventions(db, jours)
