#!/usr/bin/env bash
# Daily DENTA PostgreSQL dump — isolated from TAOMIM backups
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/denta}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/denta}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="${BACKUP_DIR}/denta_pg_${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
cd "$COMPOSE_DIR"

# Read DB creds from running container env (avoid sourcing .env with special chars)
POSTGRES_USER="$(docker compose -p denta -f "$COMPOSE_FILE" exec -T postgres printenv POSTGRES_USER | tr -d '\r')"
POSTGRES_DB="$(docker compose -p denta -f "$COMPOSE_FILE" exec -T postgres printenv POSTGRES_DB | tr -d '\r')"

docker compose -p denta -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --format=plain \
  | gzip -c > "$OUT"

MEDIA_OUT="${BACKUP_DIR}/denta_uploads_${STAMP}.tar.gz"
if docker volume inspect denta_uploads >/dev/null 2>&1; then
  docker run --rm \
    -v denta_uploads:/data:ro \
    -v "$BACKUP_DIR":/backup \
    alpine:3.20 \
    tar -czf "/backup/denta_uploads_${STAMP}.tar.gz" -C /data .
fi

find "$BACKUP_DIR" -type f -name 'denta_pg_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'denta_uploads_*.tar.gz' -mtime +"$RETENTION_DAYS" -delete

echo "OK $OUT"
ls -lh "$OUT" 2>/dev/null || true
ls -lh "$MEDIA_OUT" 2>/dev/null || true
