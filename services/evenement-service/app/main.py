from fastapi import FastAPI
from app.controllers.routers import router
from app.database.database import engine, Base
from app.kafka.consumer import start_consumer
import asyncio
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Création des tables si elles n'existent pas
    Base.metadata.create_all(bind=engine)
    # Démarrage du consommateur Kafka en arrière-plan
    asyncio.create_task(start_consumer())
    yield

app = FastAPI(
    title="Service Événements",
    description="Service de gestion des alertes et incidents de la flotte",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Service Événements fonctionnel (Architecture Pro)"}
