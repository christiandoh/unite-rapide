#!/bin/bash
# Vérifie la connexion Jeko et liste les magasins disponibles
set -e

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -z "$JEKO_API_KEY" ] || [ -z "$JEKO_API_KEY_ID" ]; then
  echo "❌ Définissez JEKO_API_KEY et JEKO_API_KEY_ID dans .env"
  echo "   Cockpit Jeko → Paramètres → API & Webhooks"
  exit 1
fi

echo "🔍 Connexion à l'API Jeko..."
response=$(curl -s -w "\n%{http_code}" \
  -H "X-API-KEY: $JEKO_API_KEY" \
  -H "X-API-KEY-ID: $JEKO_API_KEY_ID" \
  "https://api.jeko.africa/partner_api/stores")

body=$(echo "$response" | head -n -1)
code=$(echo "$response" | tail -n 1)

if [ "$code" != "200" ]; then
  echo "❌ Erreur HTTP $code"
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
  exit 1
fi

echo "✅ Connexion OK — magasins disponibles :"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"

if [ -z "$JEKO_STORE_ID" ]; then
  echo ""
  echo "⚠️  Copiez l'UUID d'un magasin dans JEKO_STORE_ID dans votre .env"
else
  echo ""
  echo "✓ JEKO_STORE_ID configuré : $JEKO_STORE_ID"
fi
