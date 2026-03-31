import os
import json
from confluent_kafka import Producer

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")

try:
    if os.getenv("TESTING") == "True":
        producer = None
    else:
        producer = Producer({'bootstrap.servers': KAFKA_BROKER})
except Exception as e:
    print(f"Error connecting to Kafka: {e}")
    producer = None

def send_event(topic: str, key: str, value: dict):
    if not producer:
        print(f"Mock Kafka send to {topic}: {value}")
        return
    try:
        producer.produce(topic, key=key.encode('utf-8'), value=json.dumps(value, default=str).encode('utf-8'))
        producer.flush()
        print(f"Kafka event sent to {topic}")
    except Exception as e:
        print(f"Failed to send Kafka event to {topic}: {e}")
