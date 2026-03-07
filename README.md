# Systeme-de-Gestion-de-Flotte-de-Vehicules
Systeme-de-Gestion-de-Flotte-de-Vehicules/
│
├── 📁 Vehicule/                          ← Java / Spring Boot (ADR-002)
│   ├── src/
│   │   └── main/
│   │       ├── java/com/fleet/vehicule/
│   │       │   ├── controller/
│   │       │   │   └── VehicleController.java
│   │       │   ├── service/
│   │       │   │   └── VehicleService.java
│   │       │   ├── repository/
│   │       │   │   └── VehicleRepository.java
│   │       │   ├── model/
│   │       │   │   ├── Vehicle.java
│   │       │   │   └── VehicleStatus.java    ← Enum (ADR C4 niveau 4)
│   │       │   ├── messaging/
│   │       │   │   └── VehicleEventPublisher.java  ← Kafka (ADR-004)
│   │       │   ├── graphql/
│   │       │   │   └── VehicleResolver.java  ← Sous-graphe (ADR-003)
│   │       │   └── VehiculeApplication.java
│   │       └── resources/
│   │           ├── application.yml
│   │           └── db/migration/
│   │               └── V1__create_vehicles.sql
│   ├── src/test/java/com/fleet/vehicule/
│   │   ├── unit/
│   │   └── integration/
│   ├── Dockerfile
│   ├── pom.xml
│   └── README.md
│
├── 📁 Conducteur/                        ← Node.js / NestJS (ADR-002)
│   ├── src/
│   │   ├── controller/
│   │   │   └── driver.controller.ts
│   │   ├── service/
│   │   │   └── driver.service.ts
│   │   ├── repository/
│   │   │   └── driver.repository.ts
│   │   ├── model/
│   │   │   └── driver.model.ts
│   │   ├── kafka/
│   │   │   ├── producer.ts               ← Saga pattern (ADR-010)
│   │   │   └── consumer.ts
│   │   ├── graphql/
│   │   │   └── driver.resolver.ts        ← Sous-graphe (ADR-003)
│   │   └── main.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── migrations/
│   │   └── V1__create_drivers.sql
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
├── 📁 maintenance/                       ← Python / FastAPI (ADR-002)
│   ├── src/
│   │   ├── routers/
│   │   │   └── maintenance_router.py
│   │   ├── services/
│   │   │   └── maintenance_service.py
│   │   ├── repositories/
│   │   │   └── maintenance_repository.py
│   │   ├── models/
│   │   │   └── maintenance_model.py
│   │   ├── kafka/
│   │   │   ├── producer.py               ← Saga pattern (ADR-010)
│   │   │   └── consumer.py
│   │   └── main.py
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── migrations/
│   │   └── V1__create_maintenance.sql
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── 📁 Localisation/                      ← Node.js / NestJS + gRPC (ADR-007)
│   ├── src/
│   │   ├── grpc/
│   │   │   ├── location.proto            ← Définition gRPC streaming (ADR-007)
│   │   │   └── location.server.ts
│   │   ├── service/
│   │   │   └── location.service.ts
│   │   ├── repository/
│   │   │   └── location.repository.ts    ← TimescaleDB (ADR-006)
│   │   ├── kafka/
│   │   │   └── geofencing.producer.ts    ← Alertes géofencing (ADR-004)
│   │   ├── graphql/
│   │   │   └── location.resolver.ts      ← Subscriptions (ADR-003)
│   │   └── main.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── migrations/
│   │   └── V1__create_hypertable.sql     ← TimescaleDB hypertable
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
├── 📁 Evenement/                         ← Python / FastAPI (ADR-002)
│   ├── src/
│   │   ├── routers/
│   │   │   └── event_router.py
│   │   ├── services/
│   │   │   └── event_service.py
│   │   ├── repositories/
│   │   │   └── event_repository.py
│   │   ├── models/
│   │   │   └── event_model.py
│   │   ├── kafka/
│   │   │   └── consumer.py               ← Consomme tous les topics (ADR-004)
│   │   └── main.py
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── migrations/
│   │   └── V1__create_events.sql
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── docker-compose.yml
├── .env.example
└── README.md




