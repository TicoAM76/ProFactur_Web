# Licenciamiento por dispositivo

## Decisión

```text
Una licencia = una instalación fiscal activa
```

No basar la licencia únicamente en MAC, CPU, disco o placa.

## Identidad

Bridge genera:

- Clave privada local.
- Clave pública registrada en Cloud.

Preferencia:

- TPM 2.0.
- Clave no exportable.

## Operaciones restringidas

- Emitir.
- Rectificar.
- Anular.
- Preparar envío.
- Enviar a AEAT.

## Operaciones permitidas desde otros equipos

- Consultar.
- Crear borradores.
- Ver facturas.
- Ver informes.
- Administrar catálogo.

## Modelos futuros

```prisma
LicensedDevice
DevicePairingCode
DeviceChallenge
DeviceEvent
```

## Cambio de PC

- Revocar anterior.
- Marcar como reemplazado.
- Generar nuevo pairing.
- Activar nuevo equipo.
- Conservar auditoría.

## Fingerprint

Solo señal secundaria.

Nunca fundamento principal.
