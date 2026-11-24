# Spec Delta

## Purpose

Genera lecturas simuladas de voltaje, corriente y potencia para los sensores de un nodo, por la API o por un botón de la ficha, y deja consultable la última lectura de cada sensor, para probar el tablero sin hardware real.

## ADDED Requirements

### Requirement: Simulación de lecturas de un nodo
`POST /api/simulador` SHALL registrar, para el nodo indicado en el cuerpo, una lectura nueva por cada sensor del nodo, con voltaje, corriente y potencia, y MUST responder 200 con las lecturas creadas. Si el nodo no tiene sensores SHALL responder 200 con cero lecturas. El simulador SHALL ejecutarse solo cuando se llama a la API o se pulsa el botón de la ficha (CA-6; Derivado: decisión #2, #7, #9, #10, #20).

#### Scenario: Nodo con sensores (CA-6)
- **WHEN** un administrador envía a `POST /api/simulador` el identificador de un nodo con dos sensores
- **THEN** la API responde 200 con dos lecturas, una por sensor, cada una con voltaje, corriente y potencia

#### Scenario: Nodo sin sensores (CA-6)
- **WHEN** un administrador envía a `POST /api/simulador` el identificador de un nodo sin sensores
- **THEN** la API responde 200 con cero lecturas

#### Scenario: Botón de la interfaz (CA-6)
- **WHEN** un administrador pulsa el botón de simular en la ficha de un nodo con sensores
- **THEN** la ficha muestra una lectura nueva en cada sensor del nodo

### Requirement: Valores simulados
Cada lectura simulada SHALL traer un voltaje entre 110 y 130 V, una corriente entre 0,5 y 20 A y una potencia igual al producto de ambos. Para un sensor con umbrales, alrededor de una de cada diez lecturas SHALL superar uno de sus umbrales entre un 5 % y un 20 %, para poder probar alertas (CA-6; Derivado: decisión #4, #15).

#### Scenario: Lectura dentro del rango (CA-6)
- **WHEN** el simulador genera una lectura normal
- **THEN** el voltaje está entre 110 y 130, la corriente entre 0,5 y 20 y la potencia es voltaje por corriente

#### Scenario: Lectura fuera del umbral (CA-6)
- **WHEN** el simulador genera, para un sensor con umbrales, una lectura de las que salen fuera de rango
- **THEN** una de las magnitudes con umbral supera su umbral entre un 5 % y un 20 %

#### Scenario: Sensor sin umbrales (CA-6)
- **WHEN** el simulador genera lecturas para un sensor sin umbrales
- **THEN** todas quedan dentro del rango normal

### Requirement: Última lectura disponible
La última lectura de cada sensor SHALL quedar disponible para consultarse: `GET /api/sensores` y `GET /api/sensores/{id}` MUST incluir en cada sensor su `ultimaLectura` (voltaje, corriente, potencia y fecha), o `null` si aún no tiene lecturas, y la ficha del nodo SHALL mostrarla (CA-6; Derivado: decisión #18).

#### Scenario: Consultar la última lectura (CA-6)
- **WHEN** se ejecuta el simulador dos veces sobre un nodo y luego se consultan sus sensores
- **THEN** cada sensor trae en `ultimaLectura` los valores de la segunda simulación

#### Scenario: Sensor sin lecturas (CA-6)
- **WHEN** se consulta un sensor recién creado
- **THEN** su `ultimaLectura` es `null`

### Requirement: Acceso y validación del simulador
`POST /api/simulador` SHALL exigir sesión (401) y el rol `administrador` (403 para un técnico), MUST validar el cuerpo con Zod (400 si falta el identificador del nodo o el cuerpo no es JSON) y SHALL responder 404 si el nodo no existe. El técnico SHALL poder consultar la última lectura (CA-3, CA-4, CA-5, CA-6; Derivado: decisión #10, #11, #13).

#### Scenario: El técnico no puede simular (CA-5)
- **WHEN** un técnico envía `POST /api/simulador`
- **THEN** la API responde 403 y no se registra ninguna lectura

#### Scenario: Cuerpo inválido (CA-3)
- **WHEN** un administrador envía `POST /api/simulador` sin el identificador del nodo
- **THEN** la API responde 400 con el detalle de la validación

#### Scenario: Nodo inexistente (CA-4)
- **WHEN** un administrador envía `POST /api/simulador` con el identificador de un nodo que no existe
- **THEN** la API responde 404 y no se registra ninguna lectura

#### Scenario: El técnico consulta la última lectura (CA-5, CA-6)
- **WHEN** un técnico consulta `GET /api/sensores` de un nodo ya simulado
- **THEN** la API responde 200 y cada sensor trae su `ultimaLectura`
