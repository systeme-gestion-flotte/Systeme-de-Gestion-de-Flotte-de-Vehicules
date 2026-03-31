from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class CreateInterventionDto(BaseModel):
    vehicule_id: str
    vehicule_immat: str
    technicien_id: str
    type: str # revision, reparation, controle_technique
    date_planifiee: datetime
    description: Optional[str] = None

class UpdateInterventionDto(BaseModel):
    date_planifiee: Optional[datetime] = None
    technicien_id: Optional[str] = None
    description: Optional[str] = None

class TerminerInterventionDto(BaseModel):
    date_realisation: datetime
    cout: float
    description: str

class InterventionSchema(BaseModel):
    id_intervention: str
    vehicule_id: str
    vehicule_immat: str
    technicien_id: str
    type: str
    date_planifiee: datetime
    date_realisation: Optional[datetime] = None
    statut: str
    cout: Optional[float] = None
    description: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
