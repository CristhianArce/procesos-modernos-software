# entorno-local Specification

## Purpose

Permite que cualquier integrante levante la base de datos, aplique las migraciones y arranque la app en su portátil con `docker compose`, con un error claro si falta configuración y sin que varios entornos se pisen los puertos.

## Requirements

### Requirement: Arranque local completo
El entorno local SHALL levantar la base de datos, aplicar las migraciones con Flyway, cargar la semilla y arrancar la app, dejando `db` y `app` en estado sano y `GET /api/health` respondiendo 200 en el puerto que asigna `docker compose port` (CA-1; Derivado: decisión #3).

#### Scenario: Arranque en un clon limpio (CA-1)
- **WHEN** se copia `.env.example` a `.env` con valores locales y se ejecutan en orden `docker compose up -d --wait db`, `docker compose run --rm flyway migrate info`, `npm run seed` y `docker compose up -d --build --wait app`
- **THEN** `db` y `app` quedan sanos, `migrate info` muestra la migración de línea base aplicada y `GET /api/health` responde 200 en el puerto que devuelve `docker compose port app 3000`

### Requirement: Variables obligatorias
El entorno local SHALL fallar antes de arrancar cuando falta una variable obligatoria, con un mensaje que nombra la variable (CA-2; Derivado: decisión #2).

#### Scenario: Sin archivo `.env` (CA-2)
- **WHEN** se ejecuta `docker compose config` sin archivo `.env`
- **THEN** el comando termina con error y el mensaje nombra la primera variable obligatoria que falta

#### Scenario: Falta una variable (CA-2)
- **WHEN** el `.env` define todas las variables salvo `SESSION_SECRET` y se ejecuta `docker compose config`
- **THEN** el comando termina con error y el mensaje nombra `SESSION_SECRET`

### Requirement: Puertos del host que no chocan
Los servicios `db` y `app` SHALL publicar su puerto sin fijar el del host, para que varios entornos corran a la vez (Derivado: decisión #2).

#### Scenario: Dos entornos a la vez (CA-1)
- **WHEN** se levantan dos copias del entorno con distinto `COMPOSE_PROJECT_NAME`
- **THEN** ambas arrancan sin conflicto de puertos y `docker compose port` devuelve un puerto distinto en cada una
