import os
import json
import asyncio
from confluent_kafka import Consumer, KafkaError
from app.database.database import SessionLocal
from app.services import crud
from app.schemas import schemas
from app.core.config import settings

def process_message(msg):
    topic = msg.topic()
    try:
        value = msg.value().decode('utf-8')
        data = json.loads(value)
        db = SessionLocal()
        
        if topic == "vehicle-events":
            event_type = data.get("eventType")
            vehicle = data.get("vehicle", {})
            immat = vehicle.get("immatriculation", "Inconnue")
            msg_text = f"Événement véhicule : {event_type} pour {immat}"
            
            alert = schemas.AlerteCreate(
                type="info" if event_type == "VEHICLE_CREATED" else "attention",
                source=immat,
                message=msg_text,
                time="À l'instant"
            )
            crud.create_alert(db, alert)
            print(f"[Evenement Consumer] Alerte créée : {msg_text}")

        elif topic.startswith("fleet.maintenance"):
            intervention_id = data.get("interventionId")
            v_id = data.get("vehiculeId")
            msg_text = f"Maintenance {topic.split('.')[-1]} : {intervention_id}"
            
            alert = schemas.AlerteCreate(
                type="attention",
                source=v_id or "Maintenance",
                message=msg_text,
                time="À l'instant"
            )
            crud.create_alert(db, alert)
            print(f"[Evenement Consumer] Alerte maintenance créée : {msg_text}")
            
        elif topic == "fleet.conducteurs.assignation":
            c_id = data.get("conducteurId")
            v_id = data.get("vehiculeId")
            msg_text = f"Assignation demandée : Conducteur {c_id} -> Véhicule {v_id}"
            
            alert = schemas.AlerteCreate(
                type="info",
                source="Personnel",
                message=msg_text,
                time="À l'instant"
            )
            crud.create_alert(db, alert)
            print(f"[Evenement Consumer] Alerte assignation créée : {msg_text}")
            
        db.close()
    except Exception as e:
        print(f"Erreur de processing Kafka message: {e}")

async def start_consumer():
    if os.getenv("TESTING") == "True":
        print("Mock Consumer: Skipping Kafka logic.")
        return
        
    config = {
        'bootstrap.servers': settings.KAFKA_BROKER,
        'group.id': 'evenement-service-group',
        'auto.offset.reset': 'earliest'
    }
    
    try:
        consumer = Consumer(config)
        consumer.subscribe([
            "vehicle-events", 
            "fleet.maintenance.planifiee", 
            "fleet.maintenance.terminee",
            "fleet.conducteurs.assignation"
        ])
        print("[Evenement Consumer] Démarré et en écoute sur 4 topics...")
        
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
        print(f"[Evenement Consumer] Exception fatale: {e}")
    finally:
        try:
            consumer.close()
        except:
            pass
