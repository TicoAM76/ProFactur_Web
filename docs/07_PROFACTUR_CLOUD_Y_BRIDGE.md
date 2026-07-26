# Profactur Cloud y Profactur Bridge

## Estado

**DECIDIDO / PLANIFICADO**

Este documento define la arquitectura objetivo. Algunas piezas de Profactur Cloud ya existen; Profactur Bridge todavía no está implementado.

---

## 1. Visión general

```text
Navegador o móvil
        │
        ▼
Profactur Cloud
        │
        ▼
Profactur Bridge instalado en el PC autorizado
        │
        ▼
Certificado fiscal local + AEAT
```

Profactur Cloud y Profactur Bridge son dos componentes distintos:

- **Profactur Cloud**: fuente de verdad, interfaz, reglas de negocio, licencias, facturas, registros fiscales, colas, auditoría y soporte.
- **Profactur Bridge**: ejecutor local de confianza, identidad del dispositivo, acceso al certificado local, transporte mTLS y devolución de respuestas.

---

## 2. Qué se instala en el PC del cliente

Se instalarán dos componentes:

### 2.1. Profactur Bridge Service

Servicio de Windows que:

- arranca automáticamente;
- funciona aunque el navegador esté cerrado;
- mantiene heartbeat con Cloud;
- firma desafíos de licencia;
- reclama trabajos pendientes;
- verifica el hash del XML;
- usa el certificado local;
- envía a la AEAT;
- devuelve respuestas;
- registra estado y errores;
- actualiza su versión.

### 2.2. Profactur Bridge Control

Aplicación ligera de bandeja para:

- emparejar el equipo;
- seleccionar el certificado;
- mostrar estado del agente;
- mostrar caducidad del certificado;
- ver último envío y último error;
- solicitar diagnóstico;
- actualizar el agente;
- transferir o desvincular la instalación cuando corresponda.

El servicio y la interfaz deben estar separados.

---

## 3. Un único Bridge para todos los sectores

Debe existir un único Profactur Bridge para:

- talleres;
- peluquerías;
- ferreterías;
- zapaterías;
- comercios;
- profesionales;
- otros pequeños negocios.

Bridge no interpreta el contenido de las líneas.

No necesita saber si la factura contiene:

- una pieza;
- una hora de mano de obra;
- un corte de pelo;
- un par de zapatos;
- un tornillo;
- un servicio profesional.

Bridge solo conoce:

- empresa;
- dispositivo;
- licencia;
- instalación;
- trabajo fiscal;
- XML;
- hash;
- endpoint;
- certificado local;
- respuesta AEAT;
- estado.

La lógica sectorial pertenece a Profactur Cloud.

---

## 4. Responsabilidades de Profactur Cloud

Profactur Cloud será la fuente de verdad.

### 4.1. Gestión comercial

- empresas;
- usuarios;
- roles;
- permisos;
- suscripciones;
- planes;
- módulos activados;
- dispositivos licenciados;
- soporte;
- facturación del servicio.

### 4.2. Gestión operativa

- clientes;
- catálogo;
- productos;
- servicios;
- vehículos;
- órdenes de trabajo;
- citas;
- inventario;
- borradores;
- presupuestos;
- facturas;
- cobros;
- informes.

### 4.3. Gestión fiscal

- series;
- numeración;
- facturas definitivas;
- registros fiscales;
- encadenamiento;
- hashes;
- XML;
- colas;
- `FiscalSubmission`;
- `FiscalSubmissionItem`;
- respuestas AEAT;
- CSV;
- errores;
- reintentos;
- auditoría.

### 4.4. Gestión de Bridge

- pairing;
- licencia;
- clave pública;
- heartbeat;
- versión del agente;
- estado del certificado;
- dispositivo revocado;
- trabajos pendientes;
- transferencia de instalación;
- soporte.

---

## 5. Responsabilidades de Profactur Bridge

Bridge debe:

- generar identidad criptográfica del dispositivo;
- usar TPM 2.0 cuando exista;
- mantener la clave privada local;
- emparejarse con Cloud;
- firmar solicitudes;
- mantener heartbeat;
- reclamar trabajos;
- verificar hashes;
- usar el certificado fiscal local;
- conectar por mTLS con AEAT;
- devolver respuesta;
- no exportar certificados ni secretos.

Bridge no debe:

- custodiar información completa del negocio;
- descargar todo el historial;
- decidir estados fiscales finales sin verificación de Cloud;
- recibir instrucciones sin firma;
- abrir puertos entrantes;
- almacenar secretos en logs;
- utilizar certificados de otras empresas;
- cambiar el XML recibido.

---

## 6. Tecnología recomendada

### Profactur Cloud

- Next.js
- NestJS
- PostgreSQL
- Redis
- Worker separado
- Almacenamiento de objetos
- Docker
- Nginx o proxy equivalente

### Profactur Bridge

- C#
- .NET 10 LTS
- Windows Service
- aplicación de bandeja
- CNG / TPM
- Windows Certificate Store
- almacenamiento local mínimo
- SQLite solo si hace falta una cola local

---

## 7. Plataforma soportada para el MVP

- Windows 11
- TPM 2.0 recomendado
- un dispositivo fiscal activo por empresa
- una instalación lógica por empresa
- polling firmado
- un certificado local seleccionado por empresa
- un registro fiscal por trabajo
- entorno AEAT TEST

No incluir inicialmente:

- macOS;
- Linux;
- múltiples certificados por empresa;
- múltiples empresas por instalación;
- facturación totalmente offline;
- WebSockets;
- TPV completo;
- inventario avanzado.

---

## 8. Comunicación Cloud ↔ Bridge

### MVP recomendado

Polling firmado cada 15–30 segundos.

Cada ciclo puede combinar:

- heartbeat;
- consulta de trabajo;
- estado del certificado;
- versión del agente;
- último error.

Ventajas:

- simple;
- robusto;
- solo HTTPS;
- fácil de depurar;
- tolerante a cortes;
- escalable para los primeros clientes.

WebSocket puede evaluarse más adelante.

---

## 9. Flujo de emisión

```text
Usuario crea borrador
→ marca READY
→ solicita emisión
→ Cloud genera challenge
→ Bridge firma challenge
→ Cloud verifica licencia y dispositivo
→ Cloud emite factura
→ Cloud crea FiscalRecord
→ Cloud crea XML
→ Cloud crea FiscalSubmission
→ Bridge reclama trabajo
→ Bridge verifica hash
→ Bridge usa certificado local
→ Bridge envía a AEAT
→ Bridge devuelve respuesta
→ Cloud vuelve a verificar
→ Cloud actualiza estados
```

---

## 10. Seguridad

### 10.1. Identidad del dispositivo

- clave privada local;
- clave pública en Cloud;
- challenge firmado;
- nonce de un solo uso;
- timestamp;
- body hash;
- versión del agente;
- licencia activa;
- TPM cuando sea posible.

### 10.2. Identidad fiscal

- certificado local;
- clave privada local;
- almacén de certificados de Windows;
- mTLS contra AEAT.

No mezclar ambas identidades.

### 10.3. Datos que Cloud nunca debe recibir

- P12/PFX;
- contraseña;
- clave privada;
- PIN de token;
- copia exportable del certificado.

Cloud solo podrá guardar:

- huella pública;
- subject;
- issuer;
- número de serie;
- vigencia;
- modalidad;
- última validación.

---

## 11. Espacio local estimado por instalación

| Componente | Reserva estimada |
|---|---:|
| Servicio y runtime | 100–250 MB |
| Aplicación de bandeja | 20–80 MB |
| Configuración y caché | 5–50 MB |
| Logs rotativos | 50–300 MB |
| Cola temporal | 10–500 MB |
| Actualizaciones | 100–300 MB |
| Reserva recomendada total | 1–2 GB |

Bridge no debe conservar el historial completo del negocio.

---

## 12. Capacidad de crecimiento de Cloud

Si cada Bridge consulta cada 30 segundos:

| Dispositivos | Peticiones por segundo aproximadas |
|---:|---:|
| 100 | 3,3 |
| 500 | 16,7 |
| 1.000 | 33,3 |
| 5.000 | 166,7 |
| 10.000 | 333,3 |

Estas cifras son estimaciones, no benchmarks.

---

## 13. Almacenamiento Cloud

### PostgreSQL

Guardar:

- empresas;
- usuarios;
- clientes;
- facturas;
- líneas;
- series;
- registros fiscales;
- hashes;
- estados;
- licencias;
- dispositivos;
- auditoría;
- metadatos.

### Object storage

Guardar:

- PDF final;
- XML enviado;
- XML recibido;
- adjuntos;
- artefactos inmutables.

Estimación operativa para planificación:

- 100–300 KB por factura.
- Valor de referencia inicial: 200 KB por factura.

---

## 14. Escenarios de infraestructura

### Piloto: 1–20 negocios

- 4 vCPU
- 8 GB RAM
- 100–160 GB SSD
- backups externos diarios
- PostgreSQL y Redis en Docker

### 20–200 negocios

- 4–8 vCPU
- 8–16 GB RAM
- 200–500 GB SSD
- object storage externo
- worker separado
- monitorización

### 200–1.000 negocios

- 8–16 vCPU
- 16–32 GB RAM
- API replicada
- worker replicado
- PostgreSQL dedicado
- Redis dedicado
- object storage

---

## 15. Regla comercial

Para el MVP:

```text
Una empresa
→ un dispositivo fiscal activo
→ una instalación de Bridge
```

En el futuro podrá existir:

- dispositivo adicional;
- varias instalaciones;
- varias empresas por equipo;
- plan empresarial.

Pero no debe introducirse antes de validar el piloto.

---

## 16. Orden de implementación

1. Contrato Cloud ↔ Bridge.
2. Bridge Simulator.
3. Pairing.
4. Heartbeat.
5. Polling.
6. Claim de trabajos.
7. Lease.
8. Devolución simulada.
9. Clave de dispositivo.
10. Servicio Windows.
11. Certificado local.
12. AEAT TEST.
13. Instalador.
14. Actualizador firmado.

---

## 17. Decisiones finales

- Un solo Cloud multiempresa.
- Un solo Bridge para todos los sectores.
- No desplegar una copia separada por cliente.
- Polling firmado para el MVP.
- Windows 11 + .NET 10.
- Certificado local.
- TPM recomendado.
- Cloud como fuente de verdad.
- Bridge como ejecutor local.
