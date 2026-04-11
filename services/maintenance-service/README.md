# Maintenance Service

## Description
The `maintenance-service` manages the maintenance lifecycle of the fleet's vehicles. It tracks repair requests, scheduled maintenance, and parts inventory. Built using **Python and FastAPI**.

## Technologies
- **Framework**: FastAPI (Python 3)
- **Database**: PostgreSQL (via SQLAlchemy)
- **Message Broker**: Confluent Kafka Python
- **Security**: Keycloak Integration (JWT decoding)
- **Testing**: Pytest

## Features
- CRUD operations for maintenance tasks and work orders.
- Emits events to Kafka when maintenance statuses change (e.g., Vehicle fixed, Maintenance required).
- API secured with Keycloak role-based access control.

## Configuration
Requires the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string.
- `KAFKA_BROKER`: Address of the Kafka broker.
- `KEYCLOAK_URL` / `KEYCLOAK_ISSUER`: For JWT validation.

## Run Locally
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
