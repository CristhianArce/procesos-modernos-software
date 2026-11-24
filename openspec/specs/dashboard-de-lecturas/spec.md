# dashboard-de-lecturas Specification

## Purpose
Muestra en un dashboard, a cualquier usuario con sesión, la última lectura y la gráfica de cada sensor y las alertas más recientes, para detectar de un vistazo qué parte de la red tiene problemas, y deja consultar las lecturas por la API.

## Requirements

### Requirement: Última lectura de cada sensor en el dashboard
La página `/dashboard` SHALL mostrar, a un administrador o un técnico, una tarjeta por cada sensor con su nombre y su última lectura: el voltaje en V, la corriente en A, la potencia en W y la fecha en formato local es-CO, zona `America/Bogota`. Un sensor sin lecturas SHALL mostrar "Sin lecturas". El menú SHALL incluir la entrada "Dashboard" para ambos roles (CA-1; Derivado: decisión #3, #4, #7, #11, #12).

#### Scenario: Sensores con lecturas (CA-1)
- **WHEN** un usuario con sesión abre `/dashboard` y hay sensores con lecturas
- **THEN** ve por cada sensor su última lectura con el valor y la unidad de voltaje (V), corriente (A) y potencia (W), y la fecha

#### Scenario: Formato de la fecha y de los valores (CA-1)
- **WHEN** se formatea la lectura de 120,4 V, 9,8 A y 1179,92 W tomada el `2026-11-22T15:30:05Z`
- **THEN** el texto muestra los tres valores con V, A y W y la fecha del 22 de noviembre de 2026 a las 10:30:05 (hora de Bogotá) en formato es-CO

### Requirement: Gráfica de cada sensor
Cada sensor con lecturas SHALL mostrar en el dashboard un panel con tres gráficas pequeñas, una por magnitud (voltaje, corriente y potencia), cada una con su propio eje vertical, que trazan sus 50 lecturas más recientes ordenadas por fecha de la más antigua a la más reciente, sin selector ni otra interacción (CA-2; Derivado: decisión #12).

#### Scenario: Las 50 lecturas más recientes (CA-2)
- **WHEN** un sensor tiene 60 lecturas y se arma su gráfica
- **THEN** la serie trae sus 50 lecturas más recientes, ordenadas por fecha ascendente

#### Scenario: Un trazo por magnitud con su escala (CA-2)
- **WHEN** se muestra la gráfica de un sensor con lecturas
- **THEN** hay tres gráficas, "Voltaje (V)", "Corriente (A)" y "Potencia (W)", cada una con su propio eje

### Requirement: Alertas en el dashboard
El dashboard SHALL listar las 20 alertas más recientes, la más reciente primero, con la fecha, el sensor, la magnitud, el valor y el umbral con su unidad. Sin alertas SHALL mostrar "Sin alertas" (CA-4; Derivado: decisión #1, #11).

#### Scenario: Alertas registradas (CA-4)
- **WHEN** hay alertas registradas y el usuario abre `/dashboard`
- **THEN** las ve listadas con la más reciente primero

### Requirement: Consulta de lecturas por la API
`GET /api/lecturas` SHALL exigir sesión de administrador o técnico y MUST responder 401 en JSON sin sesión. SHALL aceptar `sensorId` (UUID, opcional) y `limite` (entero de 1 a 100, 50 por defecto), validados con Zod, y MUST responder 400 con el detalle si alguno es inválido. Con parámetros válidos SHALL responder 200 con las lecturas de la más reciente a la más antigua, filtradas por sensor si se indicó (CA-6, CA-7; Derivado: decisión #2, #8).

#### Scenario: Visitante sin sesión (CA-6)
- **WHEN** un visitante sin sesión consulta `GET /api/lecturas`
- **THEN** la API responde 401 con un cuerpo JSON

#### Scenario: Parámetros inválidos (CA-7)
- **WHEN** un usuario con sesión consulta `GET /api/lecturas` con `sensorId` que no es un UUID, o con `limite` 0, 101 o no numérico
- **THEN** la API responde 400 con el detalle de la validación de Zod

#### Scenario: Lecturas de un sensor (CA-6)
- **WHEN** un técnico consulta `GET /api/lecturas?sensorId=<id>&limite=2` de un sensor con tres lecturas
- **THEN** la API responde 200 con sus dos lecturas más recientes, la más reciente primero
