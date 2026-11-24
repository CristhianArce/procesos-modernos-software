# Contexto del repositorio

Generado por `contexto.mjs`. Toda tabla, columna o módulo que use la propuesta debe aparecer aquí; si no aparece, es una pregunta, no un supuesto.

## Capacidades especificadas

Comportamiento ya especificado en `openspec/specs/`. Si la historia cambia una de estas capacidades, su delta usa `## MODIFIED Requirements` con el nombre exacto del requisito; no se crea otra capacidad para lo mismo.

| Capacidad | Propósito | Requisitos |
|---|---|---|
| acceso-tablero | Fija el control de acceso base del tablero: las páginas sin sesión llevan al login y la API protegida responde errores JSON en lugar de r… | Páginas del tablero redirigen sin sesión; API protegida responde 401 y 403 en JSON |
| afectados-de-nodos | Permite que un administrador o un técnico vea, en la ficha de un nodo y por la API, qué usuarios o dispositivos ficticios dependen de ese… | Panel de afectados en la ficha del nodo; Consulta de afectados por la API; Datos de un afectado |
| agentes-sdd | Define los agentes de Claude Code que preparan un issue y vigilan la calidad del flujo SDD: qué reciben, qué veredicto o hallazgos devuel… | Agentes imprescindibles disponibles en un clon limpio; Ningún agente lanza subagentes; Puerta G2 rechaza specs con formato inválido; Puerta G2 aprueba specs correctas; Revisor de reglas marca violaciones de capas como críticas; Preparador bloquea issues resueltos; Preparador deja el issue listo para el flujo |
| aislamiento-de-nodos | Permite que un administrador aísle un nodo de la red (lo deja desconectado) y lo reconecte desde su ficha, para cortar el suministro de u… | Aislar y reconectar un nodo; Repetición y validación del cambio de estado; Aislar y reconectar desde la ficha con confirmación; Solo el administrador cambia el estado de un nodo; Nodo inexistente |
| alertas-por-umbral | Registra una alerta cada vez que una lectura supera el umbral máximo de su sensor en una magnitud, avisa a los módulos suscritos sin que… | Alerta por cada magnitud que supera su umbral; Aviso a los suscriptores de alertas; Consulta de alertas por la API |
| calidad-proyecto | Garantiza que cualquier integrante o agente pueda instalar el proyecto desde un clon limpio y correr lint, typecheck, pruebas y build con… | Comandos de calidad en verde desde un clon limpio; Carpetas de trabajo de los agentes ignoradas |
| centro-de-notificaciones | Permite que cada técnico consulte en un centro de notificaciones los avisos que tiene pendientes de atender, con el número de no leídas,… | Consulta de las notificaciones propias por la API; Aislamiento entre técnicos; Acceso restringido a técnicos con sesión; Centro de notificaciones en la interfaz; Notificaciones guardadas con copia del sensor |
| dashboard-de-lecturas | Muestra en un dashboard, a cualquier usuario con sesión, la última lectura y la gráfica de cada sensor y las alertas más recientes, para… | Última lectura de cada sensor en el dashboard; Gráfica de cada sensor; Alertas en el dashboard; Consulta de lecturas por la API |
| despliegue-publico | Mantiene una instancia pública de la app, en un servicio gratuito, que ejecuta siempre la última imagen publicada por el CD, sin guardar… | Servicio público con la imagen publicada; Aviso a Render desde el CD; Secretos del servicio fuera del repositorio; Base de datos del servicio público; Migraciones y semillas en el CD |
| entorno-local | Permite que cualquier integrante levante la base de datos, aplique las migraciones y arranque la app en su portátil con `docker compose`,… | Arranque local completo; Variables obligatorias; Puertos del host que no chocan |
| entorno-sdd | Deja versionado y verificable el entorno de IA del repositorio: OpenSpec con las reglas mínimas del proyecto, las reglas que Claude Code… | Configuración de OpenSpec válida y sin claves duplicadas; Formato de specs exigido por la configuración; Reglas del proyecto disponibles en cada sesión; Comandos prohibidos rechazados por la configuración de permisos; Worktrees de historia sin confirmación y fuera de git; CI que valida la configuración en cada PR |
| extension-modulos | Deja que cada historia agregue su ítem de menú, su panel en la ficha del nodo y su suscriptor de alertas declarándolos en su propio módul… | Descubrimiento de extensiones por módulo; Menú filtrado por rol |
| historico-de-lecturas | Permite que cualquier usuario con sesión consulte el histórico de lecturas de la red, paginado y con filtros por nodo, sensor y rango de… | Consulta paginada del histórico; Filtros combinados; Filtro sin resultados; Validación de los filtros; Acceso con sesión; Página del histórico |
| inicio-de-sesion | Permite que un administrador o un técnico inicie y cierre sesión con su nombre de usuario y su contraseña, y que el tablero y la API reco… | Inicio de sesión con credenciales válidas; Credenciales incorrectas sin pistas; Validación del cuerpo del login; Límite de intentos fallidos; Acceso con la sesión emitida por el login; Endpoints reservados a administradores; Cierre de sesión |
| integracion-continua | Detecta de forma automática, en cada PR y con poco tiempo de espera, que una historia rompió la calidad del proyecto o la imagen, y revis… | Validación de cada PR; La imagen se construye y arranca en cada PR; Controles de seguridad solo al fusionar en main |
| nodos-y-sensores | Permite que un administrador cree y mantenga los nodos de la red y los sensores de cada nodo, y que administradores y técnicos consulten… | Creación y lista de nodos; Sensores de un nodo; Validación de nodos y sensores; Edición y eliminación; Identificadores inexistentes; Permisos por rol; Ficha del nodo con paneles |
| observabilidad | Permite saber si la app está viva, medir su tráfico HTTP en formato Prometheus sin exponer las métricas a cualquiera, y registrar cada pe… | Salud de la app sin autenticación; Métricas protegidas por token; Log estructurado de cada petición sin datos sensibles |
| orquestador-sdd | Lleva una historia de usuario desde su issue hasta un PR en borrador con evidencias en 5 minutos o menos, en un solo modo, combinando Ope… | Skills imprescindibles disponibles en un clon limpio; El orquestador solo lo invoca la persona; Orquestación de punta a punta en 5 minutos; Apertura de PR idempotente; Fallos de compilación clasificados; Commit solo con build verde reciente; Estado y evidencias del item reproducibles; Contexto del repositorio antes de proponer; Cobertura de criterios antes de G2 |
| plantillas-y-etiquetas | Da al equipo y al orquestador el mismo formato al abrir historias y PR, pide revisores por defecto y deja creadas las etiquetas que el fl… | Plantillas de historia y de PR; Etiquetas del flujo; Revisores por defecto |
| publicacion-imagen | Deja la imagen de la app publicada y actualizada en el registro de GitHub después de cada cambio de código en `main`, para que cualquiera… | Publicación al fusionar en main; Imagen pública y ejecutable; Permisos mínimos del CD |
| simulador-de-lecturas | Genera lecturas simuladas de voltaje, corriente y potencia para los sensores de un nodo, por la API o por un botón de la ficha, y deja co… | Simulación de lecturas de un nodo; Valores simulados; Última lectura disponible; Acceso y validación del simulador |

## Capacidades relacionadas con la historia

Comparten ruta o palabras con el issue. Su texto va completo: un delta `## MODIFIED Requirements` copia el bloque entero del requisito (encabezado exacto y todos sus escenarios) y lo edita; un requisito nuevo va en `## ADDED Requirements` con un nombre que no exista aquí.

### aislamiento-de-nodos

Permite que un administrador aísle un nodo de la red (lo deja desconectado) y lo reconecte desde su ficha, para cortar el suministro de un tramo con falla sin afectar al resto. Ambas transiciones son simuladas: solo cambian el estado guardado del nodo, sin órdenes a equipos reales.

````markdown
### Requirement: Aislar y reconectar un nodo
La API SHALL cambiar el estado de un nodo a `conectado` o `desconectado` cuando un administrador lo pide, y MUST responder 200 con el identificador y el estado resultante. El cambio SHALL modificar únicamente el estado del nodo indicado y no el de ningún otro nodo (CA-1, CA-2; Derivado: decisión #3, #4).

#### Scenario: Aislar un nodo conectado (CA-1)
- **WHEN** un administrador pide el estado `desconectado` para un nodo conectado
- **THEN** la API responde 200 con el estado `desconectado` y al consultar el nodo sigue desconectado

#### Scenario: Reconectar un nodo desconectado (CA-2)
- **WHEN** un administrador pide el estado `conectado` para un nodo desconectado
- **THEN** la API responde 200 con el estado `conectado` y al consultar el nodo sigue conectado

#### Scenario: Solo cambia el estado del nodo indicado (CA-1)
- **WHEN** un administrador aísla un nodo
- **THEN** el nombre y la ubicación de ese nodo y el estado de los demás nodos no cambian

#### Scenario: Un nodo desconectado sigue simulándose (CA-1; Derivado: RN-3)
- **WHEN** un administrador aísla un nodo y después simula lecturas para ese nodo
- **THEN** el simulador responde igual que con un nodo conectado, porque aislar solo cambia el estado visible

### Requirement: Repetición y validación del cambio de estado
Si el nodo ya está en el estado pedido, la API MUST responder 200 con ese estado y no cambiar nada. El estado pedido MUST ser `conectado` o `desconectado`: cualquier otro valor, la falta del campo o un cuerpo que no es JSON responde 400 con el detalle y el nodo conserva su estado (CA-1, CA-2; Derivado: decisión #1, #3).

#### Scenario: El destino ya es el estado actual (CA-1, CA-2)
- **WHEN** un administrador pide `desconectado` para un nodo que ya está desconectado, o `conectado` para uno que ya está conectado
- **THEN** la API responde 200 con ese mismo estado y el nodo no cambia

#### Scenario: Estado pedido inválido (CA-1; Derivado: decisión #3)
- **WHEN** un administrador envía un estado distinto de `conectado` y `desconectado`, no envía estado o envía un cuerpo que no es JSON
- **THEN** la API responde 400 con el detalle y el nodo conserva su estado

### Requirement: Aislar y reconectar desde la ficha con confirmación
La ficha del nodo SHALL ofrecer a un administrador el botón «Aislar nodo» cuando el nodo está conectado y «Reconectar nodo» cuando está desconectado. Al pulsarlo MUST pedir confirmación antes de llamar a la API, y la persona SHALL poder cancelar sin que cambie nada. Tras confirmar, la ficha SHALL mostrar el nuevo estado sin recargar la página, y el estado SHALL persistir al recargarla (CA-1, CA-2; Derivado: decisión #2, #5, #6).

#### Scenario: Aislar con confirmación (CA-1)
- **WHEN** un administrador abre la ficha de un nodo conectado, pulsa «Aislar nodo» y confirma
- **THEN** la ficha muestra el nodo como desconectado sin recargar la página y ofrece «Reconectar nodo»

#### Scenario: Reconectar con confirmación (CA-2)
- **WHEN** un administrador abre la ficha de un nodo desconectado, pulsa «Reconectar nodo» y confirma
- **THEN** la ficha muestra el nodo como conectado y ofrece «Aislar nodo»

#### Scenario: Cancelar la confirmación (CA-1, CA-2)
- **WHEN** un administrador pulsa «Aislar nodo» o «Reconectar nodo» y cancela la confirmación
- **THEN** no se llama a la API y el nodo conserva su estado

#### Scenario: El estado persiste (CA-1, CA-2)
- **WHEN** un administrador aísla un nodo y recarga la ficha
- **THEN** la ficha sigue mostrando el nodo desconectado

### Requirement: Solo el administrador cambia el estado de un nodo
La API MUST responder 403 cuando quien cambia el estado es un técnico, aunque el cuerpo sea inválido, y 401 cuando no hay sesión; en ambos casos el estado de ningún nodo cambia. La ficha MUST NOT mostrar los botones de aislar ni de reconectar a un técnico (CA-3; Derivado: decisión #3, #5).

#### Scenario: Técnico llama a la API (CA-3)
- **WHEN** un técnico pide cambiar el estado de un nodo existente, con un cuerpo válido o inválido
- **THEN** la API responde 403 y el nodo conserva su estado

#### Scenario: Sin sesión (CA-3)
- **WHEN** se pide cambiar el estado de un nodo sin sesión
- **THEN** la API responde 401 y el nodo conserva su estado

#### Scenario: Técnico abre la ficha (CA-3)
- **WHEN** un técnico abre la ficha de un nodo
- **THEN** la ficha no muestra los botones «Aislar nodo» ni «Reconectar nodo»

### Requirement: Nodo inexistente
La API SHALL responder 404 con el mensaje `Nodo no encontrado` cuando el identificador no corresponde a ningún nodo, incluido uno mal formado, y MUST NOT cambiar el estado de ningún otro nodo (CA-4; Derivado: decisión #3).

#### Scenario: Identificador que no existe (CA-4)
- **WHEN** un administrador pide cambiar el estado de un identificador de nodo que no existe
- **THEN** la API responde 404 y el estado de los demás nodos no cambia

#### Scenario: Identificador mal formado (CA-4)
- **WHEN** un administrador pide cambiar el estado de un identificador que no es un UUID
- **THEN** la API responde 404 y el estado de los demás nodos no cambia
````

### entorno-sdd

Deja versionado y verificable el entorno de IA del repositorio: OpenSpec con las reglas mínimas del proyecto, las reglas que Claude Code carga en cada sesión, los permisos que hacen cumplir las prohibiciones de los agentes y un CI que valida esa configuración en cada PR.

````markdown
### Requirement: Configuración de OpenSpec válida y sin claves duplicadas
El repositorio SHALL tener OpenSpec inicializado con una configuración de proyecto que se lee sin claves duplicadas y cuyas reglas por artefacto son todas texto, para que OpenSpec no las ignore en silencio (CA-1).

#### Scenario: Configuración sin claves duplicadas (CA-1)
- **WHEN** se analiza la configuración de OpenSpec exigiendo claves únicas
- **THEN** el análisis termina sin error y cada regla de cada artefacto es una cadena de texto

#### Scenario: OpenSpec no descarta reglas (CA-1)
- **WHEN** se piden las instrucciones de cualquier artefacto de un change
- **THEN** la salida no contiene la advertencia de reglas ignoradas y las reglas del proyecto aparecen en las instrucciones

### Requirement: Formato de specs exigido por la configuración
Las reglas de OpenSpec del proyecto SHALL exigir encabezados y palabras clave de specs en inglés, la cita de `CA-n` en requisitos, escenarios y tareas, y `## Purpose` en capacidades nuevas (CA-1).

#### Scenario: Change de ejemplo con formato correcto (CA-1)
- **WHEN** se valida en modo estricto un change de ejemplo que cumple el formato del proyecto
- **THEN** la validación termina con código 0

#### Scenario: Change de ejemplo con encabezados en español (CA-1)
- **WHEN** se valida en modo estricto un change de ejemplo con `### Requisito:` en lugar de `### Requirement:`
- **THEN** la validación falla

### Requirement: Reglas del proyecto disponibles en cada sesión
El repositorio SHALL incluir en su raíz las reglas del proyecto (stack, estructura, capas, datos, seguridad, SDD y reglas de agentes) en el archivo que Claude Code carga automáticamente al abrir una sesión allí (CA-1).

#### Scenario: Sesión nueva en la raíz (CA-1)
- **WHEN** un integrante abre Claude Code en la raíz de un clon limpio
- **THEN** las reglas del proyecto, incluidas las prohibiciones de los agentes, forman parte del contexto de la sesión sin pasos manuales

### Requirement: Comandos prohibidos rechazados por la configuración de permisos
La configuración de permisos del proyecto SHALL rechazar merge de PR, aprobación o solicitud de cambios en un PR, amend, rebase, reset, force push y la edición de `.github/` dentro de los worktrees de historia (CA-3).

#### Scenario: Comando prohibido (CA-3)
- **WHEN** una sesión de Claude Code intenta `gh pr merge`, `gh pr review --approve`, `git commit --amend`, `git rebase`, `git reset` o `git push --force`
- **THEN** el comando se rechaza sin ejecutarse

#### Scenario: Edición de CI desde un worktree (CA-3)
- **WHEN** una sesión intenta editar un archivo bajo `.github/` dentro de `.claude/worktrees/`
- **THEN** la edición se rechaza

#### Scenario: Lista de rechazo completa (CA-3)
- **WHEN** se verifica la configuración de permisos versionada
- **THEN** contiene una regla de rechazo para cada comando prohibido de la lista

### Requirement: Worktrees de historia sin confirmación y fuera de git
Crear y borrar un worktree de historia en `.claude/worktrees/` SHALL ejecutarse sin pedir confirmación, y esa carpeta y `.flujo/` SHALL quedar ignoradas por git (CA-3).

#### Scenario: Crear y borrar un worktree (CA-3)
- **WHEN** una sesión crea un worktree en `.claude/worktrees/` desde `origin/main` y luego lo borra
- **THEN** ninguna de las dos operaciones pide confirmación y `git status` del checkout principal no muestra la carpeta

### Requirement: CI que valida la configuración en cada PR
El repositorio SHALL ejecutar en cada PR y en cada push a `main` las pruebas de la configuración de IA y la validación estricta de OpenSpec, y fallar si alguna falla (CA-1, CA-3; Derivado: decisión #21).

#### Scenario: PR con configuración válida (CA-1)
- **WHEN** se abre un PR con la configuración y las pruebas en verde
- **THEN** el CI termina en verde

#### Scenario: PR que rompe la configuración (CA-1)
- **WHEN** un PR introduce una regla de OpenSpec mal formada o quita una regla de rechazo
- **THEN** el CI falla
````

### extension-modulos

Deja que cada historia agregue su ítem de menú, su panel en la ficha del nodo y su suscriptor de alertas declarándolos en su propio módulo, sin editar el núcleo ni los archivos de otras historias.

````markdown
### Requirement: Descubrimiento de extensiones por módulo
El registro de extensiones SHALL descubrir los ítems de menú, los paneles de la ficha del nodo y los suscriptores de alertas que declara cada módulo en su carpeta, sin que agregar un módulo requiera editar archivos del núcleo (CA-4).

#### Scenario: Módulo de prueba con las tres extensiones (CA-4)
- **WHEN** existe un módulo de prueba que declara un ítem de menú, un panel de la ficha del nodo y un suscriptor de alertas, y se consulta el registro
- **THEN** el registro devuelve el ítem, el panel y el suscriptor del módulo, y ningún archivo del núcleo nombra ese módulo

#### Scenario: Orden del menú (CA-4)
- **WHEN** dos módulos declaran ítems de menú con distinto `orden`
- **THEN** el registro los devuelve ordenados por `orden` ascendente

### Requirement: Menú filtrado por rol
El registro SHALL devolver para un rol solo los ítems de menú que incluyen ese rol (CA-4).

#### Scenario: Ítem restringido a otro rol (CA-4)
- **WHEN** un módulo declara un ítem de menú solo para `administrador` y se pide el menú del rol `tecnico`
- **THEN** el ítem no aparece en el menú del rol `tecnico` y sí en el de `administrador`
````

### nodos-y-sensores

Permite que un administrador cree y mantenga los nodos de la red y los sensores de cada nodo, y que administradores y técnicos consulten la lista de nodos y la ficha de cada uno, donde los módulos del tablero muestran sus paneles.

````markdown
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
````

### acceso-tablero

Fija el control de acceso base del tablero: las páginas sin sesión llevan al login y la API protegida responde errores JSON en lugar de redirigir, para que cada historia solo declare qué rol exige.

````markdown
### Requirement: Páginas del tablero redirigen sin sesión
Las páginas del tablero SHALL redirigir a `/login` a un visitante sin sesión válida (CA-6).

#### Scenario: Visitante sin sesión abre el tablero (CA-6)
- **WHEN** un visitante sin cookie de sesión abre `/`
- **THEN** recibe una redirección a `/login`

#### Scenario: Sesión con firma inválida (CA-6)
- **WHEN** un visitante abre `/` con una cookie de sesión cuya firma no corresponde a `SESSION_SECRET`
- **THEN** recibe una redirección a `/login`

### Requirement: API protegida responde 401 y 403 en JSON
Una ruta `/api/...` protegida SHALL responder 401 en JSON, sin redirección, cuando no hay sesión válida, y 403 en JSON cuando la sesión no tiene el rol exigido (CA-6).

#### Scenario: API protegida sin sesión (CA-6)
- **WHEN** un cliente sin sesión llama a una ruta `/api/...` protegida
- **THEN** recibe 401 con un cuerpo JSON de error y sin cabecera `Location`

#### Scenario: Rol insuficiente (CA-6)
- **WHEN** un cliente con sesión de rol `tecnico` llama a una ruta que exige `administrador`
- **THEN** recibe 403 con un cuerpo JSON de error
````

## Changes activos

- (ninguno)

## Tablas y columnas

| Tabla | Columnas | Migraciones |
|---|---|---|
| usuarios | id, nombre_usuario, contrasena_hash, rol, creado_en | V202611221930__usuarios.sql |
| nodos | id, nombre, ubicacion, estado, creado_en | V202611222130__nodos_sensores_lecturas.sql |
| sensores | id, nodo_id, nombre, umbral_voltaje, umbral_corriente, umbral_potencia, creado_en | V202611222130__nodos_sensores_lecturas.sql |
| lecturas | id, sensor_id, voltaje, corriente, potencia, tomada_en | V202611222130__nodos_sensores_lecturas.sql |
| alertas | id, sensor_id, magnitud, valor, umbral, creada_en | V202611222300__alertas.sql |
| nodo_topologia | nodo_id, tipo, x, y, actualizado_en | V202611222330__topologia.sql |
| enlaces | id, origen_id, destino_id, creado_en | V202611222330__topologia.sql |
| notificaciones | id, destinatario_id, sensor, magnitud, valor, creada_en, leida | V202611241000__notificaciones.sql |
| nodo_usuarios | id, nodo_id, alias, creado_en | V202611241700__afectados.sql |

## Módulos y puntos de extensión

| Módulo | Puntos de extensión |
|---|---|
| afectados | paneles.ts |
| aislamiento | paneles.ts |
| alertas | (ninguno) |
| auth | (ninguno) |
| dashboard | menu.ts |
| estado | (ninguno) |
| historico | menu.ts |
| inicio | menu.ts |
| lecturas | (ninguno) |
| nodos | menu.ts |
| notificaciones | menu.ts |
| sensores | paneles.ts |
| simulador | paneles.ts |
| topologia | (ninguno) |
| ui | (ninguno) |

## Semillas

- db/seed/auth.sql
- db/seed/historico.sql
- db/seed/nodos.sql
- db/seed/nodos_usuarios.sql
- db/seed/notificaciones.sql
- db/seed/sensores.sql
- db/seed/topologia.sql

## Rutas del contrato

| Ruta | Métodos |
|---|---|
| /api/auth/login | POST |
| /api/auth/logout | POST |
| /api/health | GET |
| /api/metrics | GET |
| /api/nodos | GET, POST |
| /api/nodos/{id} | GET, PATCH, DELETE |
| /api/aislamiento/nodos/{id} | PATCH |
| /api/sensores | GET, POST |
| /api/sensores/{id} | GET, PATCH, DELETE |
| /api/simulador | POST |
| /api/afectados | GET |
| /api/historico | GET |
| /api/lecturas | GET |
| /api/alertas | GET |
| /api/notificaciones | GET |
| /api/topologia | GET |
| /api/topologia/nodos/{id} | PUT |
| /api/topologia/enlaces | POST |
| /api/topologia/enlaces/{id} | DELETE |
| /api/estado | GET |
| /api/estado/nodos/{id} | GET |
