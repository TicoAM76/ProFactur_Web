# Runbook — Despliegue en VPS

## Principio

Nunca editar código directamente en el VPS.

Flujo:

```text
PC local
→ validar
→ commit
→ push
→ VPS git pull
→ migrar
→ build
→ recreate
→ verificar
```

## Local

```powershell
npm.cmd run lint --workspace=api
npm.cmd run test --workspace=api
npm.cmd run build --workspace=api
git status
git add ...
git commit -m "..."
git push
```

## VPS

```bash
cd /opt/profactur
git pull --ff-only
git status
```

### Migraciones

```bash
sudo docker run --rm   --user "$(id -u):$(id -g)"   --network profactur-dev_profactur_network   --env-file /opt/profactur/.env   -e HOME=/tmp   -v /opt/profactur:/app   -w /app   node:24-alpine   sh -lc '
    npm ci &&
    npm exec --workspace=api -- prisma migrate deploy
  '
```

### Build y recreate

```bash
sudo docker compose   --env-file .env   -f infrastructure/compose.dev.yml   build api

sudo docker compose   --env-file .env   -f infrastructure/compose.dev.yml   up -d --force-recreate api
```

## Verificación

```bash
sudo docker compose   --env-file .env   -f infrastructure/compose.dev.yml   ps

sudo docker logs --tail 250 profactur-api-dev
```
