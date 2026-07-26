# VERI*FACTU

## Estado

**IMPLEMENTADO**

- Hash oficial.
- Encadenamiento.
- URL QR.
- XML SOAP.
- XSD.
- WSDL.
- Parser de respuesta.
- Mapeo de estados.
- Persistencia de envíos.
- Preparación de envíos.

**PENDIENTE**

- Bridge.
- Certificado local.
- mTLS.
- Envío real.
- Respuesta real.
- QR visible definitivo.
- Declaración responsable.
- F2.
- Rectificativas.
- Anulaciones completas.

## Flujo previsto

```text
Factura emitida
→ FiscalRecord
→ XML
→ FiscalSubmission
→ Bridge reclama trabajo
→ Bridge verifica hash
→ Bridge usa certificado local
→ AEAT
→ Bridge devuelve respuesta
→ Cloud procesa
→ estados y auditoría
```

## Regla de pruebas

No enviar registros con datos ficticios.

## QR

Solo debe mostrarse con la configuración fiscal correcta y cuando el flujo esté listo.

## Recursos oficiales

Guardados bajo:

```text
apps/api/resources/verifactu/xsd/
```
