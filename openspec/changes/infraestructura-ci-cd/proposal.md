# Proposal

## Why

La app base (HU 1b, #2) compila y pasa sus pruebas, pero no hay forma de levantarla con su base de datos, ni un pipeline que avise cuando una historia rompe algo, ni una imagen publicada que cualquiera pueda ejecutar. Sin eso el orquestador no tiene dónde correr `build-test` contra una BD y las historias 3 a 10 no se pueden integrar con confianza. Esta historia (issue #18, HU 2) deja el entorno local, un CI ligero, el CD que publica la imagen y las plantillas y etiquetas del repositorio.

## What Changes

- `Dockerfile` multi-etapa y `docker-compose.yml` con `db`, `flyway` y `app`, con healthchecks, puertos efímeros y variables obligatorias; migración de línea base `V202611211900__linea_base.sql`. Cubre CA-1 y CA-2.
- `.github/workflows/ci.yml` ampliado: job `proyecto` (lint, typecheck, pruebas y build) y job `imagen` (construye y arranca la imagen) en cada PR; job `seguridad` (gitleaks y `npm audit`) solo al fusionar en `main`. Cubre CA-3 y CA-4.
- `.github/workflows/cd.yml`: al fusionar en `main` publica `ghcr.io/danielfms/procesos-modernos-software` con las etiquetas `latest` y `sha-<commit>`; los merges que solo tocan documentación no publican. Cubre CA-5 y CA-6.
- Plantillas de historia y de PR, `CODEOWNERS` y las etiquetas del repositorio (`bloqueado`, `migracion`, `revision-especializada`, `escalado`, `linea-base`, `clase`). Cubre CA-7.

Fuera de alcance (issue #18):
- despliegue en un entorno público;
- tablas de dominio, semilla de datos y login (HU 3 a 5);
- configuración de IA (HU 1a) y app base (HU 1b).

Diferido por decisión del equipo (ver `design.md`): CodeQL, Postgres de servicio y Flyway en el CI, y la protección de `main`.

## Capabilities

### New Capabilities
- `entorno-local`: levantar la base de datos, aplicar las migraciones y arrancar la app con `docker compose` desde un clon limpio, con puertos que no chocan entre entornos.
- `integracion-continua`: validación automática de cada PR (calidad del proyecto y arranque de la imagen) y controles de seguridad al fusionar en `main`.
- `publicacion-imagen`: publicación de la imagen en `ghcr.io` al fusionar en `main`, accesible sin credenciales.
- `plantillas-y-etiquetas`: plantillas de historia y de PR, revisores por defecto y etiquetas que usan el flujo y el orquestador.

### Modified Capabilities
- Ninguna. `openspec/specs/` está vacío.

## Impact

- Archivos nuevos: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `db/migration/V202611211900__linea_base.sql`, `public/.gitkeep`, `.github/workflows/cd.yml`, `.github/ISSUE_TEMPLATE/historia.md`, `.github/PULL_REQUEST_TEMPLATE.md` y `.github/CODEOWNERS`.
- Archivos modificados: `.github/workflows/ci.yml` y `README.md` (insignia del CI y pasos de arranque).
- Sin dependencias nuevas de npm. El servicio `flyway` usa la imagen `flyway/flyway:11` y `db` usa `postgres:17-alpine`.
- Habilita a las HU 3 a 5 (migraciones, semilla y pruebas con BD) y a la demo con `docker compose` sobre la imagen publicada.
