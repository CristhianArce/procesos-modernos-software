# Spec Delta

## Purpose

Permite a un usuario autenticado consultar el histórico de lecturas de la red, paginado de 25 en 25 con la más reciente primero y filtrado por nodo, sensor y rango de fechas, tanto por la API como por la página `/historico`, sin modificar ninguna lectura.

## ADDED Requirements

### Requirement: Lecturas paginadas, la más reciente primero
`GET /api/historico` SHALL responder 200 con `{ items, pagina, porPagina, total }`: `items` con como máximo 25 lecturas, ordenadas por fecha descendente y, a igual fecha, por identificador descendente. `pagina` MUST ser un entero mayor o igual que 1 (1 por defecto) y una página más allá del final SHALL devolver `items` vacío con el `total` real (CA-1; Derivado: decisión #3, #4, #5).

#### Scenario: Primera página de 25 (CA-1)
- **WHEN** un usuario con sesión abre el histórico y hay 26 lecturas
- **THEN** ve 25 lecturas ordenadas de la más reciente a la más antigua y un total de 26

#### Scenario: Segunda página (CA-1)
- **WHEN** el mismo usuario pide la página 2
- **THEN** ve la lectura restante, la más antigua

#### Scenario: Lecturas con la misma fecha (CA-1)
- **WHEN** dos lecturas tienen exactamente la misma fecha
- **THEN** la de identificador mayor aparece antes, y el orden no cambia entre páginas

### Requirement: Página del histórico
La página `/historico` SHALL mostrar las mismas lecturas que la API, con nodo, sensor, voltaje, corriente, potencia y fecha, y enlaces a la página anterior y a la siguiente. La consulta MUST solo leer `lecturas` (con `sensores` y `nodos` para los nombres) y no modificar ninguna tabla (CA-1; Derivado: decisión #4, #7).

#### Scenario: Tabla y paginador (CA-1)
- **WHEN** un usuario con sesión abre `/historico` y hay 26 lecturas
- **THEN** la página muestra 25 filas con sus nodo, sensor y magnitudes, "Página 1 de 2" y el enlace "Siguiente"

#### Scenario: La consulta no modifica datos (CA-1)
- **WHEN** se consulta el histórico
- **THEN** las tablas `lecturas`, `sensores` y `nodos` quedan sin cambios

### Requirement: Filtros por nodo, sensor y rango de fechas
La consulta SHALL aceptar `nodoId` y `sensorId` (UUID, el identificador y no el nombre), y `desde` y `hasta` (ISO 8601 con fecha y hora en UTC, ambos extremos inclusivos), todos opcionales. Con varios filtros MUST devolver solo las lecturas que cumplen todas las condiciones. La página SHALL ofrecer un formulario con esos filtros que conserva los valores aplicados al paginar (CA-2; Derivado: decisión #1, #2, #6, #7).

#### Scenario: Filtro por nodo (CA-2)
- **WHEN** se consulta con `nodoId` de un nodo con lecturas de varios sensores
- **THEN** aparecen solo las lecturas de los sensores de ese nodo

#### Scenario: Filtro por sensor (CA-2)
- **WHEN** se consulta con `sensorId`
- **THEN** aparecen solo las lecturas de ese sensor

#### Scenario: Rango de fechas con extremos inclusivos (CA-2)
- **WHEN** se consulta con `desde` y `hasta` iguales a las fechas de dos lecturas
- **THEN** aparecen esas dos lecturas y las que están entre ambas, y no las de fuera del rango

#### Scenario: Todas las condiciones a la vez (CA-2)
- **WHEN** se consulta con nodo, sensor y rango de fechas
- **THEN** aparecen solo las lecturas que cumplen las tres condiciones

### Requirement: Filtro sin resultados
Si ninguna lectura cumple los filtros, la API SHALL responder 200 con `items` vacío y `total` 0, y la página MUST mostrar un estado vacío con texto. Un nodo o sensor que no existe, o un sensor de otro nodo, SHALL dar lista vacía y no 404 (CA-3; Derivado: decisión #6).

#### Scenario: Filtros sin coincidencias (CA-3)
- **WHEN** se consulta con un rango de fechas sin lecturas
- **THEN** la API responde 200 con `items` vacío y `total` 0

#### Scenario: Estado vacío en la página (CA-3)
- **WHEN** un usuario aplica un filtro sin resultados en `/historico`
- **THEN** la página muestra "Sin lecturas" en lugar de la tabla

#### Scenario: Sensor de otro nodo (CA-3)
- **WHEN** se consulta con un `nodoId` y el `sensorId` de un sensor que pertenece a otro nodo
- **THEN** la lista está vacía

### Requirement: Validación de los filtros
La API MUST validar con Zod `nodoId` y `sensorId` (UUID), `desde` y `hasta` (ISO 8601 en UTC con fecha y hora) y `pagina` (entero mayor o igual que 1), y SHALL responder 400 con el detalle de cada campo cuando una fecha esté mal formada o `desde` sea posterior a `hasta`. Con una fecha inicial igual a la final MUST responder 200. La página `/historico` SHALL mostrar el error de validación con `EstadoError`, sin consultar (CA-4; Derivado: decisión #2, #7).

#### Scenario: Fecha mal formada (CA-4)
- **WHEN** un usuario con sesión consulta con `desde=ayer`
- **THEN** la API responde 400 con el detalle de la validación de Zod

#### Scenario: Rango invertido (CA-4)
- **WHEN** un usuario con sesión consulta con `desde` posterior a `hasta`
- **THEN** la API responde 400 con el detalle de la validación de Zod

#### Scenario: Identificador o página inválidos (CA-4)
- **WHEN** un usuario con sesión consulta con `nodoId` que no es un UUID o con `pagina` 0
- **THEN** la API responde 400 con el detalle de la validación de Zod

### Requirement: Acceso al histórico con sesión
`GET /api/historico` SHALL exigir sesión de administrador o técnico y MUST responder 401 con un cuerpo JSON sin sesión, sin consultar la base. La página `/historico` y su entrada "Histórico" del menú SHALL estar disponibles para ambos roles y, sin sesión, la página lleva al login según `acceso-tablero` (CA-5; Derivado: decisión #8, #10).

#### Scenario: Visitante sin sesión (CA-5)
- **WHEN** un visitante sin sesión consulta `GET /api/historico`
- **THEN** la API responde 401 con un cuerpo JSON

#### Scenario: Técnico con sesión (CA-1)
- **WHEN** un técnico con sesión consulta `GET /api/historico`
- **THEN** la API responde 200 con la primera página

#### Scenario: Entrada de menú (CA-1)
- **WHEN** un administrador o un técnico abre el tablero
- **THEN** el menú incluye "Histórico" con destino `/historico`
