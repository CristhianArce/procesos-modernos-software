# Spec Delta

## Purpose

Mantiene una instancia pública de la app, en un servicio gratuito, que ejecuta siempre la última imagen publicada por el CD, sin guardar secretos en el repositorio y sin pasos manuales después de cada merge.

## ADDED Requirements

### Requirement: Servicio público con la imagen publicada
El despliegue SHALL ejecutar en un servicio público la imagen que publica el CD, y `GET /api/health` MUST responder 200 en la URL pública del servicio (CA-8; Derivado: decisión #12).

#### Scenario: Salud en la URL pública (CA-8)
- **WHEN** se hace `GET /api/health` sin sesión ni token a la URL pública del servicio
- **THEN** recibe 200 con `status` igual a `ok`

#### Scenario: Páginas sin sesión (CA-8)
- **WHEN** se abre una página del tablero en la URL pública sin sesión
- **THEN** el servicio redirige a `/login`, igual que en local

### Requirement: Aviso a Render desde el CD
El CD SHALL avisar al servicio de Render, con su deploy hook, después de publicar la imagen, y SHALL omitir el aviso cuando el secreto del repositorio `RENDER_DEPLOY_HOOK_URL` no existe; si Render rechaza el aviso, el CD MUST terminar en rojo (CA-8; Derivado: decisión #12).

#### Scenario: Imagen nueva con el secreto configurado (CA-8)
- **WHEN** el CD publica una imagen nueva y el secreto `RENDER_DEPLOY_HOOK_URL` existe
- **THEN** el paso `Avisar a Render` llama al deploy hook, termina en verde y Render vuelve a descargar `latest`

#### Scenario: Sin secreto (CA-8)
- **WHEN** el CD corre y el secreto `RENDER_DEPLOY_HOOK_URL` no existe
- **THEN** el paso `Avisar a Render` se omite y el CD termina en verde

#### Scenario: Render rechaza el aviso (CA-8)
- **WHEN** el deploy hook responde con un código de error
- **THEN** el paso `Avisar a Render` falla y el CD termina en rojo

### Requirement: Secretos del servicio fuera del repositorio
`render.yaml` SHALL pedir a Render que genere los valores de `SESSION_SECRET` y `METRICS_TOKEN`, y el repositorio MUST NOT contener sus valores ni la URL del deploy hook (CA-8; Derivado: decisión #12).

#### Scenario: Revisión de `render.yaml` (CA-8)
- **WHEN** se revisa `render.yaml`
- **THEN** `SESSION_SECRET` y `METRICS_TOKEN` usan `generateValue: true` y ningún campo contiene un valor secreto ni la URL del deploy hook
