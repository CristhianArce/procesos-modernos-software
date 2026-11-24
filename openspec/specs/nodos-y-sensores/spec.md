# nodos-y-sensores Specification

## Purpose
Permite que un administrador cree y mantenga los nodos de la red y los sensores de cada nodo, y que administradores y técnicos consulten la lista de nodos y la ficha de cada uno, donde los módulos del tablero muestran sus paneles.

## Requirements

### Requirement: Creación y lista de nodos
La API SHALL permitir que un administrador cree un nodo con nombre y ubicación opcional: MUST responder 201 con el nodo creado, y el nodo SHALL quedar con estado `conectado` y aparecer en la lista de nodos de la API y de la página `/nodos` (CA-1; Derivado: decisión #1, #20).

#### Scenario: Crear un nodo con datos válidos (CA-1)
- **WHEN** un administrador envía a `POST /api/nodos` un nombre válido y una ubicación
- **THEN** la API responde 201 con el nodo, su identificador y el estado `conectado`

#### Scenario: El nodo creado aparece en la lista (CA-1)
- **WHEN** se consulta `GET /api/nodos` después de crear un nodo
- **THEN** la respuesta es un arreglo que incluye ese nodo con estado `conectado`

#### Scenario: Crear un nodo desde la interfaz (CA-1)
- **WHEN** un administrador envía el formulario de la página `/nodos` con un nombre válido
- **THEN** el nodo aparece en la lista de la página con estado `conectado`

### Requirement: Sensores de un nodo
La API SHALL permitir que un administrador agregue a un nodo existente un sensor con nombre y un umbral máximo opcional por magnitud (voltaje, corriente y potencia): MUST responder 201, y el sensor SHALL quedar asociado al nodo y aparecer en la lista de sensores del nodo y en su ficha (CA-2; Derivado: decisión #1, #3).

#### Scenario: Agregar un sensor con datos válidos (CA-2)
- **WHEN** un administrador envía a `POST /api/sensores` el identificador de un nodo existente, un nombre válido y umbrales válidos
- **THEN** la API responde 201 con el sensor, su identificador, el identificador del nodo y los umbrales enviados

#### Scenario: El sensor aparece entre los del nodo (CA-2)
- **WHEN** se consulta `GET /api/sensores` con el identificador del nodo
- **THEN** la respuesta es un arreglo que incluye el sensor recién creado

#### Scenario: El sensor aparece en la ficha (CA-2)
- **WHEN** un administrador agrega un sensor desde la ficha del nodo
- **THEN** la ficha muestra el sensor en la lista de sensores del nodo

### Requirement: Validación de nodos y sensores
La API SHALL validar toda entrada al crear o editar un nodo o un sensor y MUST responder 400 con el detalle de cada campo inválido, sin guardar nada. Un nombre vacío o de más de 80 caracteres, una ubicación de más de 120 caracteres, un umbral que no es un número mayor que 0, un cuerpo que no es JSON y una edición sin ningún campo SHALL ser inválidos (CA-3; Derivado: decisión #8, #14).

#### Scenario: Nodo con nombre inválido (CA-3)
- **WHEN** un administrador envía a `POST /api/nodos` un nombre vacío o de más de 80 caracteres
- **THEN** la API responde 400 con el campo `nombre` en el detalle y no se crea ningún nodo

#### Scenario: Sensor con umbral inválido (CA-3)
- **WHEN** un administrador envía a `POST /api/sensores` un umbral negativo, cero o que no es un número
- **THEN** la API responde 400 con el campo del umbral en el detalle y no se crea ningún sensor

#### Scenario: Edición con datos inválidos (CA-3)
- **WHEN** un administrador envía a `PATCH /api/nodos/{id}` o a `PATCH /api/sensores/{id}` un nombre vacío o un cuerpo sin ningún campo editable
- **THEN** la API responde 400 con el detalle y el nodo o el sensor conserva sus datos

#### Scenario: Cuerpo que no es JSON (CA-3)
- **WHEN** un administrador envía un cuerpo que no es JSON al crear un nodo o un sensor
- **THEN** la API responde 400 y no guarda nada

### Requirement: Edición y eliminación
La API SHALL permitir que un administrador edite el nombre y la ubicación de un nodo, y el nombre y los umbrales de un sensor, y que los elimine. Editar MUST NOT cambiar el estado del nodo ni el nodo de un sensor. Eliminar un nodo SHALL eliminar también sus sensores y lecturas, y eliminar un sensor, sus lecturas (CA-3, CA-4; Derivado: decisión #5, #14, #20).

#### Scenario: Editar un nodo con datos válidos (CA-3)
- **WHEN** un administrador envía a `PATCH /api/nodos/{id}` un nombre válido nuevo
- **THEN** la API responde 200 con el nodo actualizado y su estado sin cambios

#### Scenario: Eliminar un nodo con sensores (CA-4)
- **WHEN** un administrador elimina con `DELETE /api/nodos/{id}` un nodo que tiene sensores y lecturas
- **THEN** la API responde 204, y consultar después el nodo o uno de sus sensores responde 404

### Requirement: Identificadores inexistentes
La API SHALL responder 404 cuando se consulta, edita o elimina un nodo o un sensor cuyo identificador no existe. Un identificador que no tiene forma de UUID SHALL tratarse como inexistente, y agregar un sensor a un nodo inexistente MUST responder 404 (CA-4; Derivado: decisión #13).

#### Scenario: Nodo inexistente (CA-4)
- **WHEN** un administrador hace `GET`, `PATCH` o `DELETE` sobre `/api/nodos/{id}` con un identificador que no existe
- **THEN** la API responde 404

#### Scenario: Sensor inexistente (CA-4)
- **WHEN** un administrador hace `GET`, `PATCH` o `DELETE` sobre `/api/sensores/{id}` con un identificador que no existe
- **THEN** la API responde 404

#### Scenario: Identificador mal formado (CA-4)
- **WHEN** se consulta `/api/nodos/{id}` o `/api/sensores/{id}` con un identificador que no es un UUID
- **THEN** la API responde 404 y no 500

#### Scenario: Sensor para un nodo inexistente (CA-4)
- **WHEN** un administrador envía a `POST /api/sensores` el identificador de un nodo que no existe
- **THEN** la API responde 404 y no se crea ningún sensor

### Requirement: Permisos por rol
La API SHALL exigir sesión en todas las rutas de nodos y sensores (401 sin sesión) y MUST verificar el rol dentro de cada handler: crear, editar y eliminar SHALL exigir el rol `administrador` y responder 403 a un técnico, antes de validar el cuerpo. Un técnico SHALL poder consultar la lista de nodos, un nodo, sus sensores y la ficha (CA-5; Derivado: decisión #6).

#### Scenario: El técnico no puede escribir (CA-5)
- **WHEN** un técnico envía `POST`, `PATCH` o `DELETE` a las rutas de nodos o de sensores
- **THEN** la API responde 403 y no guarda ni elimina nada

#### Scenario: El técnico sí puede consultar (CA-5)
- **WHEN** un técnico consulta `GET /api/nodos`, `GET /api/nodos/{id}` o `GET /api/sensores` con el identificador de un nodo
- **THEN** la API responde 200 con los datos

#### Scenario: Sin sesión (CA-5)
- **WHEN** una petición sin cookie de sesión llega a una ruta de nodos o de sensores
- **THEN** la API responde 401 en JSON

#### Scenario: La interfaz del técnico es de solo lectura (CA-5)
- **WHEN** un técnico abre la página `/nodos` y la ficha de un nodo
- **THEN** ve la lista y la ficha, y no ve los formularios para crear nodos ni para agregar sensores

### Requirement: Ficha del nodo con paneles
La página `/nodos/{id}` SHALL mostrar los datos del nodo (nombre, ubicación y estado) y, en orden, los paneles que declaren los módulos en su `paneles.ts`, entre ellos el de sensores del nodo. La página MUST NOT nombrar a ningún módulo para mostrar su panel. Con la semilla cargada SHALL existir al menos un nodo de demostración con sensores (CA-7; Derivado: decisión #17, #19).

#### Scenario: Ficha de un nodo de la semilla (CA-7)
- **WHEN** un usuario con sesión abre la ficha de un nodo de la semilla
- **THEN** ve el nombre, la ubicación y el estado del nodo, sus sensores y los paneles registrados

#### Scenario: Semilla repetible (CA-7)
- **WHEN** las semillas de nodos y sensores se aplican dos veces
- **THEN** los nodos, sensores y lecturas de demostración no se duplican

#### Scenario: Ficha de un nodo inexistente (CA-4)
- **WHEN** un usuario abre `/nodos/{id}` con un identificador que no existe
- **THEN** la página responde con "no encontrado"
