# Vehicule Service

## Description
The `vehicule-service` is the core component for managing the fleet's vehicles. It stores vehicle details, statuses, and coordinates with other services when a vehicle's state changes. It is written in **Java using Spring Boot**.

## Technologies
- **Framework**: Spring Boot (Java 17+)
- **Database**: PostgreSQL (Spring Data JPA)
- **Message Broker**: Apache Kafka (Spring Kafka)
- **Security**: Keycloak (Spring Security OAuth2 Resource Server)
- **Tracing**: OpenTelemetry (Spring Boot Actuator for Observability)

## Features
- CRUD operations for vehicles in the fleet.
- Track vehicle statuses (e.g., active, maintenance, unavailable).
- Automatically updates vehicle mileage or status based on external triggers (via APIs).
- Publishes Kafka events for critical vehicle state changes.
- Endpoint protection enforced by Spring Security and `@PreAuthorize` based on Keycloak roles.

## Configuration
Requires the following environment variables (set in `application.yml` or externally via Docker):
- `SPRING_DATASOURCE_URL`: PostgreSQL connection string.
- `SPRING_KAFKA_BOOTSTRAP_SERVERS`: Address of the Kafka broker.
- `KEYCLOAK_ISSUER_URI`: Issuer URL for Keycloak token validation.
- `KEYCLOAK_JWK_URI`: JWKS URI to retrieve public keys.

## Run Locally
Use Maven to run the application:
```bash
mvn clean install
mvn spring-boot:run
```
