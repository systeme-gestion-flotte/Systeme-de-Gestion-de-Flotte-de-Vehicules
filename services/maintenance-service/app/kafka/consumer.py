import os
import json
import asyncio
from confluent_kafka import Consumer, KafkaError
from app.database.database import SessionLocal
from app.services import crud
from app.database import models

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")

def process_message(msg):
    topic = msg.topic()
    try:
        data = json.loads(msg.value().decode('utf-8'))
        db = SessionLocal()
        
        if topic == "fleet.vehicules.created":
            vehicule_id = data.get("id") or data.get("vehiculeId")
            immat = data.get("immatriculation")
            statut = data.get("statut")
            
            if vehicule_id and immat:
                crud.setup_vehicule_local(db, id=vehicule_id, immatriculation=immat, statut=statut)
                print(f"[Maintenance Consumer] Véhicule {immat} ({vehicule_id}) synchronisé (CREATION).")
                
        elif topic == "fleet.vehicules.statut":
            vehicule_id = data.get("vehiculeId") or data.get("id")
            nouveau_statut = data.get("statut")
            
            if vehicule_id and nouveau_statut:
                crud.update_vehicule_statut(db, id=vehicule_id, statut=nouveau_statut)
                print(f"[Maintenance Consumer] Statut du véhicule {vehicule_id} mis à jour : {nouveau_statut}.")
                if nouveau_statut == "EN_PANNE":
                    print(f"ALERTE: Véhicule {vehicule_id} est EN_PANNE. Une maintenance est potentiellement requise.")
                    
        db.close()
    except Exception as e:
        print(f"Erreur de processing Kafka message: {e}")

async def start_consumer():
    if os.getenv("TESTING") == "True":
        print("Mock Consumer: Skipping Kafka logic in testing mode.")
        return
        
    config = {
        'bootstrap.servers': KAFKA_BROKER,
        'group.id': 'maintenance-service-group',
        'auto.offset.reset': 'earliest'
    }
    
    try:
        consumer = Consumer(config)
        consumer.subscribe(["fleet.vehicules.created", "fleet.vehicules.statut"])
        print("[Maintenance Consumer] Démarré et en écoute...")
        
        while True:
            await asyncio.sleep(0.1) # Rendre la boucle asynchrone non-blocante
            msg = consumer.poll(0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"Kafka erreur: {msg.error()}")
                    continue
            
            # Traiter le message dans un thread pour ne pas bloquer l'Event Loop FastAPI FastAPI
            await asyncio.to_thread(process_message, msg)
            
    except Exception as e:
        print(f"[Maintenance Consumer] Exception fatale: {e}")
    finally:
        try:
            consumer.close()
        except:
            pass
