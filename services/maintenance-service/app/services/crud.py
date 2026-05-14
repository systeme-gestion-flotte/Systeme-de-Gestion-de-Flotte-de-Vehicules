from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from app.database import models
from app.schemas import schemas
from app.kafka import producer as kafka_producer

def setup_vehicule_local(db: Session, id: str, immatriculation: str, statut: str = None):
    v = db.query(models.VehiculeLocal).filter(models.VehiculeLocal.id == id).first()
    if not v:
        v = models.VehiculeLocal(id=id, immatriculation=immatriculation, statut=statut)
        db.add(v)
    else:
        v.immatriculation = immatriculation
        if statut:
            v.statut = statut
    db.commit()

def update_vehicule_statut(db: Session, id: str, statut: str):
    v = db.query(models.VehiculeLocal).filter(models.VehiculeLocal.id == id).first()
    if v:
        v.statut = statut
        db.commit()

def get_interventions(db: Session, statut: Optional[str] = None, type_intervention: Optional[str] = None,
                      vehicule_id: Optional[str] = None, technicien_id: Optional[str] = None,
                      skip: int = 0, limit: int = 20):
    query = db.query(models.Intervention)
    if statut:
        query = query.filter(models.Intervention.statut == statut)
    if type_intervention:
        query = query.filter(models.Intervention.type == type_intervention)
    if vehicule_id:
        query = query.filter(models.Intervention.vehicule_id == vehicule_id)
    if technicien_id:
        query = query.filter(models.Intervention.technicien_id == technicien_id)
    
    query = query.order_by(models.Intervention.date_planifiee.desc())
    total = query.count()
    data = query.offset(skip).limit(limit).all()
    return data, total

def get_intervention_by_id(db: Session, id: str):
    return db.query(models.Intervention).filter(models.Intervention.id_intervention == id).first()

def create_intervention(db: Session, dto: schemas.CreateInterventionDto):
    db_item = models.Intervention(
        vehicule_id=dto.vehicule_id,
        vehicule_immat=dto.vehicule_immat,
        technicien_id=dto.technicien_id,
        type=dto.type,
        date_planifiee=dto.date_planifiee,
        statut="planifiee",
        description=dto.description,
        cout=dto.cout
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Kafka event
    event = {
        "interventionId": str(db_item.id_intervention),
        "vehiculeId": db_item.vehicule_id,
        "technicienId": db_item.technicien_id,
        "type": db_item.type,
        "datePlanifiee": db_item.date_planifiee.isoformat(),
        "description": db_item.description
    }
    kafka_producer.send_event("fleet.maintenance.planifiee", str(db_item.id_intervention), event)
    return db_item

def update_intervention(db: Session, id: str, dto: schemas.UpdateInterventionDto):
    db_item = get_intervention_by_id(db, id)
    if not db_item:
        return None
    
    if dto.date_planifiee is not None:
        db_item.date_planifiee = dto.date_planifiee
    if dto.technicien_id is not None:
        db_item.technicien_id = dto.technicien_id
    if dto.description is not None:
        db_item.description = dto.description
    if dto.cout is not None:
        db_item.cout = dto.cout
        
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_intervention(db: Session, id: str):
    db_item = get_intervention_by_id(db, id)
    if not db_item:
        return False
    if db_item.statut != "planifiee":
        raise ValueError("Impossible d'annuler une intervention déjà en cours ou terminée")
    db.delete(db_item)
    db.commit()
    return True

def start_intervention(db: Session, id: str):
    db_item = get_intervention_by_id(db, id)
    if not db_item:
        return None
    db_item.statut = "en_cours"
    db.commit()
    db.refresh(db_item)
    return db_item

def finish_intervention(db: Session, id: str, dto: schemas.TerminerInterventionDto):
    db_item = get_intervention_by_id(db, id)
    if not db_item:
        return None
    db_item.statut = "terminee"
    db_item.date_realisation = dto.date_realisation
    db_item.cout = dto.cout
    db_item.description = dto.description
    db.commit()
    db.refresh(db_item)
    
    # Kafka event
    event = {
        "interventionId": str(db_item.id_intervention),
        "vehiculeId": db_item.vehicule_id,
        "dateRealisation": db_item.date_realisation.isoformat(),
        "cout": db_item.cout,
        "description": db_item.description
    }
    kafka_producer.send_event("fleet.maintenance.terminee", str(db_item.id_intervention), event)
    return db_item

def get_interventions_by_vehicule(db: Session, vehicule_id: str):
    return db.query(models.Intervention).filter(models.Intervention.vehicule_id == vehicule_id).all()

def get_prochaines_interventions(db: Session, days: int = 7):
    limit_date = datetime.utcnow() + timedelta(days=days)
    return db.query(models.Intervention).filter(
        models.Intervention.statut == "planifiee",
        models.Intervention.date_planifiee <= limit_date,
        models.Intervention.date_planifiee >= datetime.utcnow()
    ).order_by(models.Intervention.date_planifiee.asc()).all()
