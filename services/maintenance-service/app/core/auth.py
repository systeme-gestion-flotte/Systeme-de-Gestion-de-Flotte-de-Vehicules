import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:9080")
JWKS_URL_FETCH = os.getenv("JWKS_URL", f"{KEYCLOAK_URL}/realms/fleet-management/protocol/openid-connect/certs")
REALM = "fleet-management"
ISSUER = os.getenv("KEYCLOAK_ISSUER", f"{KEYCLOAK_URL}/realms/{REALM}")

security = HTTPBearer()

def get_jwks():
    try:
        with httpx.Client(verify=False) as client:
            response = client.get(JWKS_URL_FETCH)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"Error fetching JWKS: {e}")
        return None

def decode_token(token: str) -> dict:
    if os.getenv("TESTING") == "True":
        return {"preferred_username": "testuser", "realm_access": {"roles": ["admin", "manager", "technicien", "utilisateur"]}}
        
    jwks = get_jwks()
    if not jwks:
         raise HTTPException(status_code=500, detail="Could not fetch JWKS keys")
    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=ISSUER,
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token invalide: {e}")

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    if os.getenv("TESTING") == "True":
        return {"preferred_username": "testuser", "realm_access": {"roles": ["admin", "manager", "technicien", "utilisateur"]}}
    return decode_token(credentials.credentials)

def require_role(*roles):
    def dependency(user: dict = Security(get_current_user)):
        user_roles = user.get("realm_access", {}).get("roles", [])
        if not any(r in user_roles for r in roles):
            raise HTTPException(status_code=403, detail="Accès refusé")
        return user
    return dependency
