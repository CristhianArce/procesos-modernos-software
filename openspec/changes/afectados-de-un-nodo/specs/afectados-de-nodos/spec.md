# Spec Delta

## Purpose

Permite que un administrador o un técnico vea, en la ficha de un nodo, qué usuarios ficticios dependen de él y cuántos son, para saber a quién afecta una falla o un corte antes de actuar. Un afectado es un alias asociado a un único nodo; esta capacidad solo los consulta.

## ADDED Requirements

### Requirement: Consultar los afectados de un nodo
La API SHALL responder 200 con el total y la lista de afectados de un nodo existente, cada uno con su identificador, su alias y su fecha de creación, ordenados del más antiguo al más reciente. El total MUST ser igual al número de elementos de la lista, los alias repetidos MUST aparecer cada uno, y la lista MUST NOT incluir afectados de otros nodos (CA-1, CA-3; Derivado: decisión #1, #3).

#### Scenario: Nodo con afectados (CA-1)
- **WHEN** se consultan los afectados de un nodo que tiene afectados
- **THEN** la API responde 200 con su total y su lista en orden de creación, sin afectados de otros nodos

#### Scenario: Alias repetido en un nodo (CA-1; Derivado: RN-4)
- **WHEN** un nodo tiene dos afectados con el mismo alias y se consultan sus afectados
- **THEN** la lista trae los dos y el total los cuenta a ambos

#### Scenario: Nodo sin afectados (CA-3)
- **WHEN** se consultan los afectados de un nodo existente que no tiene ninguno
- **THEN** la API responde 200 con total 0 y una lista vacía

### Requirement: Nodo inexistente o identificador inválido
La API SHALL responder 404 con el mensaje `Nodo no encontrado` cuando el identificador es un UUID que no corresponde a ningún nodo, y MUST responder 400 con el detalle cuando falta el identificador o no es un UUID (CA-3; Derivado: decisión #3).

#### Scenario: Identificador que no existe (CA-3)
- **WHEN** se consultan los afectados de un UUID que no corresponde a ningún nodo
- **THEN** la API responde 404 con `Nodo no encontrado`

#### Scenario: Identificador ausente o mal formado (CA-3; Derivado: decisión #3)
- **WHEN** se consultan los afectados sin `nodoId` o con un `nodoId` que no es un UUID
- **THEN** la API responde 400 con el detalle

### Requirement: Administrador y técnico consultan los afectados
La API SHALL permitir la consulta al administrador y al técnico, y MUST responder 401 cuando no hay sesión (CA-2).

#### Scenario: Administrador y técnico consultan (CA-2)
- **WHEN** un administrador o un técnico consulta los afectados de un nodo existente
- **THEN** la API responde 200 con la misma lista y el mismo total para ambos

#### Scenario: Sin sesión (CA-2)
- **WHEN** se consultan los afectados sin sesión
- **THEN** la API responde 401

### Requirement: Panel de afectados en la ficha del nodo
La ficha del nodo SHALL mostrar, mediante `paneles.ts` y sin editar la página de la ficha, un panel «Afectados» con el total y la lista de alias en orden de creación, tanto al administrador como al técnico. Si el nodo no tiene afectados, el panel MUST mostrar total 0 y un estado vacío (CA-1, CA-2; Derivado: decisión #1).

#### Scenario: Ficha de un nodo con afectados (CA-1)
- **WHEN** se abre la ficha de un nodo con afectados
- **THEN** el panel «Afectados» muestra el total y la lista de sus alias

#### Scenario: Administrador y técnico ven el panel (CA-2)
- **WHEN** un administrador o un técnico abre la ficha de un nodo con afectados
- **THEN** ambos ven el panel con la misma lista y el mismo total

#### Scenario: Ficha de un nodo sin afectados (CA-3)
- **WHEN** se abre la ficha de un nodo sin afectados
- **THEN** el panel muestra total 0 y el estado vacío
