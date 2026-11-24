## Purpose

Permite que un administrador o un técnico vea, en la ficha de un nodo y por la API, qué usuarios o dispositivos ficticios dependen de ese nodo y cuántos son, para saber a quién afecta una falla o un corte antes de actuar. Solo lectura: agregar y quitar afectados lo cubren otras historias.

## ADDED Requirements

### Requirement: Panel de afectados en la ficha del nodo

La ficha de un nodo SHALL mostrar un panel «Afectados» con el total de afectados del nodo y su lista de alias, ordenada alfabéticamente por alias y, entre alias repetidos, por su identificador (CA-1; Derivado: decisión #1). El panel MUST mostrarse tanto al administrador como al técnico (CA-2) y MUST declararse en `paneles.ts` del módulo, sin editar la página de la ficha (CA-1; Derivado: decisión #5).

#### Scenario: Nodo con afectados (CA-1)

- **WHEN** un usuario con sesión abre la ficha de un nodo que tiene afectados
- **THEN** el panel «Afectados» muestra el total de afectados del nodo
- **THEN** el panel muestra la lista de sus alias ordenada alfabéticamente (Derivado: decisión #1)

#### Scenario: Alias repetidos en un nodo (CA-1)

- **WHEN** un nodo tiene dos afectados con el mismo alias
- **THEN** la lista muestra ambos y el total los cuenta a los dos (Derivado: decisión #1)

#### Scenario: El administrador ve el panel (CA-2)

- **WHEN** un administrador abre la ficha de un nodo
- **THEN** ve el panel «Afectados» con la lista y el total

#### Scenario: El técnico ve el panel (CA-2)

- **WHEN** un técnico abre la ficha de un nodo
- **THEN** ve el panel «Afectados» con la misma lista y el mismo total que el administrador

#### Scenario: Nodo sin afectados en la ficha (CA-1, CA-3)

- **WHEN** un usuario con sesión abre la ficha de un nodo sin afectados
- **THEN** el panel muestra total 0 y un estado vacío en lugar de la lista (Derivado: decisión #5)

### Requirement: Consulta de afectados por la API

`GET /api/afectados?nodoId=<uuid>` SHALL responder 200 con `{ total, afectados: [{ id, alias }] }` al administrador y al técnico, con la lista en el mismo orden que el panel (CA-2, CA-3; Derivado: decisión #1, #4). La API MUST responder 404 si el nodo no existe y una lista vacía con total 0 si el nodo existe y no tiene afectados (CA-3). MUST responder 401 sin sesión y 400 si `nodoId` falta o no es un UUID (CA-3; Derivado: decisión #3).

#### Scenario: Consulta de un nodo con afectados (CA-2)

- **WHEN** un administrador o un técnico consulta los afectados de un nodo que tiene afectados
- **THEN** la API responde 200 con el total y la lista de `{ id, alias }` ordenada por alias

#### Scenario: Nodo inexistente (CA-3)

- **WHEN** se consultan los afectados de un UUID que no corresponde a ningún nodo
- **THEN** la API responde 404 con un error JSON

#### Scenario: Nodo existente sin afectados (CA-3)

- **WHEN** se consultan los afectados de un nodo que existe y no tiene afectados
- **THEN** la API responde 200 con `afectados` vacío y `total` 0

#### Scenario: Identificador mal formado o ausente (CA-3)

- **WHEN** se consultan los afectados con un `nodoId` que no es un UUID o sin `nodoId`
- **THEN** la API responde 400 con los detalles de validación (Derivado: decisión #3)

#### Scenario: Sin sesión (CA-2)

- **WHEN** se consultan los afectados sin sesión
- **THEN** la API responde 401 en JSON

### Requirement: Datos de un afectado

Cada afectado SHALL pertenecer a un solo nodo y tener como único dato un alias obligatorio de 1 a 80 caracteres, sin unicidad dentro del nodo (CA-1; Derivado: decisión #4). Eliminar un nodo MUST eliminar sus afectados (CA-3; Derivado: decisión #7).

#### Scenario: Afectado de un solo nodo (CA-1)

- **WHEN** se consultan los afectados de un nodo
- **THEN** la respuesta no incluye afectados de otros nodos

#### Scenario: Eliminar un nodo elimina sus afectados (CA-3)

- **WHEN** se elimina un nodo con afectados
- **THEN** el borrado no falla y no quedan filas de afectados de ese nodo (Derivado: decisión #7)
