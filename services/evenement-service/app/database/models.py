from sqlalchemy import Column, String, DateTime, Boolean
import uuid
from datetime import datetime
from app.database.database import Base

class Alerte(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    type = Column(String, nullable=False) # critique, attention, info
    source = Column(String, nullable=False) # V-102, GPS, etc.
    message = Column(String, nullable=False)
    time = Column(String, nullable=False) # For display purposes like "2 min"
    status = Column(String, default="active") # active, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

class MissionLocal(Base):
    __tablename__ = "missions_local"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    status = Column(String, default="en_attente")
    time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
