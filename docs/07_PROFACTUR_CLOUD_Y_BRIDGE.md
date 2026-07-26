# Profactur Cloud y Profactur Bridge

## Profactur Cloud

Fuente de verdad y plano de control.

Debe gestionar:

- Usuarios.
- Empresas.
- Facturas.
- Registros fiscales.
- Licencias.
- Dispositivos.
- Trabajos.
- Auditoría.
- Soporte.
- Alertas.

## Profactur Bridge

Agente local.

Primera plataforma:

- Windows 11.
- TPM 2.0.
- Servicio Windows.
- Futuro complemento de bandeja.

Tecnología recomendada:

- C#.
- .NET 8.
- Windows Service.
- CNG/TPM.
- Almacén de certificados de Windows.

## Comunicación

MVP:

- Polling firmado.
- Heartbeat cada pocos segundos.
- Solo conexiones salientes.
- HTTPS.
- Nonces.
- Firmas.
- Hash del cuerpo.
- Versión mínima del agente.

## Protocolo futuro

Headers sugeridos:

```text
X-Profactur-Device-Id
X-Profactur-Timestamp
X-Profactur-Nonce
X-Profactur-Body-SHA256
X-Profactur-Signature
X-Profactur-Agent-Version
```

## Reclamo de trabajos

```text
CREATED
→ CLAIMED
→ SENDING
→ RESPONSE_RECEIVED
→ COMPLETED
```

Campos futuros:

- `assignedDeviceId`
- `claimedAt`
- `leaseExpiresAt`
- `deviceRequestSignature`
- `deviceResponseSignature`
- `agentVersion`

## Decisión

Construir primero un Bridge Simulator sin certificado ni TPM.

Después sustituirlo por el agente real.
