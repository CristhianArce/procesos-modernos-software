# Spec Delta

## Purpose

Registra una alerta cada vez que una lectura supera el umbral máximo de su sensor en una magnitud, avisa a los módulos suscritos sin que el fallo de uno impida guardar la alerta, y deja consultar las alertas por la API.

## ADDED Requirements

### Requirement: Alerta por cada magnitud que supera su umbral
Al registrarse una lectura, el sistema MUST crear una alerta (sensor, magnitud, valor, umbral y fecha de registro) por cada magnitud cuyo valor sea estrictamente mayor que el umbral máximo de esa magnitud en su sensor, y SHALL no crear ninguna para las magnitudes dentro del umbral o sin umbral (CA-3; Derivado: decisión #5, #9).

#### Scenario: Lectura que supera un umbral (CA-3)
- **WHEN** se registra una lectura de 130 V para un sensor con umbral de voltaje 125
- **THEN** se crea una alerta con ese sensor, magnitud `voltaje`, valor 130, umbral 125 y la fecha de registro

#### Scenario: Lectura dentro del umbral (CA-3)
- **WHEN** se registra una lectura cuyo voltaje es igual a su umbral y cuya corriente y potencia están por debajo de los suyos
- **THEN** no se crea ninguna alerta

#### Scenario: Magnitud sin umbral (CA-3)
- **WHEN** se registra una lectura de potencia muy alta para un sensor sin umbral de potencia
- **THEN** no se crea ninguna alerta de potencia

#### Scenario: Dos magnitudes fuera de umbral (CA-3)
- **WHEN** se registra una lectura que supera el umbral de voltaje y el de corriente de su sensor
- **THEN** se crean dos alertas, una por magnitud

#### Scenario: El simulador genera alertas (CA-3)
- **WHEN** un administrador ejecuta `POST /api/simulador` sobre un nodo con un sensor cuyo umbral de voltaje es menor que cualquier voltaje simulado
- **THEN** queda registrada una alerta de voltaje para ese sensor

### Requirement: Aviso a los suscriptores de alertas
Después de guardar cada alerta, el servicio de alertas SHALL invocar a cada suscriptor de `registro.suscriptores` (los `on-alerta.ts` de los módulos) con el identificador, el sensor, la magnitud, el valor, el umbral y la fecha de la alerta. Si un suscriptor falla, el servicio MUST registrar el error en el log, conservar la alerta guardada y seguir avisando a los demás suscriptores (CA-5).

#### Scenario: Suscriptor avisado (CA-5)
- **WHEN** se registra una alerta y hay un módulo suscrito
- **THEN** el suscriptor recibe los datos de la alerta guardada, con su identificador

#### Scenario: Suscriptor que falla (CA-5)
- **WHEN** se registra una alerta y el primero de dos suscriptores lanza un error
- **THEN** el error queda en el log, la alerta sigue guardada y el segundo suscriptor también es avisado

### Requirement: Consulta de alertas por la API
`GET /api/alertas` SHALL exigir sesión de administrador o técnico y MUST responder 401 en JSON sin sesión. SHALL aceptar `sensorId` (UUID, opcional) y `limite` (entero de 1 a 100, 20 por defecto), validados con Zod, y MUST responder 400 con el detalle si alguno es inválido. Con parámetros válidos SHALL responder 200 con las alertas de la más reciente a la más antigua, filtradas por sensor si se indicó (CA-4, CA-6, CA-7; Derivado: decisión #1, #2, #8).

#### Scenario: Visitante sin sesión (CA-6)
- **WHEN** un visitante sin sesión consulta `GET /api/alertas`
- **THEN** la API responde 401 con un cuerpo JSON

#### Scenario: Parámetros inválidos (CA-7)
- **WHEN** un usuario con sesión consulta `GET /api/alertas` con `sensorId` que no es un UUID, o con `limite` 0, 101 o no numérico
- **THEN** la API responde 400 con el detalle de la validación de Zod

#### Scenario: Alertas de la más reciente a la más antigua (CA-4)
- **WHEN** un técnico consulta `GET /api/alertas?sensorId=<id>` de un sensor con tres alertas
- **THEN** la API responde 200 con las tres alertas, la más reciente primero
