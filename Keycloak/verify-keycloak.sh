#!/bin/bash
# =============================================================================
# verify-keycloak.sh
# Script de vérification que la configuration Keycloak est fonctionnelle
# Projet M1 GIL - Gestion de Flotte - Université de Rouen
# =============================================================================

BASE_URL="http://localhost:8080"
REALM="fleet-management"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN} PASS${NC} — $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED} FAIL${NC} — $1"; FAIL=$((FAIL+1)); }
info() { echo -e "\n${YELLOW}▶ $1${NC}"; }

echo "============================================================"
echo "  Vérification Keycloak — realm: $REALM"
echo "============================================================"

# 1. Realm accessible
info "1. Vérification du realm"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/realms/$REALM")
[ "$STATUS" = "200" ] && ok "Realm '$REALM' accessible" || fail "Realm inaccessible (HTTP $STATUS)"

# 2. OIDC discovery endpoint
info "2. OpenID Connect Discovery"
OIDC=$(curl -s "$BASE_URL/realms/$REALM/.well-known/openid-configuration")
echo "$OIDC" | grep -q "authorization_endpoint" \
  && ok "OIDC discovery endpoint OK" \
  || fail "OIDC discovery endpoint KO"

# 3. Token avec chaque utilisateur de test
info "3. Authentification des utilisateurs de test"

get_token() {
  local USER=$1
  local PASS=$2
  curl -s -X POST \
    "$BASE_URL/realms/$REALM/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=fleet-frontend" \
    -d "username=$USER" \
    -d "password=$PASS" \
    -d "grant_type=password"
}

for PAIR in "admin-fleet:Admin1234!" "manager-fleet:Manager1234!" "technicien-fleet:Tech1234!" "conducteur-fleet:User1234!"; do
  USER="${PAIR%%:*}"
  PWD="${PAIR##*:}"
  RESPONSE=$(get_token "$USER" "$PWD")
  echo "$RESPONSE" | grep -q "access_token" \
    && ok "Token obtenu pour '$USER'" \
    || fail "Échec token pour '$USER'"
done

# 4. Vérification des clients
info "4. Vérification des clients via Admin API"

# Obtenir token admin
ADMIN_TOKEN=$(curl -s -X POST \
  "$BASE_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  fail "Impossible d'obtenir le token admin (vérifiez admin/admin)"
else
  ok "Token admin obtenu"
  CLIENTS=$(curl -s \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    "$BASE_URL/admin/realms/$REALM/clients")

  for CLIENT in fleet-frontend fleet-api-gateway vehicle-service driver-service maintenance-service location-service event-service; do
    echo "$CLIENTS" | grep -q "\"$CLIENT\"" \
      && ok "Client '$CLIENT' présent" \
      || fail "Client '$CLIENT' manquant"
  done
fi

# --- Résumé ---
echo ""
echo "============================================================"
echo -e "  Résultat : ${GREEN}$PASS PASS${NC} / ${RED}$FAIL FAIL${NC}"
echo "============================================================"
[ $FAIL -eq 0 ] && echo -e "  ${GREEN}Keycloak configuré correctement !${NC}" \
                || echo -e "  ${RED}Des erreurs ont été détectées. Consultez les logs.${NC}"
echo "============================================================"
