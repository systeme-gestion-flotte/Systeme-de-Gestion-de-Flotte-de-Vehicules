from sqlalchemy.orm import Session
from app.database import models
from app.schemas import schemas

def get_active_alerts(db: Session):
    return db.query(models.Alerte).filter(models.Alerte.status == "active").all()

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
