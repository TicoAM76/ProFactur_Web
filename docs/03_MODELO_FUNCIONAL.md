# Modelo funcional

## Núcleo común

FacturTaller Core debe ser común para todos los sectores:

- Empresas.
- Usuarios.
- Clientes.
- Catálogo.
- Impuestos.
- Facturas.
- Cobros.
- PDF.
- VERI*FACTU.
- RN Bridge.
- Licencias.

## Perfiles de negocio

El perfil selecciona una configuración inicial; no determina toda la lógica.

Perfiles previstos:

- `GENERIC`
- `WORKSHOP`
- `HAIR_SALON`
- `RETAIL`
- `HARDWARE_STORE`
- `PROFESSIONAL_SERVICES`

## Módulos

- Vehículos.
- Órdenes de trabajo.
- Citas.
- Profesionales.
- Inventario.
- Variantes.
- Códigos de barras.
- TPV.
- Proveedores.
- Pagos.
- Informes.

## Taller

**PRIMER VERTICAL**

- Vehículos.
- Matrícula.
- VIN.
- Kilometraje.
- Piezas.
- Mano de obra.
- Diagnóstico.
- Futuro: órdenes de trabajo y presupuestos.

## Peluquería

**PLANIFICADO**

- Servicios.
- Productos.
- Duración.
- Agenda.
- Profesionales.
- Comisiones.
- Factura simplificada.

## Comercio

**PLANIFICADO**

- Productos.
- Variantes.
- Tallas.
- Colores.
- Stock.
- Código de barras.
- TPV.
- Tickets.
- Devoluciones.

## Regla de producto

No crear forks por cliente.

```text
Un solo código
+ configuración
+ módulos
+ perfiles
```
