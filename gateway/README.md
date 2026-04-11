# Fleet Management - API Gateway

## Description
The API Gateway acts as the single entry point for the Fleet Management System. It federates communication to the various underlying microservices using both GraphQL (Apollo Server) and traditional RESTful endpoints.

## Technologies
- **Runtime**: Node.js
- **API Framework**: Express.js
- **GraphQL**: Apollo Server Express
- **Documentation**: Swagger UI Express (`yamljs` for OpenAPI definitions)

## Capabilities
- **GraphQL Federation**: Resolvers are mapped directly to downstream REST/gRPC services (Vehicles, Drivers, Events, Maintenance, Localisation).
- **OpenAPI / Swagger**: Centralized API documentation for all REST endpoints from the microservices.
- **Routing**: Acts as a reverse proxy for certain HTTP flows if needed.

## Setup & Execution
```bash
# Install dependencies
npm install

# Start the gateway
npm start
```

## Microservices Endpoints
The gateway expects the following services to be available (configurable via environment variables):
- `VEHICULE_SERVICE_URL` (default: `http://localhost:4000` / `http://vehicule-service:4000`)
- `CONDUCTEUR_SERVICE_URL` (default: `http://localhost:3000` / `http://conducteur-service:3000`)
- `MAINTENANCE_SERVICE_URL` (default: `http://localhost:8000` / `http://maintenance-service:8000`)
- `EVENEMENT_SERVICE_URL` (default: `http://localhost:8000` / `http://evenement-service:8000`)
- `LOCALISATION_SERVICE_URL` (default: `http://localhost:3002` / `http://localisation-service:3002`)

## Accessing Documentation & Sandbox
- **GraphQL Apollo Sandbox**: `http://localhost:4000/graphql`
- **Swagger Documentation**: `/api-docs` (Requires aggregating the individual `.yaml` files placed in the `openapi` folder).
