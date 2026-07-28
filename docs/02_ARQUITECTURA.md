# Arquitectura técnica

## Visión general

```text
Usuario
  │
  ▼
Next.js
  │
  ▼
NestJS API
  ├── PostgreSQL
  ├── Redis
  ├── Worker futuro
  └── RN Bridge futuro
          │
          ▼
         AEAT
```

## RN Business Core Cloud

RN Business Core Cloud será la fuente de verdad.

Responsabilidades:

- Empresas.
- Usuarios.
- Módulos.
- Clientes.
- Catálogo.
- Borradores.
- Facturas.
- Numeración.
- Registros fiscales.
- XML.
- Hashes.
- Colas.
- Respuestas AEAT.
- Licencias.
- Dispositivos.
- Auditoría.

## RN Bridge

**PLANIFICADO**

Servicio local de Windows.

Responsabilidades:

- Identidad del dispositivo.
- Clave TPM.
- Heartbeat.
- Certificado fiscal local.
- Reclamo de trabajos.
- Verificación del hash del XML.
- Envío mTLS a la AEAT.
- Devolución de respuestas.

Bridge no debe almacenar lógica sectorial.

## Multiempresa

Cada entidad debe quedar asociada directa o indirectamente a `companyId`.

Reglas:

- Un usuario solo ve sus empresas.
- Un dispositivo solo opera para su empresa.
- Un trabajo fiscal solo puede reclamarse por un dispositivo autorizado.
- No confiar únicamente en `companyId` enviado por URL.

## Escalabilidad

MVP:

- Un VPS.
- PostgreSQL.
- Redis.
- Un proceso API.
- Un worker futuro.
- Polling firmado para Bridge.

Futuro:

- Almacenamiento S3 compatible.
- Workers separados.
- WebSockets si aporta valor.
- Alta disponibilidad.
- Backups externos.
