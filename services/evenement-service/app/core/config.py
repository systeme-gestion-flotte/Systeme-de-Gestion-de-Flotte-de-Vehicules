import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_TITLE: str = "Service Événements"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://admin:adminpassword@postgres:5432/evenements")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379")
    KAFKA_BROKER: str = os.getenv("KAFKA_BROKER", "kafka:9092")
    
    # KEYCLOAK_ISSUER = URL publique pour valider le claim "iss" du token (localhost pour le navigateur)
    # JWKS_URL = URL interne Docker pour récupérer les clés de signature
    KEYCLOAK_ISSUER: str = os.getenv("KEYCLOAK_ISSUER", "http://localhost:9080/realms/fleet-management")
    JWKS_URL: str = os.getenv("JWKS_URL", "http://fleet-keycloak:8080/realms/fleet-management/protocol/openid-connect/certs")
    ISSUER: str = os.getenv("KEYCLOAK_ISSUER", "http://localhost:9080/realms/fleet-management")

settings = Settings()
