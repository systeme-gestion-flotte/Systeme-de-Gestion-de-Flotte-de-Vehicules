#!/bin/bash
# =============================================================================
# import-keycloak.sh
# Script d'import automatique du realm fleet-management dans Keycloak
# Projet M1 GIL - Gestion de Flotte - Université de Rouen
# =============================================================================

set -e

# --- Configuration ---
KEYCLOAK_VERSION="24.0.3"
REALM_FILE="realm-fleet.json"
CONTAINER_NAME="keycloak-fleet"
KEYCLOAK_PORT="8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"

# --- Couleurs pour les logs ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info()    { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Vérifications préalables ---
log_info "Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
  log_error "Docker n'est pas installé. Veuillez l'installer : https://docs.docker.com/"
  exit 1
fi

if [ ! -f "$REALM_FILE" ]; then
  log_error "Fichier '$REALM_FILE' introuvable dans le répertoire courant."
  log_error "Assurez-vous de lancer ce script depuis le dossier contenant realm-fleet.json"
  exit 1
fi

log_info "Prérequis OK."

# --- Supprimer le conteneur existant si présent ---
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  log_warn "Conteneur '${CONTAINER_NAME}' déjà existant. Suppression..."
  docker rm -f "$CONTAINER_NAME" > /dev/null
fi

# --- Lancer Keycloak avec import automatique du realm ---
log_info "Démarrage de Keycloak ${KEYCLOAK_VERSION} avec import du realm..."

docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${KEYCLOAK_PORT}:8080" \
  -e KEYCLOAK_ADMIN="$ADMIN_USER" \
  -e KEYCLOAK_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -v "$(pwd)/${REALM_FILE}:/opt/keycloak/data/import/${REALM_FILE}" \
  "quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}" \
  start-dev --import-realm

log_info "Conteneur démarré. Attente que Keycloak soit prêt..."

# --- Attendre que Keycloak soit opérationnel ---
MAX_WAIT=120
ELAPSED=0
until curl -s "http://localhost:${KEYCLOAK_PORT}/realms/master" > /dev/null 2>&1; do
  sleep 3
  ELAPSED=$((ELAPSED + 3))
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    log_error "Keycloak n'a pas démarré après ${MAX_WAIT}s."
    log_error "Consultez les logs : docker logs ${CONTAINER_NAME}"
    exit 1
  fi
  echo -n "."
done

echo ""
log_info "Keycloak est prêt !"

# --- Vérifier que le realm a bien été importé ---
log_info "Vérification de l'import du realm 'fleet-management'..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:${KEYCLOAK_PORT}/realms/fleet-management")

if [ "$HTTP_STATUS" = "200" ]; then
  log_info " Realm 'fleet-management' importé avec succès !"
else
  log_error "Le realm 'fleet-management' n'a pas été trouvé (HTTP $HTTP_STATUS)."
  log_error "Consultez les logs : docker logs ${CONTAINER_NAME}"
  exit 1
fi

# --- Résumé ---
echo ""
echo "============================================================"
echo -e "${GREEN}  Keycloak opérationnel !${NC}"
echo "============================================================"
echo ""
echo "  Console admin  : http://localhost:${KEYCLOAK_PORT}/admin"
echo "  Login admin    : ${ADMIN_USER} / ${ADMIN_PASSWORD}"
echo ""
echo "  Realm importé  : fleet-management"
echo "  OIDC endpoint  : http://localhost:${KEYCLOAK_PORT}/realms/fleet-management/.well-known/openid-configuration"
echo ""
echo "  Utilisateurs de test :"
echo "    admin-fleet      / Admin1234!"
echo "    manager-fleet    / Manager1234!"
echo "    technicien-fleet / Tech1234!"
echo "    conducteur-fleet / User1234!"
echo ""
echo "    IMPORTANT : Remplacez les secrets 'change-me-*' avant"
echo "     tout déploiement en environnement réel !"
echo "============================================================"
