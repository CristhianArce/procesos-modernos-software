# Spec Delta

## Purpose

Permite a un usuario autenticado consultar el histórico de lecturas de los sensores, paginado y filtrado por nodo, sensor y rango de fechas, para analizar el comportamiento de un sensor fuera del tablero.

## ADDED Requirements

### Requirement: Histórico paginado de lecturas (CA-1)
El sistema SHALL devolver las lecturas de 25 en 25, de la más reciente a la más antigua por fecha de toma. Las lecturas con la misma fecha MUST ordenarse por identificador descendente (Derivado: decisión #3). La respuesta SHALL incluir la página, el tamaño de página y el total de lecturas que cumplen los filtros.

#### Scenario: Primera página con la más reciente primero (CA-1)
- **WHEN** un usuario con sesión consulta el histórico sin filtros y hay más de 25 lecturas
- **THEN** recibe 25 lecturas ordenadas de la más reciente a la más antigua, con `pagina` 1, `tamano` 25 y el `total`

#### Scenario: Segunda página (CA-1)
- **WHEN** hay 26 lecturas que cumplen los filtros y el usuario pide la página 2
- **THEN** recibe exactamente 1 lectura, la más antigua

#### Scenario: Desempate por identificador (CA-1)
- **WHEN** dos lecturas tienen la misma fecha de toma
- **THEN** aparece primero la de identificador mayor (Derivado: decisión #3)

### Requirement: Filtros por nodo, sensor y rango de fechas (CA-2)
El sistema SHALL aceptar filtros opcionales por identificador de nodo, por identificador de sensor y por rango de fechas, y MUST devolver solo las lecturas que cumplen todos los filtros indicados. El rango SHALL incluir la fecha inicial y excluir la final (Derivado: decisión #1).

#### Scenario: Filtro por nodo (CA-2)
- **WHEN** el usuario filtra por el identificador de un nodo
- **THEN** solo aparecen lecturas de los sensores de ese nodo

#### Scenario: Filtro por sensor (CA-2)
- **WHEN** el usuario filtra por el identificador de un sensor
- **THEN** solo aparecen lecturas de ese sensor

#### Scenario: Filtros combinados (CA-2)
- **WHEN** el usuario indica nodo, sensor y rango de fechas a la vez
- **THEN** solo aparecen las lecturas que cumplen las tres condiciones

#### Scenario: Extremos del rango (CA-2)
- **WHEN** existen lecturas con fecha exactamente igual a `desde` y a `hasta`
- **THEN** la de `desde` aparece y la de `hasta` no (Derivado: decisión #1)

### Requirement: Lista vacía sin coincidencias (CA-3)
Cuando ninguna lectura cumple los filtros, el sistema SHALL responder 200 con la lista vacía y total 0, y la página SHALL mostrar el estado vacío.

#### Scenario: Filtro sin resultados (CA-3)
- **WHEN** el usuario filtra por un sensor sin lecturas
- **THEN** la API responde 200 con `items` vacío y `total` 0

### Requirement: Validación de los filtros (CA-4)
El sistema MUST validar los parámetros con Zod y responder 400 si una fecha no es ISO 8601 con hora en UTC (Derivado: decisión #2), si un identificador no es un UUID, si la página no es un entero positivo, o si la fecha inicial es posterior a la final.

#### Scenario: Fecha mal formada (CA-4)
- **WHEN** el usuario consulta con `desde=ayer`
- **THEN** la API responde 400 en JSON

#### Scenario: Rango invertido (CA-4)
- **WHEN** el usuario consulta con `desde` posterior a `hasta`
- **THEN** la API responde 400 en JSON

### Requirement: Acceso con sesión (CA-5)
La API del histórico SHALL exigir una sesión de administrador o técnico y MUST responder 401 en JSON, sin redirigir, a un visitante sin sesión.

#### Scenario: Visitante sin sesión (CA-5)
- **WHEN** un visitante sin sesión consulta `GET /api/historico`
- **THEN** recibe 401 en JSON y ninguna lectura

### Requirement: Página del histórico (CA-1, CA-2, CA-3)
El sistema SHALL ofrecer la página `/historico`, con un ítem de menú para ambos roles, un formulario de filtros por nodo, sensor y fechas, la tabla de lecturas con su paginación, y los estados de carga, error y vacío.

#### Scenario: Ver la primera página (CA-1)
- **WHEN** un usuario con sesión abre `/historico`
- **THEN** ve la tabla con las 25 lecturas más recientes y los controles de página

#### Scenario: Aplicar un filtro sin resultados (CA-3)
- **WHEN** el usuario aplica un filtro sin coincidencias
- **THEN** la página muestra el estado vacío
