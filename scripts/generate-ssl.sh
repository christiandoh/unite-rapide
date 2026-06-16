#!/bin/bash
# Génère des certificats SSL auto-signés pour le développement local
set -e

SSL_DIR="${1:-nginx/ssl}"
mkdir -p "$SSL_DIR"

if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
  echo "Certificats déjà présents dans $SSL_DIR"
  exit 0
fi

echo "Génération des certificats auto-signés dans $SSL_DIR..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/privkey.pem" \
  -out "$SSL_DIR/fullchain.pem" \
  -subj "/C=CI/O=Unite Rapide/CN=localhost"

echo "✅ Certificats créés:"
echo "   $SSL_DIR/fullchain.pem"
echo "   $SSL_DIR/privkey.pem"
