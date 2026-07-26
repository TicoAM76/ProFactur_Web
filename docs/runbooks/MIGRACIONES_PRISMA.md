# Runbook — Migraciones Prisma

## Local

1. Modificar `schema.prisma`.
2. Ejecutar:

```powershell
Push-Location .ppspi
npx.cmd prisma format
npx.cmd prisma validate
npx.cmd prisma generate
Pop-Location
```

3. Crear migración SQL.
4. Guardar UTF-8 sin BOM.
5. Verificar primeros bytes:

```text
2D
2D
20
```

6. Ejecutar lint, test y build.
7. Commit y push.

## VPS

1. `git pull --ff-only`
2. `prisma migrate deploy`
3. `prisma migrate status`
4. Verificar tablas/columnas.
5. Reconstruir API.

## Prohibiciones

- No editar migraciones ya aplicadas.
- No usar `migrate dev` contra producción.
- No marcar migraciones fallidas sin investigar.
- No usar `npm audit fix --force`.
