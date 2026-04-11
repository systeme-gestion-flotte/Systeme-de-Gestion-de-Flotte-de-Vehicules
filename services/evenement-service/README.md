# Evenement Service

## Description
The `evenement-service` is responsible for processing and storing system events, alerts, and telemetry data from various sources (like Kafka topics). It is built using **Python and FastAPI**.

## Technologies
- **Framework**: FastAPI (Python 3)
- **Database**: PostgreSQL (via SQLAlchemy)
- **Cache / Fast Storage**: Redis
- **Message Broker**: Confluent Kafka Python
- **Security**: Keycloak Integration (JWT decoding via `python-jose`)

## Features
- Consumes events from Kafka.
- Stores historical events in PostgreSQL.
- Fast access to recent events via Redis.
- Secured API endpoints using FastAPI dependencies and Keycloak's `realm_access` roles.

## Configuration
Requires the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string.
- `KAFKA_BROKER`: Address of the Kafka broker.
- `KEYCLOAK_URL` / `KEYCLOAK_ISSUER`: For JWT validation.

## Run Locally
Recommend using a virtual environment (`.venv`):
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8003
```
