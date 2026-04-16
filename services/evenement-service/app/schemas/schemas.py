from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AlerteBase(BaseModel):
    type: str
    source: str
    message: str
    time: str

class AlerteCreate(AlerteBase):
    pass

class AlerteSchema(AlerteBase):
    id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class MissionBase(BaseModel):
    title: str
    destination: str
    status: str
    time: Optional[str] = None

class MissionSchema(MissionBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
