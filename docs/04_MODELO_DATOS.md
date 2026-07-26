# Modelo de datos

## Entidades principales

### Company

Empresa usuaria de Profactur.

Incluye:

- Razón social.
- Nombre comercial.
- NIF.
- Dirección.
- Teléfono.
- Email.
- Web.
- Estado.

### Customer

Cliente de la empresa.

### Vehicle

Extensión sectorial para talleres.

### CatalogItem

Elemento genérico del catálogo:

- `PRODUCT`
- `SERVICE`
- `LABOR`

### InvoiceDraft

Borrador editable.

Estados:

- `DRAFT`
- `READY`
- `CONVERTED`

### Invoice

Factura definitiva e inmutable.

Conserva instantáneas de:

- Emisor.
- Cliente.
- Vehículo.
- Líneas.
- Contactos.
- Totales.

### InvoiceSeries

Serie y numeración correlativa.

### FiscalChain

Cadena fiscal por:

- Empresa.
- Entorno.
- Instalación.

### FiscalRecord

Registro fiscal encadenado.

### FiscalSubmission

Envío SOAP preparado.

### FiscalSubmissionItem

Resultado individual de un registro dentro del envío.

## Principio de inmutabilidad

Una factura emitida no debe depender de datos actuales de `Company`, `Customer`, `Vehicle` o `CatalogItem`.

Por eso se copian los datos al emitir.

## Modelos futuros

- `CompanyModule`
- `LicensedDevice`
- `DevicePairingCode`
- `DeviceChallenge`
- `DeviceEvent`
- `Payment`
- `StoredArtifact`
- `WorkOrder`
- `ProductVariant`
