#!/bin/sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

set -e
#-----------------------------------------------------------------------------------------------
#---- Wait for Vault to be ready by checking its health status -------------------------------
echo -e "${YELLOW}[*] Waiting for Vault to be ready...${NC}"
until curl -s -f --connect-timeout 3 "$VAULT_ADDR/v1/sys/health" > /dev/null; do
  echo -e "${YELLOW}[!] Vault is not ready yet, waiting...${NC}"
  sleep 2
done
#-----------------------------------------------------------------------------------------------
#---- Retrieve the POSTGRES_USER and POSTGRES_DB secrets from Vault ----------------------------
echo -e "${YELLOW}[*] Retrieving database credentials from Vault...${NC}"
USER=$(vault kv get -field=POSTGRES_USER secret/database)
DATABASE=$(vault kv get -field=POSTGRES_DB secret/database)
#-----------------------------------------------------------------------------------------------
#---- Check the readiness of PostgreSQL server -------------------------------------------------
echo -e "${YELLOW}[*] Checking PostgreSQL readiness for DB=${GREEN}$DATABASE${YELLOW} and USER=${GREEN}$USER${YELLOW}${NC}"
pg_isready -U "$USER" -d "$DATABASE"
#-----------------------------------------------------------------------------------------------
