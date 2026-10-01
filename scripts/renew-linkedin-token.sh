#!/usr/bin/env bash
#
# Renueva el token de LinkedIn en Vercel y redespliega.
# Uso: ./scripts/renew-linkedin-token.sh
#
# Requisitos:
#   - vercel CLI instalado y logueado (`vercel login`)
#   - Haber corrido `vercel link` una vez en este directorio
#   - Tener a mano los 5 valores de la página /connected
#
set -euo pipefail

if ! command -v vercel >/dev/null 2>&1; then
  echo "ERROR: vercel CLI no está instalado. Instálalo con: npm i -g vercel" >&2
  exit 1
fi

if [[ ! -d .vercel ]]; then
  echo "ERROR: este directorio no está enlazado a un proyecto de Vercel." >&2
  echo "Ejecuta primero: vercel link" >&2
  exit 1
fi

echo "Pega los 5 valores de la página /connected. El token no se mostrará al teclearlo."
echo

read -rs -p "LINKEDIN_TOKEN: " LINKEDIN_TOKEN
echo
read    -p "LINKEDIN_SUB: "   LINKEDIN_SUB
read    -p "LINKEDIN_TOKEN_EXPIRES_AT: " LINKEDIN_TOKEN_EXPIRES_AT
read    -p "LINKEDIN_NAME: "  LINKEDIN_NAME
read    -p "LINKEDIN_PICTURE: " LINKEDIN_PICTURE

if [[ -z "$LINKEDIN_TOKEN" || -z "$LINKEDIN_SUB" || -z "$LINKEDIN_TOKEN_EXPIRES_AT" ]]; then
  echo "ERROR: LINKEDIN_TOKEN, LINKEDIN_SUB y LINKEDIN_TOKEN_EXPIRES_AT son obligatorios." >&2
  exit 1
fi

if ! [[ "$LINKEDIN_TOKEN_EXPIRES_AT" =~ ^[0-9]+$ ]]; then
  echo "ERROR: LINKEDIN_TOKEN_EXPIRES_AT debe ser un número (timestamp en ms)." >&2
  exit 1
fi

update_var() {
  local name="$1" value="$2"
  # vercel env rm es idempotente con --yes; si no existe, ignoramos el error.
  vercel env rm "$name" production --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | vercel env add "$name" production
}

echo
echo "Actualizando env vars en production…"
update_var LINKEDIN_TOKEN              "$LINKEDIN_TOKEN"
update_var LINKEDIN_SUB                "$LINKEDIN_SUB"
update_var LINKEDIN_TOKEN_EXPIRES_AT   "$LINKEDIN_TOKEN_EXPIRES_AT"
update_var LINKEDIN_NAME               "$LINKEDIN_NAME"
update_var LINKEDIN_PICTURE            "$LINKEDIN_PICTURE"

echo
echo "Redeploying a production…"
vercel --prod

echo
echo "Listo. Comprueba https://TU-APP.vercel.app/api/status cuando termine el deploy."
