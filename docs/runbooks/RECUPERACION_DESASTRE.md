# Checklist — Recuperación ante desastre

## Prerrequisitos

- Acceso al repositorio Git.
- Backup reciente de PostgreSQL.
- Copia segura de `.env`.
- Servidor Debian limpio.
- Docker y Compose.
- Dominios y DNS.

## Procedimiento

1. Crear `/opt/profactur`.
2. Clonar repositorio.
3. Restaurar `.env`.
4. Crear red y volúmenes.
5. Levantar PostgreSQL y Redis.
6. Restaurar base de datos.
7. Ejecutar migraciones.
8. Construir API y frontend.
9. Levantar servicios.
10. Verificar `/health`.
11. Verificar facturas.
12. Verificar cadenas fiscales.
13. Verificar hashes.
14. Verificar PDFs.
15. Verificar Bridge cuando exista.
16. Verificar DNS y proxy.
17. Documentar incidente.

## Validación mínima

- Empresas.
- Clientes.
- Facturas.
- Series.
- FiscalRecord.
- FiscalSubmission.
- Migraciones.
- Logs sin errores.
