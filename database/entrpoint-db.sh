#!/bin/sh

RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

set -e
#---------------------------------------------------------------------
#--- Wait for Vault to be ready by checking its health endpoint -----
echo -e "${YELLOW}[*] Waiting for Vault to be ready...${NC}"
until curl -s -f --connect-timeout 5 "$VAULT_ADDR/v1/sys/health" > /dev/null; do
  echo -e "${YELLOW}[*] Vault is not ready yet, waiting...${NC}"
  sleep 2
done
#---------------------------------------------------------------------
#--- Fetch the secrets from Vault's 'secret/database' path ----------
echo -e "${YELLOW}[*] Fetching secrets from Vault...${NC}"
SECRETS_RESPONSE=$(curl -s -f --header "X-Vault-Token: $VAULT_TOKEN" "$VAULT_ADDR/v1/secret/database")
#---------------------------------------------------------------------
#--- Check if the response is empty or contains errors --------------
if [ -z "$SECRETS_RESPONSE" ] || echo "$SECRETS_RESPONSE" | grep -q "errors"; then
  echo -e "${RED}[!] ERROR: Failed to retrieve secrets from Vault${NC}"
  echo -e "${RED}[!] Response: $SECRETS_RESPONSE${NC}"
  exit 1
fi
#---------------------------------------------------------------------
#--- Extract secret values from the response using jq ---------------
SECRETS=$(echo "$SECRETS_RESPONSE" | jq -r '.data')
export POSTGRES_USER=$(echo "$SECRETS" | jq -r '.POSTGRES_USER')
export POSTGRES_PASSWORD=$(echo "$SECRETS" | jq -r '.POSTGRES_PASSWORD')
export POSTGRES_DB=$(echo "$SECRETS" | jq -r '.POSTGRES_DB')
#---------------------------------------------------------------------
#--- Ensure required secrets are present ----------------------------
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
  echo -e "${RED}[!] ERROR: Required secrets are missing or empty${NC}"
  exit 1
fi
#---------------------------------------------------------------------
#--- Success message ------------------------------------------------
echo -e "${GREEN}[*] Successfully loaded secrets from Vault:${NC} USER=$POSTGRES_USER DB=$POSTGRES_DB"
#---------------------------------------------------------------------
#--- Execute original Docker entrypoint -----------------------------
exec docker-entrypoint.sh "$@"
#---------------------------------------------------------------------
