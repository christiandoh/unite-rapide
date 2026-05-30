#!/bin/bash
# Healthcheck Unite Rapide
LOGFILE="/home/nundo/unite-rapide/healthcheck.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

check() {
  if systemctl is-active --quiet "$1"; then
    echo "$DATE ✅ $1" >> "$LOGFILE"
  else
    echo "$DATE ❌ $1 - TENTATIVE DE REDEMARRAGE..." >> "$LOGFILE"
    sudo systemctl restart "$1"
    sleep 3
    if systemctl is-active --quiet "$1"; then
      echo "$DATE ✅ $1 redemarre avec succes" >> "$LOGFILE"
    else
      echo "$DATE 🔴 $1 ECHEC de redemarrage" >> "$LOGFILE"
    fi
  fi
}

check unite-backend.service
check unite-websocket.service
check cloudflare-tunnel.service

# Verifier les containers
for c in helpbank-db unite_redis; do
  if podman ps --filter name="$c" --format "{{.Status}}" | grep -q "Up"; then
    echo "$DATE ✅ container $c" >> "$LOGFILE"
  else
    echo "$DATE ❌ container $c" >> "$LOGFILE"
  fi
done

# Test API
curl -sf http://127.0.0.1:3002/api/health > /dev/null 2>&1 && \
  echo "$DATE ✅ API health" >> "$LOGFILE" || \
  echo "$DATE 🔴 API health FAIL" >> "$LOGFILE"

# Nettoyer le fichier de log (garder 100 lignes)
tail -n 100 "$LOGFILE" > /tmp/health_tmp && mv /tmp/health_tmp "$LOGFILE"
