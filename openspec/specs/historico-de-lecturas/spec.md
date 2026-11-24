# historico-de-lecturas Specification

## Purpose

Permite que cualquier usuario con sesión consulte el histórico de lecturas de la red, paginado y con filtros por nodo, sensor y rango de fechas, para analizar el comportamiento de un sensor fuera del dashboard. Solo lectura: no escribe ninguna tabla.

## Requirements

### Requirement: Consulta paginada del histórico

`GET /api/historico` SHALL responder 200 a un usuario con sesión con `{ pagina, porPagina, total, totalPaginas, lecturas }`: como máximo 25 lecturas, la más reciente primero (CA-1; RN-2; Derivado: decisión #5). Cada lectura MUST traer nodo, sensor, voltaje, corriente, potencia y `tomadaEn` en ISO 8601 (CA-1; Derivado: decisión #3, #7). La consulta MUST NOT escribir ninguna tabla (CA-1; RN-1).

#### Scenario: Primera página (CA-1)

- **WHEN** un usuario con sesión consulta el histórico sin filtros y hay más de 25 lecturas
- **THEN** la API responde 200 con 25 lecturas, la de `tomadaEn` más reciente primero, `pagina` 1, `porPagina` 25 y el `total` de lecturas

#### Scenario: Página siguiente (CA-1)

- **WHEN** se consulta `pagina=2` de un filtro con 26 lecturas
- **THEN** la API responde con la lectura número 26, la más antigua, y `totalPaginas` 2

#### Scenario: Página posterior a la última (CA-1)

- **WHEN** se consulta una página mayor que `totalPaginas`
- **THEN** la API responde 200 con `lecturas` vacía y el mismo `total` (Derivado: decisión #5)

#### Scenario: Técnico y administrador (CA-1)

- **WHEN** un técnico y un administrador consultan el histórico con los mismos filtros
- **THEN** ambos reciben la misma respuesta

### Requirement: Filtros combinados

El histórico SHALL filtrar por `nodoId`, `sensorId` (identificadores) y días `desde` y `hasta` (`AAAA-MM-DD`), y una lectura MUST aparecer solo si cumple todas las condiciones (CA-2; RN-3). Los días se interpretan en la hora de Bogotá e incluyen ambos extremos (CA-2; Derivado: decisión #1, #2, #3). Un parámetro vacío equivale a no filtrar por él (CA-2; Derivado: decisión #8).

#### Scenario: Filtro por nodo, sensor y fechas (CA-2)

- **WHEN** se filtra por un nodo, uno de sus sensores y un rango de días
- **THEN** solo aparecen lecturas de ese sensor, de ese nodo, tomadas entre las 00:00 de `desde` y el final de `hasta` en la hora de Bogotá

#### Scenario: Borde del día en la hora de Bogotá (CA-2)

- **WHEN** una lectura se tomó a las 23:30 de Bogotá del día anterior a `desde`, ya en `desde` según UTC
- **THEN** esa lectura no aparece (Derivado: decisión #3)

#### Scenario: Un solo día (CA-2)

- **WHEN** `desde` y `hasta` son el mismo día
- **THEN** aparecen solo las lecturas de ese día (Derivado: decisión #2)

### Requirement: Filtro sin resultados

Un filtro que no coincide con ninguna lectura SHALL responder 200 con `lecturas` vacía y `total` 0, también cuando el nodo o el sensor no existen o el sensor no es del nodo filtrado (CA-3; Derivado: decisión #4).

#### Scenario: Rango sin lecturas (CA-3)

- **WHEN** se filtra por un rango de días sin lecturas
- **THEN** la API responde 200 con `lecturas` vacía, `total` 0 y `totalPaginas` 0

#### Scenario: Identificador que no existe (CA-3)

- **WHEN** se filtra por un `nodoId` o `sensorId` bien formado que no existe, o por un sensor de otro nodo
- **THEN** la API responde 200 con `lecturas` vacía (Derivado: decisión #4)

### Requirement: Validación de los filtros

La API MUST responder 400 con los detalles de Zod si `desde` o `hasta` no son una fecha `AAAA-MM-DD` válida, si `desde` es posterior a `hasta`, si `nodoId` o `sensorId` no son UUID o si `pagina` no es un entero mayor o igual a 1 (CA-4; Derivado: decisión #2, #5).

#### Scenario: Fecha mal formada (CA-4)

- **WHEN** se consulta con `desde=2026-13-40` o `hasta=ayer`
- **THEN** la API responde 400 con `detalles`

#### Scenario: Rango invertido (CA-4)

- **WHEN** se consulta con `desde` posterior a `hasta`
- **THEN** la API responde 400 con `detalles`

#### Scenario: Página o identificador inválido (CA-4)

- **WHEN** se consulta con `pagina=0`, `pagina=abc` o un `nodoId` que no es UUID
- **THEN** la API responde 400 con `detalles` (Derivado: decisión #5)

### Requirement: Acceso con sesión

`GET /api/historico` MUST responder 401 en JSON sin sesión (CA-5).

#### Scenario: Visitante sin sesión (CA-5)

- **WHEN** un visitante sin sesión consulta `GET /api/historico`
- **THEN** la API responde 401 con un cuerpo JSON

### Requirement: Página del histórico

La página `/historico` SHALL mostrar el formulario de filtros, la tabla de la página actual con fechas en la hora de Bogotá, el total y enlaces de página que conservan los filtros (CA-1, CA-2; Derivado: decisión #7, #8). MUST mostrar un estado vacío sin resultados (CA-3) y un error de validación sin tabla con filtros inválidos (CA-4). El menú SHALL incluir «Histórico» para ambos roles (CA-1; Derivado: decisión #9).

#### Scenario: Recorrido de filtros y páginas (CA-1, CA-2)

- **WHEN** un usuario filtra por el nodo y el sensor de la semilla del histórico y su rango de días
- **THEN** la primera página muestra 25 lecturas, la más reciente primero, y la segunda la lectura restante

#### Scenario: Sin resultados en la página (CA-3)

- **WHEN** el filtro no coincide con ninguna lectura
- **THEN** la página muestra el estado vacío y no muestra la tabla

#### Scenario: Filtros inválidos en la página (CA-4)

- **WHEN** la página se abre con `desde` posterior a `hasta`
- **THEN** muestra el mensaje de filtros inválidos y no muestra la tabla

#### Scenario: Entrada del menú (CA-1)

- **WHEN** se filtra el menú para un administrador y para un técnico
- **THEN** ambos ven «Histórico»
