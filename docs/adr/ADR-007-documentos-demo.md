# ADR-007 — Documentos de demostración separados de la facturación fiscal

## Estado

Aceptado.

## Contexto

Profactur necesita una versión demostrable antes de disponer de:

- Profactur Bridge;
- certificado digital válido;
- transporte mTLS;
- prueba real en AEAT TEST.

La demo debe enseñar el flujo completo sin generar facturas fiscales ficticias ni contaminar la cadena VERI*FACTU.

## Decisión

Crear `DemoDocument` y `DemoDocumentSeries` separados de:

- `Invoice`;
- `InvoiceSeries`;
- `FiscalRecord`;
- `FiscalChain`;
- `FiscalSubmission`.

Cada documento DEMO:

- nace de un `InvoiceDraft` en estado `READY`;
- conserva un snapshot;
- recibe número `DEMO-AAAA-NNNNNN`;
- genera PDF;
- genera XML de previsualización;
- genera hash;
- incorpora QR interno;
- no se transmite.

## Pie obligatorio

```text
Estructura validada contra el XSD oficial.
Registro y XML preparados para prueba de integración.
Pendiente de certificado válido y envío real en TEST.
```

También debe mostrar:

```text
QR DEMO — NO AEAT
```

## Consecuencias

### Positivas

- Demo comercial sin contaminar fiscalidad.
- Reutilización del generador PDF y XML.
- Preparación para Bridge.
- Trazabilidad interna.

### Negativas

- Nuevo modelo y migración.
- Ruta paralela temporal.
- Debe eliminarse toda apariencia de aceptación AEAT.

## Empresa demo

Taller Martín Brothers Paint & Body Shop.
