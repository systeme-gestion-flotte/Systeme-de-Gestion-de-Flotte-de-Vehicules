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
        
        if "eventType" in data and "vehicle" in data:
            event_type = data["eventType"]
            vehicle_data = data["vehicle"]
            vehicule_id = vehicle_data.get("id_vehicule") or vehicle_data.get("id")
            immat = vehicle_data.get("immatriculation")
            statut = vehicle_data.get("statut")
            
            if event_type == "VEHICULE_CREE" or topic == "fleet.vehicules.created":
                if vehicule_id and immat:
                    crud.setup_vehicule_local(db, id=vehicule_id, immatriculation=immat, statut=statut)
                    print(f"[Maintenance Consumer] Véhicule {immat} ({vehicule_id}) synchronisé (CREATION).")
            
            elif event_type == "VEHICULE_STATUT_CHANGE" or topic == "fleet.vehicules.statut":
                if vehicule_id and statut:
                    crud.update_vehicule_statut(db, id=vehicule_id, statut=statut)
                    print(f"[Maintenance Consumer] Statut du véhicule {vehicule_id} mis à jour : {statut}.")
                    if statut == "EN_PANNE":
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
        consumer.subscribe(["fleet.vehicules.events", "vehicle-events"])
        print("[Maintenance Consumer] Démarré et en écoute...")
        
        while True:
            await asyncio.sleep(0.1) 
            msg = consumer.poll(0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"Kafka erreur: {msg.error()}")
                    continue
            await asyncio.to_thread(process_message, msg)
            
    except Exception as e:
        print(f"[Maintenance Consumer] Exception fatale: {e}")
    finally:
        try:
            consumer.close()
        except:
            pass
