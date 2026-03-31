from sqlalchemy import Column, String, DateTime, Float, Enum
import uuid
from datetime import datetime
from app.database.database import Base

class VehiculeLocal(Base):
    __tablename__ = "vehicules_local"
    
    id = Column(String, primary_key=True, index=True)
    immatriculation = Column(String, nullable=False)
    statut = Column(String, nullable=True) # DISPONIBLE, EN_PANNE, EN_COURSE.
    created_at = Column(DateTime, default=datetime.utcnow)

class Intervention(Base):
    __tablename__ = "interventions"
    
    id_intervention = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    vehicule_id = Column(String, index=True, nullable=False)
    vehicule_immat = Column(String, nullable=False)
    technicien_id = Column(String, nullable=False)
    type = Column(String, nullable=False) # revision, reparation, controle_technique
    date_planifiee = Column(DateTime, nullable=False)
    date_realisation = Column(DateTime, nullable=True)
    statut = Column(String, nullable=False, default="planifiee") # planifiee, en_cours, terminee
    cout = Column(Float, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
