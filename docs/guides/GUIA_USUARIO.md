# Guía de usuario — Borrador

## Flujo básico

1. Crear cliente.
2. Crear vehículo si aplica.
3. Crear catálogo.
4. Crear borrador.
5. Añadir líneas.
6. Revisar totales.
7. Marcar READY.
8. Emitir.
9. Descargar PDF.
10. Revisar estado fiscal.

## Estados

### Borrador

- `DRAFT`: editable.
- `READY`: bloqueado y listo.
- `CONVERTED`: convertido en factura.

### Factura

- `ISSUED`
- `RECTIFIED`
- `CANCELLED`

### Fiscal

- `PENDING_SUBMISSION`
- `SUBMITTED`
- `ACCEPTED`
- `ACCEPTED_WITH_ERRORS`
- `REJECTED`
