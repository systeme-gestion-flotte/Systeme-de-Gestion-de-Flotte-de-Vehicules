import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer()

def get_jwks():
    try:
        with httpx.Client(verify=False) as client:
            response = client.get(settings.JWKS_URL)
            response.raise_for_status()
            return response.json()
    except Exception:
        return None

def decode_token(token: str) -> dict:
    jwks = get_jwks()
    if not jwks:
        raise HTTPException(status_code=500, detail="JWKS inaccessible")
    try:
        payload = jwt.decode(
            token, 
            jwks, 
            algorithms=["RS256"], 
            issuer=settings.ISSUER, 
            options={"verify_aud": False}
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    return decode_token(credentials.credentials)

def require_role(*roles):
    def dependency(user: dict = Security(get_current_user)):
        user_roles = user.get("realm_access", {}).get("roles", [])
        if not any(r in user_roles for r in roles):
            raise HTTPException(status_code=403, detail="Accès refusé")
        return user
    return dependency
