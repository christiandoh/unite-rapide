#!/bin/bash
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

echo "🔄 Sauvegarde PostgreSQL..."
docker compose exec -T postgres pg_dump -U ussd_admin ussd_automation > "$BACKUP_DIR/db_$TIMESTAMP.sql"
gzip "$BACKUP_DIR/db_$TIMESTAMP.sql"
echo "  ✓ Base de données: backups/db_$TIMESTAMP.sql.gz"

echo "🔄 Sauvegarde Redis..."
docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-changeme}" --rdb /tmp/dump.rdb 2>/dev/null
docker compose cp redis:/tmp/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"
echo "  ✓ Redis: backups/redis_$TIMESTAMP.rdb"

echo "🔄 Sauvegarde des uploads..."
if docker compose ps -q backend-api 2>/dev/null; then
  docker compose exec -T backend-api tar cz -C /app/uploads . > "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" 2>/dev/null || echo "  (pas d'uploads)"
fi
echo "  ✓ Uploads: backups/uploads_$TIMESTAMP.tar.gz"

echo "🔄 Sauvegarde des logs..."
if docker compose ps -q backend-api 2>/dev/null; then
  docker compose exec -T backend-api tar cz -C /app/logs . > "$BACKUP_DIR/logs_$TIMESTAMP.tar.gz" 2>/dev/null || echo "  (pas de logs)"
fi
echo "  ✓ Logs: backups/logs_$TIMESTAMP.tar.gz"

echo ""
echo "✅ Sauvegarde terminée : $BACKUP_DIR/"
ls -lh "$BACKUP_DIR/" | tail -5
