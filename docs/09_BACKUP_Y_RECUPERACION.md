# Backup y recuperación

## Objetivo

Poder reconstruir FacturTaller si se pierde:

- VPS.
- Contenedores.
- Base de datos.
- Archivos.
- Configuración.

## Qué debe existir fuera del VPS

- Repositorio Git remoto.
- Backup de PostgreSQL.
- Copia cifrada de `.env`.
- Copia de recursos persistentes.
- Documentación.
- Lista de dominios y DNS.
- Inventario de servicios.
- Checksums.
- Procedimiento de restauración.

## Frecuencia recomendada

- PostgreSQL: diario.
- Configuración: después de cada cambio.
- Artefactos: diario.
- Prueba de restauración: mensual.
- Copia externa: diaria.

## Regla 3-2-1

- 3 copias.
- 2 medios distintos.
- 1 copia fuera del VPS.

## Qué no debe incluirse en Git

- `.env`
- certificados
- claves
- backups con datos reales
