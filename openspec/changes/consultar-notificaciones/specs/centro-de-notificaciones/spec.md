# Spec Delta

## Purpose

Guarda las notificaciones de cada técnico y las deja consultar en un centro de notificaciones, por la API y por una página, para que sepa qué avisos tiene pendientes de atender.

## ADDED Requirements

### Requirement: Notificaciones guardadas por destinatario
El sistema SHALL guardar cada notificación en una tabla con un solo destinatario (un usuario), el nombre del sensor como copia tal como venía en la alerta, la magnitud (`voltaje`, `corriente` o `potencia`), el valor, la fecha de la alerta y si fue leída, y MUST NOT guardar el umbral ni el nodo. La notificación SHALL conservarse aunque el sensor se elimine (CA-1; Derivado: decisión #4).

#### Scenario: Campos de una notificación (CA-1)
- **WHEN** se consulta una notificación guardada de un técnico
- **THEN** trae el nombre del sensor, la magnitud, el valor, la fecha de la alerta y si fue leída, y no trae umbral ni nodo

#### Scenario: El sensor se elimina (CA-1)
- **WHEN** se elimina el sensor cuyo nombre guarda una notificación
- **THEN** la notificación sigue guardada con la copia del nombre

### Requirement: Consulta de las notificaciones propias
`GET /api/notificaciones` SHALL responder 200 con las notificaciones del técnico de la sesión, de la más reciente a la más antigua según la fecha de la alerta y, en empate de fecha, por identificador descendente, y con el número de notificaciones no leídas. SHALL listar como máximo las 50 más recientes, y el número de no leídas MUST contar todas las del técnico, no solo las listadas (CA-1; Derivado: decisión #1, #2).

#### Scenario: Más reciente primero (CA-1)
- **WHEN** un técnico con tres notificaciones de fechas distintas consulta `GET /api/notificaciones`
- **THEN** la API responde 200 con las tres, la de fecha más reciente primero

#### Scenario: Número de no leídas (CA-1)
- **WHEN** un técnico con tres notificaciones, una leída y dos no leídas, consulta `GET /api/notificaciones`
- **THEN** la respuesta indica 2 no leídas

#### Scenario: Empate de fecha (CA-1; Derivado: decisión #2)
- **WHEN** dos notificaciones de un técnico tienen la misma fecha de alerta
- **THEN** la que tiene el identificador mayor aparece primero

#### Scenario: Más de 50 notificaciones (CA-1; Derivado: decisión #1)
- **WHEN** un técnico con 60 notificaciones, 55 de ellas no leídas, consulta `GET /api/notificaciones`
- **THEN** la API lista las 50 más recientes e indica 55 no leídas

#### Scenario: Técnico sin notificaciones (CA-1)
- **WHEN** un técnico sin notificaciones consulta `GET /api/notificaciones`
- **THEN** la API responde 200 con la lista vacía y 0 no leídas

### Requirement: Aislamiento entre técnicos
El destinatario SHALL tomarse de la sesión y nunca de un dato enviado por el cliente. Un técnico MUST ver solo sus notificaciones y el número de no leídas MUST contar solo las suyas (CA-2; RN-3).

#### Scenario: Dos técnicos con notificaciones (CA-2)
- **WHEN** dos técnicos tienen notificaciones y uno de ellos consulta `GET /api/notificaciones`
- **THEN** la respuesta contiene solo las suyas y su número de no leídas no cuenta las del otro

#### Scenario: Destinatario enviado por el cliente (CA-2)
- **WHEN** un técnico consulta `GET /api/notificaciones` con un identificador de otro usuario en la URL
- **THEN** la respuesta contiene solo las notificaciones del técnico de la sesión

### Requirement: Acceso a las notificaciones por la API
`GET /api/notificaciones` MUST responder 401 con un cuerpo JSON cuando no hay sesión, y 403 con un cuerpo JSON cuando la sesión es de un administrador, porque el centro es solo para técnicos (CA-3; Derivado: decisión #3).

#### Scenario: Visitante sin sesión (CA-3)
- **WHEN** un visitante sin sesión consulta `GET /api/notificaciones`
- **THEN** la API responde 401 con un cuerpo JSON

#### Scenario: Administrador (CA-3; Derivado: decisión #3)
- **WHEN** un administrador consulta `GET /api/notificaciones`
- **THEN** la API responde 403 con un cuerpo JSON

### Requirement: Centro de notificaciones
La página `/notificaciones` SHALL mostrar a un técnico sus notificaciones con la más reciente primero, cada una con el nombre del sensor, la magnitud, el valor con su unidad, la fecha y si está leída, y el número de no leídas. Sin notificaciones SHALL mostrar un estado vacío. El menú SHALL incluir la entrada "Notificaciones" solo para el rol técnico, y la lista se actualiza al recargar o navegar (CA-1; RN-4, RN-6; Derivado: decisión #3).

#### Scenario: Técnico con notificaciones (CA-1)
- **WHEN** un técnico abre `/notificaciones`
- **THEN** ve sus notificaciones con la más reciente primero y el número de no leídas

#### Scenario: Sin notificaciones (CA-1)
- **WHEN** un técnico sin notificaciones abre `/notificaciones`
- **THEN** ve un estado vacío y 0 no leídas

#### Scenario: Entrada de menú por rol (CA-1; Derivado: decisión #3)
- **WHEN** se arma el menú para un técnico y para un administrador
- **THEN** la entrada "Notificaciones" aparece solo para el técnico

#### Scenario: Administrador abre la página (CA-1; Derivado: decisión #3)
- **WHEN** un administrador abre `/notificaciones`
- **THEN** ve un mensaje de que el centro es solo para técnicos y no se consultan notificaciones
