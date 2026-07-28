# Contrato técnico Cloud ↔ Bridge v1

## Estado

**BORRADOR / PLANIFICADO**

Este documento define el protocolo inicial. No está implementado todavía.

---

## 1. Principios

- Solo HTTPS.
- Solo conexiones salientes desde Bridge.
- Todas las solicitudes de Bridge deben ir firmadas.
- Nonce de un solo uso.
- Timestamp reciente.
- Body hash obligatorio.
- Dispositivo activo.
- Licencia activa.
- Empresa correcta.
- Versión mínima del agente.
- Ningún secreto fiscal en Cloud.

---

## 2. Headers firmados

```text
X-FacturTaller-Device-Id
X-FacturTaller-Timestamp
X-FacturTaller-Nonce
X-FacturTaller-Body-SHA256
X-FacturTaller-Signature
X-FacturTaller-Agent-Version
```

La firma cubrirá:

```text
HTTP_METHOD
REQUEST_PATH
TIMESTAMP
NONCE
BODY_SHA256
DEVICE_ID
```

---

## 3. Pairing

### Solicitar código

```http
POST /api/bridge/pairing-codes
```

Solo usuario administrador.

Respuesta:

```json
{
  "pairingCode": "ABCD-EFGH",
  "expiresAt": "2026-07-26T12:00:00Z",
  "companyId": "uuid"
}
```

### Completar pairing

```http
POST /api/bridge/pair
```

Body:

```json
{
  "pairingCode": "ABCD-EFGH",
  "publicKey": "base64",
  "publicKeyFingerprint": "sha256",
  "deviceName": "PC-RECEPCION",
  "osName": "Windows",
  "osVersion": "11",
  "agentVersion": "0.1.0",
  "tpmBacked": true
}
```

Respuesta:

```json
{
  "deviceId": "uuid",
  "companyId": "uuid",
  "installationNumber": "1",
  "status": "ACTIVE"
}
```

---

## 4. Heartbeat

```http
POST /api/bridge/heartbeat
```

Body:

```json
{
  "certificatePresent": true,
  "certificateThumbprint": "hex",
  "certificateValidTo": "2027-05-20T00:00:00Z",
  "tpmAvailable": true,
  "pendingJobs": 0,
  "lastError": null
}
```

Respuesta:

```json
{
  "serverTime": "2026-07-26T12:00:00Z",
  "deviceStatus": "ACTIVE",
  "minimumAgentVersion": "0.1.0",
  "pollAfterSeconds": 20,
  "pendingJobs": 1
}
```

---

## 5. Consultar trabajos

```http
GET /api/bridge/jobs
```

Respuesta:

```json
{
  "jobs": [
    {
      "submissionId": "uuid",
      "companyId": "uuid",
      "environment": "TEST",
      "requestHash": "sha256",
      "createdAt": "2026-07-26T12:00:00Z"
    }
  ]
}
```

---

## 6. Reclamar trabajo

```http
POST /api/bridge/jobs/{submissionId}/claim
```

Respuesta:

```json
{
  "submissionId": "uuid",
  "leaseId": "uuid",
  "leaseExpiresAt": "2026-07-26T12:02:00Z",
  "endpoint": "https://...",
  "requestXml": "<soapenv:Envelope>...</soapenv:Envelope>",
  "requestHash": "sha256"
}
```

Reglas:

- Solo un dispositivo autorizado.
- Un trabajo no puede tener dos leases activos.
- El dispositivo debe verificar el hash.
- La respuesta debe incluir `leaseId`.

---

## 7. Renovar lease

```http
POST /api/bridge/jobs/{submissionId}/lease/renew
```

Body:

```json
{
  "leaseId": "uuid"
}
```

---

## 8. Devolver resultado

```http
POST /api/bridge/jobs/{submissionId}/result
```

Body:

```json
{
  "leaseId": "uuid",
  "requestHash": "sha256",
  "httpStatus": 200,
  "responseXml": "<soapenv:Envelope>...</soapenv:Envelope>",
  "durationMs": 840,
  "certificateFingerprint": "hex",
  "agentVersion": "0.1.0",
  "transportError": null
}
```

Cloud debe:

1. Verificar firma del dispositivo.
2. Verificar lease.
3. Verificar hash.
4. Verificar empresa.
5. Parsear el XML por sí mismo.
6. Actualizar `FiscalSubmission`.
7. Actualizar `FiscalSubmissionItem`.
8. Actualizar `FiscalRecord`.

Bridge no decide el estado final.

---

## 9. Devolver error de transporte

```http
POST /api/bridge/jobs/{submissionId}/transport-error
```

Body:

```json
{
  "leaseId": "uuid",
  "requestHash": "sha256",
  "errorType": "TIMEOUT",
  "message": "Connection timed out",
  "durationMs": 30000,
  "certificateFingerprint": "hex"
}
```

Cloud decide:

- `TRANSPORT_ERROR`
- `nextRetryAt`
- nuevo intento
- alerta

---

## 10. Challenge de operación sensible

```http
POST /api/device-challenges
```

Body:

```json
{
  "companyId": "uuid",
  "action": "ISSUE_INVOICE",
  "resourceId": "draft-uuid"
}
```

Respuesta:

```json
{
  "challengeId": "uuid",
  "nonce": "base64",
  "expiresAt": "2026-07-26T12:01:00Z"
}
```

Bridge firma:

```text
challengeId
nonce
companyId
action
resourceId
expiresAt
```

---

## 11. Códigos de error

```text
DEVICE_NOT_FOUND
DEVICE_NOT_ACTIVE
LICENSE_INACTIVE
SIGNATURE_INVALID
NONCE_REUSED
TIMESTAMP_OUT_OF_RANGE
AGENT_VERSION_UNSUPPORTED
PAIRING_CODE_INVALID
PAIRING_CODE_EXPIRED
JOB_NOT_FOUND
JOB_ALREADY_CLAIMED
LEASE_INVALID
LEASE_EXPIRED
REQUEST_HASH_MISMATCH
CERTIFICATE_MISSING
CERTIFICATE_EXPIRED
```

---

## 12. Reglas de reintento

- No reenviar automáticamente si el XML cambió.
- Conservar cada intento.
- Reintentar transport errors.
- No reintentar ciegamente SOAP Fault de cliente.
- Tratar duplicados según respuesta AEAT.
- Mantener el mismo registro fiscal.
- Crear nuevo `FiscalSubmissionItem` por intento.

---

## 13. Compatibilidad

Toda solicitud debe incluir versión del agente.

Cloud podrá responder:

```text
426 UPGRADE_REQUIRED
```

cuando la versión sea incompatible.

---

## 14. Auditoría

Registrar:

- deviceId;
- companyId;
- userId cuando aplique;
- action;
- timestamp;
- request hash;
- response hash;
- IP hasheada;
- versión del agente;
- resultado;
- motivo de error.

No registrar secretos.
