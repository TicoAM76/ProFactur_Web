# ADR-003 — Certificado fiscal mediante Bridge local

## Estado

Aceptado.

## Decisión

El certificado permanece en el equipo del cliente.

Profactur Cloud no custodiará:

- PFX/P12.
- contraseña.
- clave privada.

Bridge realizará mTLS contra la AEAT.
