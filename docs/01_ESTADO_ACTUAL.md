# Estado actual de Profactur

Fecha de referencia: 26/07/2026.

## Resumen

Profactur es un monorepo de facturación orientado a pequeños negocios, con un primer vertical para talleres y una arquitectura prevista para otros sectores.

## Infraestructura

**IMPLEMENTADO**

- Monorepo npm workspaces.
- Frontend: Next.js en `apps/web`.
- Backend: NestJS en `apps/api`.
- PostgreSQL.
- Redis.
- Docker Compose de desarrollo.
- VPS Debian.
- API expuesta internamente en `127.0.0.1:3101`.
- Ruta de proyecto en VPS: `/opt/profactur`.
- Flujo de trabajo: cambios locales → GitHub → `git pull` en VPS → migración/build/recreate.

## Funcionalidad de negocio

**IMPLEMENTADO**

- Empresas.
- Clientes.
- Vehículos.
- Catálogo de productos, servicios y mano de obra.
- Borradores de factura.
- Líneas editables.
- Cálculo de base, IVA y total.
- Estados `DRAFT`, `READY`, `CONVERTED`.
- Bloqueo de modificaciones al pasar a `READY`.
- Emisión definitiva.
- Serie y número correlativo.
- Facturas inmutables.
- Copia histórica de emisor, cliente, vehículo y líneas.
- PDF profesional.
- Desglose de IVA.
- Contactos históricos en facturas nuevas.
- Consulta de facturas.

## VERI*FACTU

**IMPLEMENTADO Y VALIDADO LOCALMENTE**

- URL QR de cotejo.
- Hash SHA-256.
- Encadenamiento de registros fiscales.
- Registro fiscal `ALTA`.
- Estados fiscales.
- XML SOAP.
- Validación contra XSD oficiales.
- WSDL y XSD guardados en Git.
- Parser de respuesta SOAP.
- Mapeo de estados.
- Persistencia de envíos y líneas de envío.
- Preparación de `FiscalSubmission` sin transmisión real.

**NO IMPLEMENTADO**

- Envío real a AEAT.
- Profactur Bridge.
- Certificado local.
- mTLS real.
- Emparejamiento de dispositivos.
- Licenciamiento por TPM.
- QR visible definitivo en PDF.
- Leyenda VERI*FACTU en producción.

## Facturas de prueba

Las facturas generadas con NIF ficticio `B00000000` no deben enviarse a la AEAT.

## Riesgos actuales

1. La autenticación multiusuario y permisos no está cerrada.
2. Profactur Bridge todavía no existe.
3. El certificado fiscal todavía no se usa.
4. El PDF se regenera; aún no se conserva como artefacto inmutable.
5. El producto minorista necesita F2, ticket, devoluciones e inventario avanzado.
6. La documentación debe actualizarse después de cada cambio importante.
