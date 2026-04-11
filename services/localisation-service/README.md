# Localisation Service

## Description
The `localisation-service` handles high-throughput GPS telemetry data for vehicles. It receives real-time positions via **gRPC**, performs geofencing calculations, broadcasts data via **WebSockets (Socket.io)** for real-time dashboards, and stores historical data in **TimescaleDB**.

## Technologies
- **Framework**: Node.js, Express (for REST & WebSocket), gRPC
- **Database**: TimescaleDB (PostgreSQL extension for time-series data)
- **Message Broker**: Kafka (KafkaJS)
- **Real-time**: Socket.io
- **Security**: Keycloak (JWT Role verification mapped manually)
- **Observability**: OpenTelemetry (integrated with Jaeger/Prometheus in Kubernetes)

## Features
- **gRPC Server**: Continuous bi-directional streaming of GPS coordinates.
- **Geofencing**: In-memory calculation to check if a vehicle enters/exits restricted zones. Publishes alerts to Kafka.
- **WebSockets**: Broadcasts `position_update` events to connected frontend clients (e.g., the React Microfrontend).
- **REST API**: HTTP endpoints to query historical positions and manage Geofencing zones.

## Configuration
Requires the following environment variables:
- `DATABASE_URL`: TimescaleDB connection string.
- `KAFKA_BROKER`: Address of the Kafka broker.
- `KEYCLOAK_ISSUER`: Issuer URL for Keycloak token validation.
- `GRPC_PORT`: Port for gRPC server (default: 50051).
- `HTTP_PORT`: Port for REST & Socket.io server (default: 3002).
- `ENABLE_SIMULATOR`: If `true`, runs the internal GPS simulator.

## Run Locally
```bash
npm install
npm run start:dev
```
