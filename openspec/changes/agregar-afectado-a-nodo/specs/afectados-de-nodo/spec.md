# Spec Delta

## Purpose

Permite que un administrador registre en un nodo a los usuarios o dispositivos afectados por una falla o un corte, como alias ficticios, antes de actuar. Las asociaciones son datos del tablero: no calculan impacto eléctrico ni exigen aislar el nodo.

## ADDED Requirements

### Requirement: Agregar un afectado a un nodo
La API SHALL guardar un afectado con el alias recibido en el nodo indicado cuando un administrador lo pide, y MUST responder 201 con su identificador, el nodo, el alias y la fecha de creación. El afectado SHALL pertenecer solo a ese nodo, y el mismo alias MAY repetirse en un nodo (CA-1; Derivado: decisión #2, #3).

#### Scenario: Alta con datos válidos (CA-1)
- **WHEN** un administrador agrega un afectado con un alias válido a un nodo existente
- **THEN** la API responde 201 con el afectado y el nodo tiene un afectado más

#### Scenario: El afectado pertenece a un solo nodo (CA-1)
- **WHEN** un administrador agrega un afectado a un nodo
- **THEN** los afectados de los demás nodos no cambian

#### Scenario: Alias repetido (CA-1)
- **WHEN** un administrador agrega a un nodo un alias que ese nodo ya tiene
- **THEN** la API responde 201 y el nodo tiene los dos afectados

### Requirement: Validación del afectado
El alias MUST ser texto obligatorio que, sin los espacios de los extremos, mida de 1 a 100 caracteres, y el nodo MUST ser un UUID. Un alias vacío, de solo espacios, de más de 100 caracteres o que falta, un `nodoId` ausente o mal formado, o un cuerpo que no es JSON responden 400 con el detalle de Zod y no guardan nada (CA-2; Derivado: decisión #1).

#### Scenario: Datos inválidos (CA-2)
- **WHEN** un administrador envía un alias vacío, de solo espacios, de 101 caracteres o sin alias, un `nodoId` que no es UUID o un cuerpo que no es JSON
- **THEN** la API responde 400 con el detalle y el nodo no tiene afectados nuevos

#### Scenario: Se recortan los espacios del alias (CA-2)
- **WHEN** un administrador envía el alias `  Usuario demo 01  `
- **THEN** la API guarda el alias `Usuario demo 01`

### Requirement: Nodo inexistente al agregar
La API SHALL responder 404 con el mensaje `Nodo no encontrado` cuando el `nodoId` es un UUID que no corresponde a ningún nodo, y MUST NOT guardar nada (CA-3).

#### Scenario: Nodo que no existe (CA-3)
- **WHEN** un administrador agrega un afectado con un alias válido a un UUID sin nodo
- **THEN** la API responde 404 y no se guarda ningún afectado

### Requirement: Solo el administrador agrega afectados
La API MUST responder 403 cuando quien agrega es un técnico, aunque el cuerpo sea inválido, y 401 cuando no hay sesión; en ambos casos no se guarda nada. El panel de la ficha MUST NOT mostrar el formulario ni el botón «Agregar afectado» a un técnico, que sí ve la lista y el total (CA-4).

#### Scenario: Técnico llama a la API (CA-4)
- **WHEN** un técnico envía un afectado válido o inválido a la API
- **THEN** la API responde 403 y el nodo no tiene afectados nuevos

#### Scenario: Sin sesión (CA-4)
- **WHEN** se envía un afectado sin sesión
- **THEN** la API responde 401 y no se guarda nada

#### Scenario: Técnico abre la ficha (CA-4)
- **WHEN** un técnico abre la ficha de un nodo
- **THEN** el panel «Afectados» muestra la lista y el total, pero no el botón «Agregar afectado»

### Requirement: Agregar desde el panel de la ficha
La ficha del nodo SHALL mostrar el panel «Afectados», declarado en `paneles.ts`, con la lista de alias del nodo y su total. Un administrador SHALL poder agregar un afectado desde ese panel, y tras agregarlo el panel MUST mostrar el nuevo alias en la lista y el total aumentado en uno, también al recargar (CA-1; Derivado: decisión #2).

#### Scenario: Alta desde el panel (CA-1)
- **WHEN** un administrador abre la ficha de un nodo sin afectados, escribe un alias y pulsa «Agregar afectado»
- **THEN** el panel muestra ese alias en la lista y el total 1, y tras recargar sigue igual

#### Scenario: Error de la API en el panel (CA-2)
- **WHEN** la API rechaza el alta
- **THEN** el panel muestra el mensaje de error y la lista no cambia
