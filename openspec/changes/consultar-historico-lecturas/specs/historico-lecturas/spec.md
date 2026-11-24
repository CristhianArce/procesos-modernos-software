# Spec Delta

## Purpose

Permite a un usuario autenticado consultar el histórico de lecturas de la red, paginado y filtrado por nodo, sensor y rango de fechas, para analizar el comportamiento de un sensor fuera del tablero. Solo lee lecturas; no las modifica.

## ADDED Requirements

### Requirement: Histórico paginado de lecturas (CA-1)
El sistema SHALL ofrecer `GET /api/historico`, que devuelve las lecturas de 25 en 25, la más reciente primero, con el total de lecturas que cumplen el filtro y la página pedida (por defecto la 1). Las lecturas con la misma fecha MUST ordenarse por identificador descendente (Derivado: decisión #2). La consulta MUST NOT escribir ni modificar ninguna tabla (RN-1).

#### Scenario: Primera página con la más reciente primero (CA-1)
- **WHEN** un usuario con sesión consulta el histórico sin filtros y hay más de 25 lecturas
- **THEN** la respuesta trae 25 lecturas ordenadas de la más reciente a la más antigua y el total completo

#### Scenario: Segunda página (CA-1)
- **WHEN** un usuario con sesión pide la página 2 y hay 26 lecturas
- **THEN** la respuesta trae la única lectura restante, la más antigua

#### Scenario: Lecturas con la misma fecha (CA-1)
- **WHEN** dos lecturas comparten la misma fecha
- **THEN** aparece primero la de identificador mayor (Derivado: decisión #2)

#### Scenario: Ambos roles consultan (CA-1)
- **WHEN** un administrador o un técnico con sesión consulta el histórico
- **THEN** la API responde 200 (Derivado: decisión #4)

### Requirement: Filtros por nodo, sensor y rango de fechas (CA-2)
El sistema SHALL aceptar los filtros opcionales `nodoId`, `sensorId`, `desde` y `hasta`, y MUST devolver solo las lecturas que cumplen todos los filtros indicados. Los filtros por nodo y por sensor usan el identificador, no el nombre (RN-3). Los extremos del rango son inclusivos ambos (Derivado: decisión #1).

#### Scenario: Filtro por nodo (CA-2)
- **WHEN** se consulta con `nodoId`
- **THEN** solo aparecen lecturas de sensores de ese nodo

#### Scenario: Filtro por sensor (CA-2)
- **WHEN** se consulta con `sensorId`
- **THEN** solo aparecen lecturas de ese sensor

#### Scenario: Filtro por rango de fechas con extremos inclusivos (CA-2)
- **WHEN** se consulta con `desde` y `hasta`
- **THEN** aparecen las lecturas con fecha mayor o igual a `desde` y menor o igual a `hasta`, incluidas las que coinciden exactamente con un extremo (Derivado: decisión #1)

#### Scenario: Varios filtros a la vez (CA-2)
- **WHEN** se consulta con nodo, sensor y fechas
- **THEN** solo aparecen las lecturas que cumplen todas las condiciones

### Requirement: Filtro sin resultados responde lista vacía (CA-3)
Cuando ninguna lectura cumple el filtro, o la página pedida está más allá de la última, el sistema SHALL responder 200 con la lista vacía y el total real de coincidencias (Derivado: decisión #3). Un `nodoId` o `sensorId` bien formado que no existe MUST tratarse como un filtro sin resultados (Derivado: decisión #7).

#### Scenario: Filtro sin coincidencias (CA-3)
- **WHEN** se consulta con un filtro que ninguna lectura cumple
- **THEN** la respuesta es 200 con la lista vacía y total 0

#### Scenario: Página más allá de la última (CA-3)
- **WHEN** se pide una página mayor que la última existente
- **THEN** la respuesta es 200 con la lista vacía y el total real (Derivado: decisión #3)

#### Scenario: Identificador inexistente (CA-3)
- **WHEN** se consulta con un `sensorId` bien formado que no existe
- **THEN** la respuesta es 200 con la lista vacía (Derivado: decisión #7)

### Requirement: Validación de los parámetros de consulta (CA-4)
El sistema SHALL validar con Zod los parámetros de la consulta y MUST responder 400 con el detalle de cada campo cuando `desde` o `hasta` no son una fecha ISO 8601 con zona, cuando `desde` es posterior a `hasta`, o cuando `nodoId`, `sensorId` o `pagina` están mal formados (Derivado: decisión #6).

#### Scenario: Fecha mal formada (CA-4)
- **WHEN** se consulta con `desde=ayer`
- **THEN** la API responde 400 con el detalle del campo `desde`

#### Scenario: Rango invertido (CA-4)
- **WHEN** se consulta con `desde` posterior a `hasta`
- **THEN** la API responde 400

#### Scenario: Identificador o página mal formados (CA-4)
- **WHEN** se consulta con `sensorId=abc` o `pagina=0`
- **THEN** la API responde 400

### Requirement: El histórico exige sesión (CA-5)
El sistema SHALL responder 401 en JSON a toda consulta de `GET /api/historico` sin sesión válida, antes de validar los parámetros, y MUST redirigir al login la página `/historico` sin sesión.

#### Scenario: Consulta sin sesión (CA-5)
- **WHEN** un visitante sin sesión consulta `GET /api/historico`
- **THEN** recibe 401 en JSON y ninguna lectura

#### Scenario: Página sin sesión (CA-5)
- **WHEN** un visitante sin sesión abre `/historico`
- **THEN** es redirigido al login

### Requirement: Página del histórico (CA-1, CA-2, CA-3)
El sistema SHALL ofrecer la página `/historico` con un ítem de menú para ambos roles, filtros por nodo, sensor y rango de fechas, y una tabla paginada de 25 en 25 con nodo, sensor, voltaje, corriente, potencia y fecha. La página MUST resolver los estados de carga, error y vacío, y MUST mostrar el estado vacío cuando el filtro no tiene resultados.

#### Scenario: Se ve la primera página (CA-1)
- **WHEN** un usuario con sesión abre `/historico` y hay lecturas
- **THEN** ve la tabla con las 25 lecturas más recientes y los controles de página

#### Scenario: Se aplica un filtro (CA-2)
- **WHEN** el usuario elige un nodo y aplica el filtro
- **THEN** la tabla solo muestra lecturas de ese nodo, desde la página 1

#### Scenario: Filtro sin resultados (CA-3)
- **WHEN** el usuario aplica un filtro sin coincidencias
- **THEN** la página muestra el estado vacío en lugar de la tabla

#### Scenario: Falla la consulta (CA-4)
- **WHEN** la API responde un error al consultar
- **THEN** la página muestra el estado de error con la opción de reintentar
