## Purpose

Permite que un administrador asigne un técnico a cada nodo de la red, desde la ficha del nodo o por la API, para saber quién responde por él. Un nodo tiene como máximo un técnico asignado y asignar otro reemplaza al anterior. Administradores y técnicos ven en la ficha quién es el técnico asignado; solo el administrador puede cambiarlo.

## ADDED Requirements

### Requirement: Asignar un técnico a un nodo
La API SHALL asignar a un nodo el técnico que indica un administrador y MUST responder 200 con el identificador del nodo y el técnico asignado (identificador y nombre de usuario). Un nodo SHALL tener como máximo un técnico asignado: asignar otro MUST reemplazar al anterior. La ficha del nodo SHALL mostrar en el panel «Técnico asignado» el nombre de usuario del técnico asignado, también al recargarla (CA-1; Derivado: decisión #1, #2, #5).

#### Scenario: Asignar un técnico por la API (CA-1)
- **WHEN** un administrador envía a `PUT /api/mantenimiento/nodos/{id}/tecnico` el identificador de un usuario con rol técnico para un nodo sin técnico
- **THEN** la API responde 200 con el identificador del nodo y el identificador y el nombre de usuario del técnico

#### Scenario: Reasignar reemplaza al técnico anterior (CA-1; Derivado: RN-3)
- **WHEN** un administrador asigna un técnico a un nodo que ya tiene otro técnico asignado
- **THEN** la API responde 200 con el técnico nuevo y el nodo queda con ese único técnico asignado

#### Scenario: El panel muestra el técnico asignado (CA-1)
- **WHEN** un administrador abre la ficha de un nodo, elige un técnico en el panel «Técnico asignado» y pulsa «Asignar»
- **THEN** el panel muestra el nombre de usuario de ese técnico sin recargar la página, y lo sigue mostrando al recargarla

#### Scenario: Nodo sin técnico (CA-1; Derivado: decisión #5)
- **WHEN** un usuario con sesión abre la ficha de un nodo sin técnico asignado
- **THEN** el panel «Técnico asignado» muestra «Sin técnico asignado»

### Requirement: Validación del usuario asignado
La API MUST responder 400 con el mensaje `El usuario no es técnico` cuando el usuario indicado existe pero no tiene rol técnico, y 404 con el mensaje `Usuario no encontrado` cuando no existe. Un cuerpo sin `tecnicoId`, con un `tecnicoId` que no es un UUID o que no es JSON MUST responder 400 con el detalle. En todos estos casos la asignación del nodo SHALL quedar como estaba (CA-2; Derivado: decisión #3).

#### Scenario: Usuario que no es técnico (CA-2)
- **WHEN** un administrador intenta asignar a un nodo un usuario con rol administrador
- **THEN** la API responde 400 con `El usuario no es técnico` y la asignación del nodo no cambia

#### Scenario: Usuario que no existe (CA-2)
- **WHEN** un administrador intenta asignar a un nodo un UUID que no corresponde a ningún usuario
- **THEN** la API responde 404 con `Usuario no encontrado` y la asignación del nodo no cambia

#### Scenario: Cuerpo inválido (CA-2; Derivado: decisión #3)
- **WHEN** un administrador envía un cuerpo sin `tecnicoId`, con un `tecnicoId` que no es un UUID o que no es JSON
- **THEN** la API responde 400 con el detalle y la asignación del nodo no cambia

### Requirement: Asignación a un nodo inexistente
La API SHALL responder 404 con el mensaje `Nodo no encontrado` cuando el identificador del nodo no corresponde a ningún nodo, incluido uno que no es un UUID, y MUST NOT crear ninguna asignación (CA-3; Derivado: decisión #3).

#### Scenario: Identificador de nodo que no existe (CA-3)
- **WHEN** un administrador asigna un técnico a un UUID que no corresponde a ningún nodo
- **THEN** la API responde 404 con `Nodo no encontrado`

#### Scenario: Identificador de nodo mal formado (CA-3)
- **WHEN** un administrador asigna un técnico a un identificador de nodo que no es un UUID
- **THEN** la API responde 404 con `Nodo no encontrado`

### Requirement: Solo el administrador asigna técnicos
La API MUST responder 403 cuando quien asigna es un técnico, aunque el cuerpo sea inválido, y 401 en JSON cuando no hay sesión; en ambos casos la asignación del nodo SHALL quedar como estaba. El panel «Técnico asignado» MUST NOT mostrar el selector de técnicos ni el botón «Asignar» a un técnico (CA-4; Derivado: decisión #3, #5).

#### Scenario: Técnico llama a la API (CA-4)
- **WHEN** un técnico envía a `PUT /api/mantenimiento/nodos/{id}/tecnico` un cuerpo válido o inválido
- **THEN** la API responde 403 y la asignación del nodo no cambia

#### Scenario: Sin sesión (CA-4)
- **WHEN** se envía una asignación sin cookie de sesión
- **THEN** la API responde 401 en JSON y la asignación del nodo no cambia

#### Scenario: Técnico abre la ficha (CA-4)
- **WHEN** un técnico abre la ficha de un nodo con técnico asignado
- **THEN** ve el técnico asignado en el panel y no ve el selector de técnicos ni el botón «Asignar»
