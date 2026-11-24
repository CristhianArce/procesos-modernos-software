# nodos-y-sensores

Comportamiento ya especificado: `vigente` (en `openspec/specs/`) o `en curso` (en un change sin archivar). Cada requisito va con su texto completo y los nombres de sus escenarios; si una versión en curso reemplaza a la vigente, queda la más reciente. Si la historia cambia uno, su delta usa `## MODIFIED Requirements` con el nombre exacto.

<!-- entrada: proposito -->
Permite que un administrador cree y mantenga los nodos de la red y los sensores de cada nodo, y que administradores y técnicos consulten la lista de nodos y la ficha de cada uno, donde los módulos del tablero muestran sus paneles.
<!-- fin -->

<!-- entrada: requisito: Creación y lista de nodos -->
- **Creación y lista de nodos** (en curso (nodos-sensores-y-simulador)): La API SHALL permitir que un administrador cree un nodo con nombre y ubicación opcional: MUST responder 201 con el nodo creado, y el nodo SHALL quedar con estado `conectado` y aparecer en la lista de nodos de la API y de la página `/nodos` (CA-1; Derivado: decisión #1, #20).
  - Escenarios: Crear un nodo con datos válidos (CA-1); El nodo creado aparece en la lista (CA-1); Crear un nodo desde la interfaz (CA-1)
<!-- fin -->

<!-- entrada: requisito: Sensores de un nodo -->
- **Sensores de un nodo** (en curso (nodos-sensores-y-simulador)): La API SHALL permitir que un administrador agregue a un nodo existente un sensor con nombre y un umbral máximo opcional por magnitud (voltaje, corriente y potencia): MUST responder 201, y el sensor SHALL quedar asociado al nodo y aparecer en la lista de sensores del nodo y en su ficha (CA-2; Derivado: decisión #1, #3).
  - Escenarios: Agregar un sensor con datos válidos (CA-2); El sensor aparece entre los del nodo (CA-2); El sensor aparece en la ficha (CA-2)
<!-- fin -->

<!-- entrada: requisito: Validación de nodos y sensores -->
- **Validación de nodos y sensores** (en curso (nodos-sensores-y-simulador)): La API SHALL validar toda entrada al crear o editar un nodo o un sensor y MUST responder 400 con el detalle de cada campo inválido, sin guardar nada. Un nombre vacío o de más de 80 caracteres, una ubicación de más de 120 caracteres, un umbral que no es un número mayor que 0, un cuerpo que no es JSON y una edición sin ningún campo SHALL ser inválidos (CA-3; Derivado: decisión #8, #14).
  - Escenarios: Nodo con nombre inválido (CA-3); Sensor con umbral inválido (CA-3); Edición con datos inválidos (CA-3); Cuerpo que no es JSON (CA-3)
<!-- fin -->

<!-- entrada: requisito: Edición y eliminación -->
- **Edición y eliminación** (en curso (nodos-sensores-y-simulador)): La API SHALL permitir que un administrador edite el nombre y la ubicación de un nodo, y el nombre y los umbrales de un sensor, y que los elimine. Editar MUST NOT cambiar el estado del nodo ni el nodo de un sensor. Eliminar un nodo SHALL eliminar también sus sensores y lecturas, y eliminar un sensor, sus lecturas (CA-3, CA-4; Derivado: decisión #5, #14, #20).
  - Escenarios: Editar un nodo con datos válidos (CA-3); Eliminar un nodo con sensores (CA-4)
<!-- fin -->

<!-- entrada: requisito: Identificadores inexistentes -->
- **Identificadores inexistentes** (en curso (nodos-sensores-y-simulador)): La API SHALL responder 404 cuando se consulta, edita o elimina un nodo o un sensor cuyo identificador no existe. Un identificador que no tiene forma de UUID SHALL tratarse como inexistente, y agregar un sensor a un nodo inexistente MUST responder 404 (CA-4; Derivado: decisión #13).
  - Escenarios: Nodo inexistente (CA-4); Sensor inexistente (CA-4); Identificador mal formado (CA-4); Sensor para un nodo inexistente (CA-4)
<!-- fin -->

<!-- entrada: requisito: Permisos por rol -->
- **Permisos por rol** (en curso (nodos-sensores-y-simulador)): La API SHALL exigir sesión en todas las rutas de nodos y sensores (401 sin sesión) y MUST verificar el rol dentro de cada handler: crear, editar y eliminar SHALL exigir el rol `administrador` y responder 403 a un técnico, antes de validar el cuerpo. Un técnico SHALL poder consultar la lista de nodos, un nodo, sus sensores y la ficha (CA-5; Derivado: decisión #6).
  - Escenarios: El técnico no puede escribir (CA-5); El técnico sí puede consultar (CA-5); Sin sesión (CA-5); La interfaz del técnico es de solo lectura (CA-5)
<!-- fin -->

<!-- entrada: requisito: Ficha del nodo con paneles -->
- **Ficha del nodo con paneles** (en curso (nodos-sensores-y-simulador)): La página `/nodos/{id}` SHALL mostrar los datos del nodo (nombre, ubicación y estado) y, en orden, los paneles que declaren los módulos en su `paneles.ts`, entre ellos el de sensores del nodo. La página MUST NOT nombrar a ningún módulo para mostrar su panel. Con la semilla cargada SHALL existir al menos un nodo de demostración con sensores (CA-7; Derivado: decisión #17, #19).
  - Escenarios: Ficha de un nodo de la semilla (CA-7); Semilla repetible (CA-7); Ficha de un nodo inexistente (CA-4)
<!-- fin -->
