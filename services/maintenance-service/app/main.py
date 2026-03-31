import asyncio
from fastapi import FastAPI
from app.database.database import engine, Base
from app.controllers import routers
from app.kafka.consumer import start_consumer

app = FastAPI(title="Maintenance Service API", version="1.0.0")

app.include_router(routers.router)

consumer_task = None

@app.on_event("startup")
async def startup_event():
    global consumer_task
    # Créer les tables postgres ou sqlite
    Base.metadata.create_all(bind=engine)
    consumer_task = asyncio.create_task(start_consumer())

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Service Maintenance Kubernetes-ready avec Kafka Consumer"}

@app.get("/health")
def health_check():
    return {"status": "UP"}
