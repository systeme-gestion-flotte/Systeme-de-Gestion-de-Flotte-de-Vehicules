from sqlalchemy.orm import Session
from app.database import models
from app.schemas import schemas

from typing import Optional

from sqlalchemy import or_

def get_active_alerts(db: Session, role: Optional[str] = None, user_id: Optional[str] = None, non_lues: bool = False):
    query = db.query(models.Alerte).filter(models.Alerte.status == "active")
    
    if role:
        query = query.filter(models.Alerte.role_cible == role)
        
    if user_id:
        if role == "conducteur":
            # Le conducteur ne voit QUE ses alertes personnelles (véhicule assigné)
            query = query.filter(models.Alerte.user_id_cible == user_id)
        else:
            # Admin, Manager, Technicien voient le broadcast (NULL) + leurs alertes perso
            query = query.filter(
                or_(
                    models.Alerte.user_id_cible == None,
                    models.Alerte.user_id_cible == user_id
                )
            )
        
    if non_lues:
        query = query.filter(models.Alerte.is_read == False)
        
    return query.order_by(models.Alerte.created_at.desc()).all()

def create_alert(db: Session, alert: schemas.AlerteCreate):
    db_alert = models.Alerte(**alert.dict())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def dismiss_alert(db: Session, alert_id: str):
    db_alert = db.query(models.Alerte).filter(models.Alerte.id == alert_id).first()
    if db_alert:
        db_alert.status = "dismissed"
        db.commit()
        db.refresh(db_alert)
    return db_alert

def get_missions(db: Session):
    return db.query(models.MissionLocal).all()
