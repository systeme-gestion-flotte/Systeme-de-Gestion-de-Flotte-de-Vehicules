import os
os.environ["TESTING"] = "True"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"

def test_create_intervention():
    response = client.post(
        "/api/interventions",
        json={
            "vehicule_id": "123e4567-e89b-12d3-a456-426614174000",
            "vehicule_immat": "AA-123-BB",
            "technicien_id": "tech1",
            "type": "revision",
            "date_planifiee": "2026-05-01T10:00:00Z",
            "description": "Revision annuelle"
        },
        headers={"Authorization": "Bearer TEST_TOKEN"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["vehicule_immat"] == "AA-123-BB"
    assert "id_intervention" in data
    assert data["statut"] == "planifiee"
    
def test_get_interventions():
    client.post(
        "/api/interventions",
        json={
            "vehicule_id": "111", "vehicule_immat": "XX", "technicien_id": "tech1",
            "type": "revision", "date_planifiee": "2026-05-01T10:00:00Z", "description": "Test"
        },
        headers={"Authorization": "Bearer TEST_TOKEN"}
    )
    response = client.get("/api/interventions", headers={"Authorization": "Bearer TEST_TOKEN"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["data"]) == 1

def test_update_intervention():
    res = client.post(
        "/api/interventions",
        json={
            "vehicule_id": "111", "vehicule_immat": "XX", "technicien_id": "tech1",
            "type": "revision", "date_planifiee": "2026-05-01T10:00:00Z", "description": "Test"
        },
        headers={"Authorization": "Bearer TEST_TOKEN"}
    )
    inter_id = res.json()["id_intervention"]

    res_update = client.put(
        f"/api/interventions/{inter_id}",
        json={
            "description": "Updated Test"
        },
        headers={"Authorization": "Bearer TEST_TOKEN"}
    )
    assert res_update.status_code == 200
    assert res_update.json()["description"] == "Updated Test"

def test_demarrer_et_terminer():
    res = client.post(
        "/api/interventions",
        json={
            "vehicule_id": "111", "vehicule_immat": "XX", "technicien_id": "tech1",
            "type": "revision", "date_planifiee": "2026-05-01T10:00:00Z", "description": "Test"
        },
        headers={"Authorization": "Bearer TEST_TOKEN"}
    )
    inter_id = res.json()["id_intervention"]

    res_demarrer = client.patch(
        f"/api/interventions/{inter_id}/demarrer",
        headers={"Authorization": "Bearer TEST_TOKEN"}
    )
    assert res_demarrer.status_code == 200
    assert res_demarrer.json()["statut"] == "en_cours"

    res_term = client.patch(
        f"/api/interventions/{inter_id}/terminer",
        json={
            "date_realisation": "2026-05-01T12:00:00Z",
            "cout": 150.5,
            "description": "Fini"
        },
        headers={"Authorization": "Bearer TEST_TOKEN"}
    )
    assert res_term.status_code == 200
    assert res_term.json()["statut"] == "terminee"
    assert res_term.json()["cout"] == 150.5
