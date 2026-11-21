## Purpose

Mostrar a los usuarios autenticados del tablero el nombre y la versión de la app, con contenido fijo en el código del módulo (RN-1), mediante una API, una página y un ítem del menú.

## ADDED Requirements

### Requirement: Consulta de la información de la app por API

El sistema SHALL responder `GET /api/acerca` con 200 y un JSON que contiene `nombre` y `version` cuando quien consulta es un usuario autenticado con rol administrador o técnico. El contenido MUST ser fijo en el código del módulo y no leerse de la BD (RN-1). (CA-1)

#### Scenario: Un administrador consulta la información (CA-1)

- **WHEN** un usuario autenticado con rol administrador consulta `GET /api/acerca`
- **THEN** recibe 200 con un JSON que contiene `nombre` y `version` no vacíos

#### Scenario: Un técnico consulta la información (CA-1)

- **WHEN** un usuario autenticado con rol técnico consulta `GET /api/acerca`
- **THEN** recibe 200 con un JSON que contiene `nombre` y `version` no vacíos

### Requirement: Rechazo de visitantes sin sesión

El sistema MUST responder `GET /api/acerca` con 401 y un JSON de error cuando la petición no trae una sesión válida, sin revelar el nombre ni la versión. (CA-3)

#### Scenario: Un visitante sin sesión consulta la información (CA-3)

- **WHEN** un visitante sin sesión consulta `GET /api/acerca`
- **THEN** recibe 401 con un JSON `{ "error": ... }` que no contiene `nombre` ni `version`

### Requirement: Ítem "Acerca de" en el menú

El módulo SHALL aportar al menú, mediante `menu.ts`, un ítem con la etiqueta "Acerca de" que lleva a `/acerca` y es visible para el rol técnico. (CA-2)

#### Scenario: El técnico ve el ítem en el menú (CA-2)

- **WHEN** un técnico autenticado abre el tablero
- **THEN** el menú incluye el ítem "Acerca de" con destino `/acerca`

### Requirement: Página "Acerca de"

El sistema SHALL mostrar en la página `/acerca` el nombre y la versión de la app, tomados del servicio del módulo. (CA-2)

#### Scenario: El técnico entra a la página (CA-2)

- **WHEN** un técnico autenticado entra a `/acerca`
- **THEN** la página muestra el nombre y la versión de la app
