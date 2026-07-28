# ADR-006 — Arquitectura RN Business Core Cloud ↔ Bridge

## Estado

Aceptado.

## Contexto

FacturTaller necesita:

- licencia por dispositivo;
- certificado fiscal local;
- envío a AEAT;
- soporte multiempresa;
- soporte multisectorial;
- no custodiar certificados de clientes.

## Decisión

Adoptar:

- RN Business Core Cloud como fuente de verdad y plano de control.
- RN Bridge como agente local común para todos los sectores.
- Windows 11 y .NET 10 para el MVP.
- Polling firmado cada 15–30 segundos.
- Una instalación fiscal activa por empresa.
- TPM 2.0 preferente.
- Certificado fiscal siempre local.
- Cloud sin PFX, passphrase ni clave privada.
- Bridge Simulator antes del agente real.

## Consecuencias positivas

- Menor riesgo de custodia.
- Un solo producto para todos los sectores.
- Escalabilidad centralizada.
- Soporte recurrente.
- Licencia fuerte por dispositivo.
- Separación entre negocio y transporte fiscal.

## Consecuencias negativas

- Desarrollo de agente Windows.
- Instalación y actualizaciones.
- Soporte local.
- Gestión de dispositivos offline.
- Gestión de certificados caducados.
- Mayor complejidad operativa.

## Alternativas descartadas

### Certificados en Cloud

Descartado por riesgo y responsabilidad.

### Un despliegue por cliente

Descartado como estándar por coste operativo.

### Fingerprint simple de hardware

Descartado como identidad principal.

### WebSocket desde el inicio

Descartado para el MVP por complejidad.

## Fecha

26/07/2026.
