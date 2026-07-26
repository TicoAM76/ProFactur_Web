# Runbook — Incidentes

## API no inicia

1. Ver contenedores.
2. Ver logs.
3. Revisar variables.
4. Revisar migraciones.
5. Verificar conexión a PostgreSQL.

## Migración fallida

1. No volver a ejecutar ciegamente.
2. Guardar error.
3. Revisar `_prisma_migrations`.
4. Verificar SQL.
5. Restaurar backup si hubo cambios parciales.

## PDF incorrecto

1. Verificar HTTP 200.
2. Verificar firma `%PDF-`.
3. Contar páginas.
4. Revisar datos inmutables.
5. Comparar con JSON de factura.

## Envío fiscal atascado

1. Revisar `FiscalSubmission`.
2. Revisar `FiscalSubmissionItem`.
3. Revisar Bridge.
4. Revisar heartbeat.
5. Revisar certificado.
6. Revisar XML y hash.
7. No reenviar ciegamente si el estado es incierto.
