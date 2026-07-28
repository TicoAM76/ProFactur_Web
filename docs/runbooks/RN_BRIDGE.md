# Runbook — Operación de RN Bridge

## Estado

**BORRADOR / PLANIFICADO**

## Instalación

1. Verificar Windows 11.
2. Verificar TPM.
3. Instalar servicio.
4. Instalar aplicación de bandeja.
5. Generar clave.
6. Obtener código de pairing.
7. Emparejar.
8. Seleccionar certificado.
9. Probar heartbeat.
10. Probar trabajo simulado.

## Diagnóstico

Comprobar:

- servicio activo;
- versión;
- dispositivo ACTIVE;
- licencia activa;
- heartbeat;
- certificado presente;
- certificado vigente;
- cola pendiente;
- último error;
- reloj del sistema.

## Cambio de equipo

1. Revocar anterior.
2. Marcar REPLACED.
3. Generar pairing nuevo.
4. Instalar en nuevo PC.
5. Emparejar.
6. Seleccionar certificado.
7. Probar trabajo.
8. Confirmar anterior deshabilitado.

## Equipo perdido

1. Revocar dispositivo.
2. Invalidar challenges.
3. Cerrar sesiones.
4. Informar al cliente sobre certificado.
5. Registrar incidente.
6. Activar reemplazo.

## Actualización

1. Verificar firma del paquete.
2. Verificar hash.
3. Descargar.
4. Detener servicio.
5. Instalar.
6. Reiniciar.
7. Confirmar heartbeat.
8. Registrar versión.

## Errores frecuentes

- Certificado ausente.
- Certificado caducado.
- TPM no disponible.
- Clave local dañada.
- Agent version unsupported.
- Lease expired.
- Request hash mismatch.
- Timeout AEAT.
- SOAP Fault.
