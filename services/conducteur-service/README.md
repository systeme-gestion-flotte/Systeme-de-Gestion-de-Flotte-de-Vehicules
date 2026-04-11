# Conducteur Service

## Description
This microservice manages drivers (conducteurs) and their assignments within the Fleet Management System. It is built using **NestJS** and provides a RESTful API. The service connects to a PostgreSQL database for data persistence and publishes events to Apache Kafka.

## Technologies
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **Message Broker**: Apache Kafka
- **Authentication**: Keycloak (JWT, Role-Based Access Control)
- **ORM**: TypeORM or Prisma (depending on current implementation)

## Features
- CRUD operations for drivers.
- Driver assignment to vehicles.
- "Permis de conduire" (Driver's license) validation.
- Emits domain events to Kafka topics when driver status or assignment changes.
- Secured using `@UseGuards(JwtAuthGuard, RolesGuard)` requiring specific Keycloak roles (e.g., `admin`, `manager`).

## Configuration
Requires the following environment variables (detailed in `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string.
- `KAFKA_BROKER`: Address of the Kafka broker.
- `KEYCLOAK_ISSUER`: Issuer URL for Keycloak token validation.
- `KEYCLOAK_JWKS_URI`: JWKS URI to retrieve public keys.

## Run Locally
```bash
npm install
npm run start:dev
```
