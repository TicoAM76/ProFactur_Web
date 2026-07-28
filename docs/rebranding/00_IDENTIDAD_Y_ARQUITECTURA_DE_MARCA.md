# Identidad y arquitectura de marca

## Identidad propuesta para la reunión

- Empresa: RN Soluciones Digitales, S.L.
- Marca corporativa: RN Soluciones Digitales
- Primer producto vertical: FacturTaller
- Descriptor: Gestión integral para talleres
- Eslogan: Del vehículo a la factura, todo bajo control.
- Núcleo compartido: RN Business Core
- Agente local compartido: RN Bridge

La denominación RN Soluciones Digitales, S.L. es provisional hasta completar las comprobaciones mercantiles y de marca.

## Arquitectura de productos

RN Soluciones Digitales desarrolla una plataforma empresarial modular basada en un núcleo común y un agente local compartido.

### RN Business Core

Incluye:

- empresas;
- usuarios, roles y permisos;
- clientes y proveedores;
- catálogo;
- presupuestos y borradores;
- facturación y series;
- impuestos;
- PDF, XML, hash y QR;
- Veri*Factu;
- auditoría;
- cobros;
- notificaciones;
- suscripciones.

### RN Bridge

Es el agente local común para todos los sectores.

Incluye:

- servicio Windows;
- aplicación de bandeja;
- certificado fiscal local;
- identidad de dispositivo;
- TPM 2.0 cuando esté disponible;
- conexión mTLS con AEAT;
- envío y conservación de respuestas.

### FacturTaller

Añade al núcleo:

- vehículos;
- matrículas y bastidores;
- órdenes de reparación;
- mano de obra y piezas;
- fotografías;
- estados del trabajo;
- historial del vehículo.

### FacturTienda

Añade al núcleo:

- inventario;
- proveedores;
- movimientos de almacén;
- caja;
- TPV;
- tickets.

### NTALoteNIE

Es otra solución de RN Soluciones Digitales.

Puede compartir autenticación, pagos, observabilidad e infraestructura, pero mantiene un dominio funcional independiente.

## Principio técnico

FacturTaller y FacturTienda no son clones.

Ambos utilizan:

1. la misma aplicación base;
2. la misma API;
3. el mismo motor fiscal;
4. el mismo RN Bridge;
5. módulos sectoriales activables;
6. identidad y configuración distintas.

## Presentación pública

FacturTaller

Gestión integral para talleres

Del vehículo a la factura, todo bajo control.

Una solución de RN Soluciones Digitales
