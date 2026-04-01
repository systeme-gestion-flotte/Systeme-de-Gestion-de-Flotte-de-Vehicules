# Guide d'utilisation Keycloak (Bruno & Apollo)

Ce guide contient les informations nécessaires pour s'authentifier et tester les APIs via **Bruno** ou **Apollo Sandbox**.

##  1. Paramètres Keycloak

En interne (Docker), Keycloak est accessible via le réseau `fleet-network`.
En externe (ton navigateur / Bruno), utilise les URLs ci-dessous.

- **URL Keycloak Local** : `http://localhost:9080`
- **Realm** : `fleet-management`
- **Client ID** : `fleet-api-gateway`
- **Note** : Le client est désormais **Public** (pas de secret requis).

---

##  2. Obtenir un Token

### Option A : Configuration Bruno (OAuth2)
- Dans Bruno, va dans **Collection Settings** > **Auth** > **OAuth2**.
- **Grant Type** : `Password`.
- **Access Token URL** : `http://localhost:9080/realms/fleet-management/protocol/openid-connect/token`
- **Client ID** : `fleet-api-gateway`
- **Username** : `admin-fleet`
- **Password** : `Admin1234!`

### Option B : Ligne de commande (curl)
Copie-colle cette commande pour avoir le token directement :
```bash
curl -X POST "http://localhost:9080/realms/fleet-management/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=fleet-api-gateway" \
     -d "username=admin-fleet" \
     -d "password=Admin1234!" \
     -d "grant_type=password"
```

---

##  3. Configurer Apollo Sandbox

1. Ouvre **Apollo Sandbox**.
2. Dans l'onglet **Headers** (en bas à gauche), ajoute la clé suivante :
   - **Clé** : `Authorization`
   - **Valeur** : `Bearer <coller_le_token_ici>`

---

##  4. Restaurer la configuration (si besoin)

Si tes utilisateurs disparaissent, redémarre Keycloak avec cette commande pour tout réimporter proprement :
```bash
docker compose down keycloak
docker compose up -d keycloak
```
*(Le fichier `realm-export.json` a été mis à jour pour inclure `admin-fleet` et autoriser les connexions par mot de passe).*

---

##  4. Accès à la Console Admin Keycloak
- **Lien** : [http://localhost:9080](http://localhost:9080)
- **Utilisateur** : `admin`
- **Mot de passe** : `admin`
