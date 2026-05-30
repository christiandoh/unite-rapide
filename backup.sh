#!/bin/bash
# Sauvegarde automatique Unite Rapide
set -e

BACKUP_DIR="/home/nundo/unite-rapide/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

echo "=== Sauvegarde $TIMESTAMP ==="

# PostgreSQL
echo "PostgreSQL..."
podman exec helpbank-db pg_dump -U ussd_admin ussd_automation 2>/dev/null | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz" && echo "  DB OK" || echo "  DB: pas de dump (controleur de base)"

# Redis
echo "Redis..."
podman exec unite_redis redis-cli -a ZwGghIwgWeZYbCZub81NjNQN --rdb /tmp/dump.rdb 2>/dev/null && \
  podman cp unite_redis:/tmp/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb" 2>/dev/null && echo "  Redis OK" || echo "  Redis: pas de dump"

# Uploads
echo "Uploads..."
if [ -d "/home/nundo/unite-rapide/uploads" ]; then
  tar czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C /home/nundo/unite-rapide uploads 2>/dev/null && echo "  Uploads OK" || echo "  Uploads: vide"
fi

# Logs backend
echo "Logs..."
if [ -d "/home/nundo/unite-rapide/backend-api/logs" ]; then
  tar czf "$BACKUP_DIR/logs_$TIMESTAMP.tar.gz" -C /home/nundo/unite-rapide/backend-api logs 2>/dev/null && echo "  Logs OK"
fi

# Nettoyage: garder 7 jours
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete 2>/dev/null
find "$BACKUP_DIR" -name "redis_*.rdb" -mtime +7 -delete 2>/dev/null
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +7 -delete 2>/dev/null
find "$BACKUP_DIR" -name "logs_*.tar.gz" -mtime +7 -delete 2>/dev/null

echo ""
echo "=== Sauvegarde terminee ==="
ls -lh "$BACKUP_DIR/" | tail -5
