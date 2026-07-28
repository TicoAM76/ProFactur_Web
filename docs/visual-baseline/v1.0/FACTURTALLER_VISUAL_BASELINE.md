# FacturTaller — Referencia visual v1.0

## Estado

Esta referencia visual corresponde a la versión aprobada y desplegada de FacturTaller DEMO.

- Dominio: https://demo-facturtaller.mnservicios.es/
- Rama de origen: feature/documentos-demo
- Commit de origen: 81979bbc005fb1149c9179d391f9746346f1e958
- Producto: FacturTaller
- Modalidad actual: DEMO sin envío real a la AEAT

## Objetivo

Preservar la identidad visual y la estructura aprobada de FacturTaller durante el desarrollo de:

- RN Bridge.
- Integración VERI*FACTU.
- Comunicación con AEAT TEST.
- Autenticación y multiempresa.
- Configuración fiscal.
- Facturación real.
- Rectificaciones y anulaciones.

Los cambios técnicos y fiscales no deben provocar regresiones visuales no autorizadas.

## Elementos protegidos

### Identidad

- Logotipo FacturTaller.
- Símbolo, favicon e iconos.
- Colores azul oscuro, blanco y naranja.
- Proporciones del logotipo.
- Tipografía y jerarquía visual.
- Identidad de RN Soluciones Digitales.

### Interfaz web

- Barra lateral.
- Cabecera del panel.
- Tarjetas de indicadores.
- Botones principales y secundarios.
- Tablas.
- Estados visuales.
- Distribución general del dashboard.
- Diseño responsive.

### Factura y PDF

- Cabecera.
- Posición y tamaño del logotipo.
- Bloque del emisor.
- Bloque del cliente.
- Bloque del vehículo.
- Tabla de conceptos.
- Desglose de impuestos.
- Totales.
- QR.
- Pie de página.
- Márgenes.
- Iconos.
- Distribución general en una sola hoja cuando el contenido lo permita.

### Página de verificación

- Identidad FacturTaller.
- Presentación del estado.
- Datos principales del documento.
- Información de verificación.
- Advertencias DEMO.

## Cambios permitidos sin rediseño

Pueden cambiar:

- Datos de la empresa.
- Datos del cliente.
- Datos del vehículo.
- NIF y dirección.
- Serie y número.
- Conceptos e importes.
- Estados reales de la AEAT.
- Contenido del QR.
- CSV y referencias fiscales.
- Textos DEMO al pasar a producción.
- Lógica interna y componentes de transporte.

Estos cambios no deben modificar la composición visual aprobada.

## Cambios que requieren aprobación expresa

Requieren una nueva versión de la referencia visual:

- Cambio de logotipo.
- Cambio de iconos.
- Cambio de colores.
- Cambio de tipografía.
- Cambio de proporciones.
- Cambio de márgenes.
- Cambio de distribución de la factura.
- Cambio de posición del QR.
- Eliminación o sustitución de bloques visuales.
- Rediseño del dashboard.
- Rediseño de la página de verificación.

## Regla para RN Bridge

RN Bridge puede modificar el flujo técnico de envío, estados, errores y respuestas fiscales.

RN Bridge no puede modificar:

- La identidad visual.
- Los iconos.
- El logotipo.
- La composición de la factura.
- La plantilla PDF.
- La distribución del dashboard.

## Control de cambios

Todo cambio visual deberá:

1. Explicar el motivo.
2. Mostrar comparación antes/después.
3. Confirmar que no afecta la información fiscal obligatoria.
4. Crear una nueva versión de esta referencia.
5. Actualizar las capturas, PDF y hashes.

## Artefactos de referencia

Esta carpeta deberá contener:

- `dashboard-desktop.png`
- `dashboard-mobile.png`
- `factura-demo-reference.pdf`
- `verification-page.png`
- `facturtaller-logo-dark.svg`
- `manifest.sha256`

## Criterio de aceptación

La referencia visual se considerará completa cuando:

- El dashboard de escritorio esté capturado.
- La versión móvil esté capturada.
- Exista un PDF de factura aprobado.
- Exista una captura de la verificación pública.
- Los archivos estén versionados.
- Los hashes SHA-256 estén registrados.
- Se cree la etiqueta Git `visual-baseline-v1.0`.
