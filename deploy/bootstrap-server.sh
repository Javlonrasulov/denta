#!/usr/bin/env bash
# Server-side bootstrap for DENTA (run on Contabo as root)
set -euo pipefail

DENTA_ROOT=/opt/denta
mkdir -p "$DENTA_ROOT" /var/backups/denta /var/www/certbot

cd "$DENTA_ROOT"

if [[ ! -f .env ]]; then
  echo "Missing $DENTA_ROOT/.env — abort"
  exit 1
fi

chmod 600 .env
chmod +x deploy/backup-denta.sh || true

echo "==> Building and starting DENTA stack (isolated project name: denta)"
docker compose -p denta -f docker-compose.prod.yml --env-file .env up -d --build

echo "==> Waiting for API health"
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8091/api/v1/health >/dev/null 2>&1; then
    echo "API live"
    break
  fi
  sleep 3
  if [[ $i -eq 60 ]]; then
    echo "API health timeout"
    docker compose -p denta -f docker-compose.prod.yml logs --tail=80 api
    exit 1
  fi
done

curl -fsS http://127.0.0.1:8091/api/v1/health/ready || true
echo
curl -fsS -o /dev/null -w "WEB %{http_code}\n" http://127.0.0.1:8090/ || true

echo "==> Done. Configure nginx + cert next."
