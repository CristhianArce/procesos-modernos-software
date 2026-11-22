# Spec Delta

## Purpose

Deja la imagen de la app publicada y actualizada en el registro de GitHub después de cada cambio de código en `main`, para que cualquiera la ejecute sin construirla.

## ADDED Requirements

### Requirement: Publicación al fusionar en main
El CD SHALL publicar en `ghcr.io` la imagen del repositorio con las etiquetas `latest` y `sha-<commit>` cuando se fusiona en `main` un cambio que toca algo distinto de documentación, specs y evidencias (CA-5; Derivado: decisión #6).

#### Scenario: Merge que cambia código (CA-5)
- **WHEN** se fusiona en `main` un PR que modifica código, configuración o workflows
- **THEN** el CD construye la imagen, la publica con las etiquetas `latest` y `sha-<commit>` y comprueba con `docker buildx imagetools inspect` que `latest` existe

#### Scenario: Merge que solo toca documentación (CA-5)
- **WHEN** se fusiona en `main` un PR que solo modifica archivos de `docs/`, `openspec/`, `evidencias/` o `AGENTS_LOG.md`
- **THEN** el CD no se ejecuta y la imagen publicada no cambia

### Requirement: Imagen pública y ejecutable
La imagen publicada SHALL poder consultarse y descargarse sin iniciar sesión en `ghcr.io`, y SHALL arrancar con las variables `DATABASE_URL`, `SESSION_SECRET` y `METRICS_TOKEN` y responder 200 en `/api/health` (CA-6; Derivado: decisión #7).

#### Scenario: Consulta sin credenciales (CA-6)
- **WHEN** alguien consulta el manifiesto de `latest` sin iniciar sesión en `ghcr.io`
- **THEN** el registro responde con el manifiesto de la imagen

#### Scenario: Ejecución de la imagen publicada (CA-6)
- **WHEN** se ejecuta `ghcr.io/danielfms/procesos-modernos-software:latest` con las tres variables definidas
- **THEN** `GET /api/health` responde 200 con `status` igual a `ok`

### Requirement: Permisos mínimos del CD
El CD SHALL tener permiso de escritura de paquetes solo en el job que publica, y el resto del workflow MUST tener permiso de solo lectura (Derivado: decisión #6).

#### Scenario: Permisos del workflow (CA-5)
- **WHEN** se revisa `cd.yml`
- **THEN** los permisos del workflow son `contents: read` y `packages: write` aparece solo en el job que publica
