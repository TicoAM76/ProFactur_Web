# Plan de migración de marca

## Objetivo inmediato

Presentar la solución bajo esta identidad:

- RN Soluciones Digitales;
- FacturTaller;
- RN Business Core;
- RN Bridge.

## Alcance para la reunión

Este rebranding modifica:

- textos visibles del frontend;
- títulos y metadatos;
- PDF y verificador;
- comentarios y documentación textual;
- referencias públicas a la marca anterior.

## Identificadores técnicos conservados temporalmente

Por compatibilidad se conservan:

- repositorio ProFactur_Web;
- carpeta local ProFactur_Web;
- rutas /opt/profactur y /opt/profactur-demo;
- contenedores profactur-*;
- redes y volúmenes Docker existentes;
- variables PROFACTUR_*;
- nombres internos de base de datos;
- historial y etiquetas Git.

Estos identificadores no representan la marca pública.

## Razón

Renombrarlos antes de la reunión aumentaría el riesgo de:

- caída del entorno DEMO;
- recreación accidental de volúmenes;
- errores en Docker Compose;
- variables no cargadas;
- rotura de scripts;
- divergencia entre local y VPS.

## Fase posterior

Después de validar la sociedad y el nombre:

1. registrar dominios;
2. crear demo-facturtaller.mnservicios.es;
3. emitir certificado HTTPS;
4. actualizar la URL pública del QR;
5. mantener el dominio anterior como redirección temporal;
6. migrar contenedores y variables en otra versión;
7. decidir si se renombra el repositorio;
8. conservar alias de compatibilidad durante la transición.