#  Keycloak — Système de Gestion de Flotte

Guide d'intégration Keycloak pour tous les microservices du projet.

---

##  Sommaire

- [Configuration de base](#configuration-de-base)
- [Realm & Rôles](#realm--rôles)
- [Clients disponibles](#clients-disponibles)
- [Utilisateurs de test](#utilisateurs-de-test)
- [Intégration Spring Boot (Java)](#intégration-spring-boot-java)
- [Intégration Node.js](#intégration-nodejs)
- [Intégration Python (FastAPI)](#intégration-python-fastapi)
- [Tester l'authentification](#tester-lauthentification)
- [Commandes utiles](#commandes-utiles)
- [Dépannage](#dépannage)

---

## Configuration de base

| Paramètre | Valeur |
|---|---|
| URL locale (hôte) | `http://localhost:9080` |
| URL interne Docker | `http://keycloak:8080` |
| Realm | `fleet-management` |
| Admin console | `http://localhost:9080/admin` |
| Login admin | `admin` / `admin` |

>  **Règle importante** : toujours utiliser l'URL interne Docker (`http://keycloak:8080`) dans les variables d'environnement des services. L'URL `localhost:9080` est réservée au navigateur.

---

## Realm & Rôles

Le realm `fleet-management` contient 4 rôles métier :

| Rôle | Description | Droits typiques |
|---|---|---|
| `admin` | Administrateur plateforme | Tout — CRUD complet + gestion utilisateurs |
| `manager` | Manager flotte | Lecture + création + modification (pas suppression) |
| `technicien` | Technicien maintenance | Lecture + mise à jour statut/kilométrage |
| `utilisateur` | Conducteur | Lecture seule de ses assignations |

### Scopes OAuth2 disponibles

| Scope | Description |
|---|---|
| `fleet.read` | Accès lecture sur toutes les APIs |
| `fleet.write` | Accès écriture sur toutes les APIs |
| `fleet.admin` | Accès administration (optionnel) |

---

## Clients disponibles

| Client ID | Type | Usage |
|---|---|---|
| `fleet-frontend` | Public (PKCE) | Application React — flux navigateur |
| `fleet-api-gateway` | Confidentiel | API Gateway GraphQL — service account |
| `vehicle-service` | Confidentiel | Service véhicules — service account |
| `driver-service` | Confidentiel | Service conducteurs — service account |
| `maintenance-service` | Confidentiel | Service maintenance — service account |
| `location-service` | Confidentiel | Service localisation — service account |
| `event-service` | Confidentiel | Service événements — service account |
| `admin-cli` | Public | Tests en ligne de commande uniquement |

---

## Utilisateurs de test

| Username | Password | Rôle |
|---|---|---|
| `admin-fleet` | `Admin1234!` | admin |
| `manager-fleet` | `Manager1234!` | manager |
| `technicien-fleet` | `Tech1234!` | technicien |
| `conducteur-fleet` | `User1234!` | utilisateur |

>  Les mots de passe sont temporaires (`temporary: true`) — Keycloak demandera un changement à la première connexion via le navigateur.

---

## Intégration Spring Boot (Java)

### 1. Dépendances `pom.xml`

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

### 2. `application.yml`

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # URL interne Docker
          issuer-uri: ${KEYCLOAK_ISSUER_URI:http://localhost:9080/realms/fleet-management}
          # Obligatoire pour éviter l'issuer mismatch localhost vs keycloak:8080
          jwk-set-uri: ${KEYCLOAK_JWK_URI:http://localhost:9080/realms/fleet-management/protocol/openid-connect/certs}
```

### 3. `KeycloakRoleConverter.java`

Extrait les rôles depuis le claim `realm_access.roles` du JWT.

```java
package com.fleet.security;

@Component
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null || !realmAccess.containsKey("roles")) {
            return Collections.emptyList();
        }
        List<String> roles = (List<String>) realmAccess.get("roles");
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());
    }
}
```

### 4. `SecurityConfig.java`

```java
package com.fleet.config;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private KeycloakRoleConverter keycloakRoleConverter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );
        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(keycloakRoleConverter);
        return converter;
    }
}
```

### 5. Protéger un endpoint par rôle

```java
@GetMapping
@PreAuthorize("hasAnyRole('admin', 'manager', 'technicien', 'utilisateur')")
public ResponseEntity<List<MyDto>> getAll(@AuthenticationPrincipal Jwt jwt) {
    log.info("Appelé par : {}", jwt.getClaim("preferred_username"));
    return ResponseEntity.ok(service.findAll());
}

@PostMapping
@PreAuthorize("hasAnyRole('admin', 'manager')")
public ResponseEntity<MyDto> create(@RequestBody MyDto dto) { ... }

@DeleteMapping("/{id}")
@PreAuthorize("hasRole('admin')")
public ResponseEntity<Void> delete(@PathVariable UUID id) { ... }
```

### 6. Variables d'environnement Docker

```yaml
# Dans docker-compose.yml
environment:
  - KEYCLOAK_ISSUER_URI=http://keycloak:8080/realms/fleet-management
  - KEYCLOAK_JWK_URI=http://keycloak:8080/realms/fleet-management/protocol/openid-connect/certs
  - SPRING_PROFILES_ACTIVE=docker
```

---

## Intégration Node.js

### 1. Installer la dépendance

```bash
npm install jwks-rsa jsonwebtoken
```

### 2. Middleware de validation JWT

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_URL}/realms/fleet-management/protocol/openid-connect/certs`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    callback(err, key?.getPublicKey());
  });
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, getKey, {
    issuer: `${process.env.KEYCLOAK_URL}/realms/fleet-management`
  }, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token invalide' });
    req.user = decoded;
    req.roles = decoded.realm_access?.roles || [];
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    const hasRole = roles.some(r => req.roles.includes(r));
    if (!hasRole) return res.status(403).json({ error: 'Accès refusé' });
    next();
  };
}

module.exports = { authenticate, requireRole };
```

### 3. Utilisation dans les routes

```javascript
const { authenticate, requireRole } = require('./middleware/auth');

// Lecture — tous les rôles
router.get('/conducteurs', authenticate, (req, res) => { ... });

// Écriture — admin et manager
router.post('/conducteurs', authenticate, requireRole('admin', 'manager'), (req, res) => { ... });

// Suppression — admin uniquement
router.delete('/conducteurs/:id', authenticate, requireRole('admin'), (req, res) => { ... });
```

### 4. Variables d'environnement

```bash
KEYCLOAK_URL=http://keycloak:8080   # en Docker
# KEYCLOAK_URL=http://localhost:9080  # en local
```

---

## Intégration Python (FastAPI)

### 1. Installer les dépendances

```bash
pip install python-jose[cryptography] httpx fastapi
```

### 2. Utilitaire de validation JWT

```python
# auth/keycloak.py
import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:9080")
REALM = "fleet-management"
ISSUER = f"{KEYCLOAK_URL}/realms/{REALM}"
JWKS_URL = f"{ISSUER}/protocol/openid-connect/certs"

security = HTTPBearer()

def get_jwks():
    response = httpx.get(JWKS_URL)
    return response.json()

def decode_token(token: str) -> dict:
    try:
        jwks = get_jwks()
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
    return decode_token(credentials.credentials)

def require_role(*roles):
    def dependency(user: dict = Security(get_current_user)):
        user_roles = user.get("realm_access", {}).get("roles", [])
        if not any(r in user_roles for r in roles):
            raise HTTPException(status_code=403, detail="Accès refusé")
        return user
    return dependency
```

### 3. Utilisation dans les routes

```python
from fastapi import FastAPI, Depends
from auth.keycloak import get_current_user, require_role

app = FastAPI()

# Lecture — tous les rôles authentifiés
@app.get("/interventions")
def get_interventions(user=Depends(get_current_user)):
    return {"user": user["preferred_username"]}

# Écriture — technicien, manager, admin
@app.post("/interventions")
def create_intervention(user=Depends(require_role("admin", "manager", "technicien"))):
    return {"status": "créé"}

# Suppression — admin uniquement
@app.delete("/interventions/{id}")
def delete_intervention(id: str, user=Depends(require_role("admin"))):
    return {"status": "supprimé"}
```

### 4. Variables d'environnement

```bash
KEYCLOAK_URL=http://keycloak:8080   # en Docker
# KEYCLOAK_URL=http://localhost:9080  # en local
```

---

## Tester l'authentification

### Obtenir un token (bash/WSL)

```bash
# Remplacer ROLE par : admin-fleet, manager-fleet, technicien-fleet, conducteur-fleet
# et PASSWORD par le mot de passe correspondant

TOKEN=$(curl -s -X POST \
  'http://localhost:9080/realms/fleet-management/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=admin-cli&username=manager-fleet&password=Manager1234!&grant_type=password' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo $TOKEN
```

### Décoder le token pour voir les rôles

```bash
# Extraire et décoder la partie payload (entre les deux points)
echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | python3 -m json.tool | grep -A5 "realm_access"
```

Résultat attendu :
```json
"realm_access": {
    "roles": ["manager", "offline_access", "uma_authorization"]
}
```

### Tester un endpoint protégé

```bash
# 200 OK — manager autorisé en lecture
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/vehicules

# 403 Forbidden — manager non autorisé en suppression
curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/vehicules/some-uuid

# 401 Unauthorized — sans token
curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:8081/api/vehicules

# 200 OK — actuator public sans token
curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:8081/actuator/health
```

---

## Commandes utiles

```bash
# Vérifier que Keycloak est up
curl http://localhost:9080/realms/fleet-management

# Voir les logs Keycloak
docker logs fleet-keycloak --tail 50

# Voir les logs en direct
docker logs fleet-keycloak -f

# Redémarrer Keycloak seul
docker compose restart keycloak

# Réinitialiser complètement (efface toutes les données)
docker compose down -v
docker compose up -d

# Accéder à la console admin
open http://localhost:9080/admin
# Login : admin / admin → sélectionner realm fleet-management
```

---

## Dépannage

| Erreur | Cause | Solution |
|---|---|---|
| `curl: (7) Failed to connect` | Keycloak pas encore démarré | Attendre 30-60s, vérifier `docker logs fleet-keycloak` |
| `curl: (52) Empty reply` | Keycloak en cours de démarrage | Attendre encore 20s |
| `unauthorized_client` | Client sans direct access grant | Utiliser `admin-cli` pour les tests curl |
| `401 Unauthorized` | Token absent ou expiré (15 min) | Obtenir un nouveau token |
| `403 Forbidden` | Rôle insuffisant | Vérifier les rôles dans `@PreAuthorize` / `requireRole` |
| `"scope":""` dans le token | Realm pas rechargé après modif | Faire `docker compose down -v` puis `up -d` |
| `issuer mismatch` | URL localhost vs keycloak:8080 | Ajouter `jwk-set-uri` explicitement dans `application.yml` |
| `realm_access` absent du token | Scope `roles` manquant | Ajouter `roles` dans `defaultClientScopes` du client |
| `!: event not found` (bash) | Le `!` dans le mot de passe | Utiliser des guillemets simples `'...'` dans curl |
| Keycloak ne recharge pas le realm | Realm déjà en base PostgreSQL | Faire `docker compose down -v` pour effacer la base |
