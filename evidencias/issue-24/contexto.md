# Contexto del repositorio

Generado por `contexto.mjs`. Toda tabla, columna o módulo que use la propuesta debe aparecer aquí; si no aparece, es una pregunta, no un supuesto.

## Capacidades especificadas

Comportamiento ya especificado en `openspec/specs/`. Si la historia cambia una de estas capacidades, su delta usa `## MODIFIED Requirements` con el nombre exacto del requisito; no se crea otra capacidad para lo mismo.

| Capacidad | Propósito | Requisitos |
|---|---|---|
| acceso-tablero | Fija el control de acceso base del tablero: las páginas sin sesión llevan al login y la API protegida responde errores JSON en lugar de r… | Páginas del tablero redirigen sin sesión; API protegida responde 401 y 403 en JSON |
| agentes-sdd | Define los agentes de Claude Code que preparan un issue y vigilan la calidad del flujo SDD: qué reciben, qué veredicto o hallazgos devuel… | Agentes imprescindibles disponibles en un clon limpio; Ningún agente lanza subagentes; Puerta G2 rechaza specs con formato inválido; Puerta G2 aprueba specs correctas; Revisor de reglas marca violaciones de capas como críticas; Preparador bloquea issues resueltos; Preparador deja el issue listo para el flujo |
| aislamiento-de-nodos | Permite que un administrador aísle un nodo de la red (lo deja desconectado) y lo reconecte desde su ficha, para cortar el suministro de u… | Aislar y reconectar un nodo; Repetición y validación del cambio de estado; Aislar y reconectar desde la ficha con confirmación; Solo el administrador cambia el estado de un nodo; Nodo inexistente |
| alertas-por-umbral | Registra una alerta cada vez que una lectura supera el umbral máximo de su sensor en una magnitud, avisa a los módulos suscritos sin que… | Alerta por cada magnitud que supera su umbral; Aviso a los suscriptores de alertas; Consulta de alertas por la API |
| calidad-proyecto | Garantiza que cualquier integrante o agente pueda instalar el proyecto desde un clon limpio y correr lint, typecheck, pruebas y build con… | Comandos de calidad en verde desde un clon limpio; Carpetas de trabajo de los agentes ignoradas |
| dashboard-de-lecturas | Muestra en un dashboard, a cualquier usuario con sesión, la última lectura y la gráfica de cada sensor y las alertas más recientes, para… | Última lectura de cada sensor en el dashboard; Gráfica de cada sensor; Alertas en el dashboard; Consulta de lecturas por la API |
| despliegue-publico | Mantiene una instancia pública de la app, en un servicio gratuito, que ejecuta siempre la última imagen publicada por el CD, sin guardar… | Servicio público con la imagen publicada; Aviso a Render desde el CD; Secretos del servicio fuera del repositorio; Base de datos del servicio público; Migraciones y semillas en el CD |
| entorno-local | Permite que cualquier integrante levante la base de datos, aplique las migraciones y arranque la app en su portátil con `docker compose`,… | Arranque local completo; Variables obligatorias; Puertos del host que no chocan |
| entorno-sdd | Deja versionado y verificable el entorno de IA del repositorio: OpenSpec con las reglas mínimas del proyecto, las reglas que Claude Code… | Configuración de OpenSpec válida y sin claves duplicadas; Formato de specs exigido por la configuración; Reglas del proyecto disponibles en cada sesión; Comandos prohibidos rechazados por la configuración de permisos; Worktrees de historia sin confirmación y fuera de git; CI que valida la configuración en cada PR |
| extension-modulos | Deja que cada historia agregue su ítem de menú, su panel en la ficha del nodo y su suscriptor de alertas declarándolos en su propio módul… | Descubrimiento de extensiones por módulo; Menú filtrado por rol |
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

### alertas-por-umbral

Registra una alerta cada vez que una lectura supera el umbral máximo de su sensor en una magnitud, avisa a los módulos suscritos sin que el fallo de uno impida guardar la alerta, y deja consultar las alertas por la API.

````markdown
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
````

### orquestador-sdd

Lleva una historia de usuario desde su issue hasta un PR en borrador con evidencias en 5 minutos o menos, en un solo modo, combinando OpenSpec, los agentes del flujo y los skills de compilación, commit y PR, con salidas de error claras cuando algo no se puede continuar.

````markdown
### Requirement: Skills imprescindibles disponibles en un clon limpio
Un clon limpio del repositorio SHALL ofrecer, sin instalar nada más, los skills `orquestador`, `build-test`, `commit` y `abrir-pr`, además de los skills de OpenSpec (CA-2).

#### Scenario: Clon limpio (CA-2)
- **WHEN** un integrante abre Claude Code en la raíz de un clon limpio
- **THEN** los cuatro skills y los seis skills de OpenSpec aparecen disponibles

### Requirement: El orquestador solo lo invoca la persona
El skill `orquestador` SHALL declarar que el modelo no puede invocarlo por su cuenta, de modo que solo arranca cuando la persona lo pide (CA-2).

#### Scenario: Definición del orquestador (CA-2)
- **WHEN** se verifica la definición versionada del skill `orquestador`
- **THEN** declara que la invocación por el modelo está deshabilitada

### Requirement: Orquestación de punta a punta en 5 minutos
Con un issue abierto, Docker en marcha y las credenciales de la base de datos en `.env`, `/orquestador <n>` SHALL terminar en 5 minutos o menos con un único PR en borrador que cita el issue y el nombre del change, y con `evidencias/issue-<n>/` commiteado en su rama (CA-6).

#### Scenario: Issue de prueba (CA-6)
- **WHEN** la persona ejecuta `/orquestador <n>` sobre el issue de prueba abierto
- **THEN** en 5 minutos o menos existe un PR en borrador cuyo cuerpo cita `#<n>` y el change, y su rama contiene `evidencias/issue-<n>/` con la trazabilidad CA → requisito → tarea → código → prueba

### Requirement: Apertura de PR idempotente
El skill `abrir-pr` SHALL devolver el PR existente, sin crear otro, cuando ya hay un PR abierto para la rama de la historia (CA-6).

#### Scenario: Segunda apertura (CA-6)
- **WHEN** se invoca `abrir-pr` dos veces para el mismo issue
- **THEN** la segunda invocación devuelve el mismo número de PR y sigue existiendo un único PR

### Requirement: Fallos de compilación clasificados
El skill `build-test` SHALL clasificar cada fallo como **código** o **entorno**, y el orquestador SHALL detener el item ante un fallo de entorno (CA-7).

#### Scenario: Docker apagado (CA-7)
- **WHEN** `build-test` corre con Docker apagado
- **THEN** el fallo se clasifica como **entorno** y el orquestador detiene el item sin commitear

#### Scenario: Error de tipos (CA-7)
- **WHEN** `build-test` corre sobre código con un error de tipos
- **THEN** el fallo se clasifica como **código**

### Requirement: Commit solo con build verde reciente
El skill `commit` SHALL negarse a commitear si el estado del item no registra un build verde posterior al último cambio de código (CA-7).

#### Scenario: Sin build verde (CA-7)
- **WHEN** se invoca `commit` y el estado del item no tiene un build verde reciente
- **THEN** no se crea ningún commit y se informa el motivo

### Requirement: Estado y evidencias del item reproducibles
El orquestador SHALL guardar el estado de cada item en `.flujo/issue-<n>/` con las plantillas del proyecto y SHALL copiar a `evidencias/issue-<n>/` los archivos de evidencia sin logs pesados, generando el registro de agentes (CA-6).

#### Scenario: Copia de evidencias (CA-6)
- **WHEN** se copian las evidencias de un `<trabajo>` de ejemplo
- **THEN** `evidencias/issue-<n>/` contiene los archivos de evidencia y `agentes.md` generado desde el registro de agentes, y no contiene logs

### Requirement: Contexto del repositorio antes de proponer
Antes de proponer el change de una historia, el orquestador SHALL escribir en `<trabajo>/contexto.md` las tablas y columnas de las migraciones, los módulos con sus puntos de extensión, las semillas y las rutas del contrato, y la propuesta SHALL tratar como pregunta cualquier tabla o módulo que no figure ahí (CA-6).

#### Scenario: Repositorio de ejemplo (CA-6)
- **WHEN** se genera el contexto de un repositorio con una migración que crea una tabla y agrega una columna, y un módulo con ítem de menú
- **THEN** `contexto.md` lista la tabla con ambas columnas, el módulo con su ítem de menú, la semilla y las rutas del contrato

### Requirement: Cobertura de criterios antes de G2
Antes de la puerta G2, el orquestador SHALL obtener con un script, sin agentes, los requisitos, escenarios y tareas que citan cada `CA-n` del issue y los criterios sin cobertura, y SHALL pasar ese resultado al `revisor-salida` (CA-6).

#### Scenario: Change de ejemplo con cobertura completa (CA-6)
- **WHEN** se analiza la cobertura del change de ejemplo correcto contra su issue
- **THEN** cada `CA-n` tiene requisito o escenario y tarea, y la lista de criterios sin cobertura está vacía

#### Scenario: Criterio sin cobertura (CA-6)
- **WHEN** el issue tiene un `CA-n` que ninguna spec ni tarea cita
- **THEN** ese criterio aparece en la lista de criterios sin cobertura
````

### agentes-sdd

Define los agentes de Claude Code que preparan un issue y vigilan la calidad del flujo SDD: qué reciben, qué veredicto o hallazgos devuelven y qué tienen prohibido, para que el orquestador los combine de forma predecible.

````markdown
### Requirement: Agentes imprescindibles disponibles en un clon limpio
Un clon limpio del repositorio SHALL ofrecer, sin instalar nada más, los agentes `preparador`, `revisor-salida` y `revisor-reglas` (CA-2).

#### Scenario: Clon limpio (CA-2)
- **WHEN** un integrante abre Claude Code en la raíz de un clon limpio
- **THEN** los tres agentes aparecen disponibles para ser lanzados

### Requirement: Ningún agente lanza subagentes
Cada agente del flujo SDD SHALL declarar que no puede usar la herramienta de lanzar agentes (CA-2).

#### Scenario: Definición de los agentes (CA-2)
- **WHEN** se verifica la definición versionada de cada agente
- **THEN** todas declaran como herramienta no permitida la de lanzar agentes, y todas tienen una sección de prohibiciones con las reglas globales de los agentes

### Requirement: Puerta G2 rechaza specs con formato inválido
El `revisor-salida` SHALL devolver `CORREGIR`, con al menos un hallazgo de formato, cuando evalúa la puerta G2 sobre un change cuyos encabezados de requisitos están en español (CA-4).

#### Scenario: Change con encabezados en español (CA-4)
- **WHEN** el `revisor-salida` evalúa G2 sobre el change de ejemplo con `### Requisito:`
- **THEN** devuelve `CORREGIR` con un hallazgo de formato que señala el encabezado

### Requirement: Puerta G2 aprueba specs correctas
El `revisor-salida` SHALL devolver `APROBADO` en G2 cuando el change cumple el formato y cada requisito cita su `CA-n` (CA-4).

#### Scenario: Change correcto (CA-4)
- **WHEN** el `revisor-salida` evalúa G2 sobre el change de ejemplo correcto
- **THEN** devuelve `APROBADO`

#### Scenario: Salida lista para el registro de puertas (CA-4)
- **WHEN** el `revisor-salida` termina una evaluación
- **THEN** su salida empieza con la cabecera `## G2 — intento <n>` y usa solo los veredictos `APROBADO`, `CORREGIR` o `BLOQUEAR`

### Requirement: Revisor de reglas marca violaciones de capas como críticas
El `revisor-reglas` SHALL devolver al menos un hallazgo `CRITICAL` por cada violación de capas que encuentre (SQL fuera de la capa de repositorio, página que llama a la propia API), usando solo la escala `CRITICAL`/`WARNING`/`SUGGESTION` (CA-5).

#### Scenario: Parche con dos violaciones (CA-5)
- **WHEN** el `revisor-reglas` revisa el parche de ejemplo con SQL fuera de la capa de repositorio y un `fetch` a la propia API desde una página
- **THEN** devuelve al menos dos hallazgos `CRITICAL`, uno por violación, cada uno con archivo y línea

#### Scenario: Escala de severidad (CA-5)
- **WHEN** el `revisor-reglas` devuelve hallazgos
- **THEN** cada hallazgo tiene una severidad `CRITICAL`, `WARNING` o `SUGGESTION`, y ninguna otra

### Requirement: Preparador bloquea issues resueltos
El `preparador` SHALL devolver `BLOQUEAR: ya resuelto` cuando el issue está cerrado, sin crear rama, worktree ni PR (CA-7).

#### Scenario: Issue cerrado (CA-7)
- **WHEN** el `preparador` recibe un issue cerrado
- **THEN** devuelve `BLOQUEAR: ya resuelto` y no existe ninguna rama, worktree ni PR nuevos para ese issue

### Requirement: Preparador deja el issue listo para el flujo
Para un issue abierto, el `preparador` SHALL crear (o reutilizar si ya existe) la rama de la historia y escribir en `<trabajo>` el issue con sus criterios numerados `CA-n` (CA-6).

#### Scenario: Issue abierto (CA-6)
- **WHEN** el `preparador` recibe un issue abierto
- **THEN** existe la rama `feature/issue-<n>-<slug>` en el checkout principal y `.flujo/issue-<n>/issue.md` contiene los criterios `CA-n` del issue

#### Scenario: Segunda corrida (CA-6)
- **WHEN** el `preparador` corre de nuevo sobre el mismo issue
- **THEN** reutiliza la rama y el `<trabajo>` existentes sin duplicarlos
````

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

### dashboard-de-lecturas

Muestra en un dashboard, a cualquier usuario con sesión, la última lectura y la gráfica de cada sensor y las alertas más recientes, para detectar de un vistazo qué parte de la red tiene problemas, y deja consultar las lecturas por la API.

````markdown
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

## Módulos y puntos de extensión

| Módulo | Puntos de extensión |
|---|---|
| aislamiento | paneles.ts |
| alertas | (ninguno) |
| auth | (ninguno) |
| dashboard | menu.ts |
| estado | (ninguno) |
| inicio | menu.ts |
| lecturas | (ninguno) |
| nodos | menu.ts |
| sensores | paneles.ts |
| simulador | paneles.ts |
| topologia | (ninguno) |
| ui | (ninguno) |

## Semillas

- db/seed/auth.sql
- db/seed/nodos.sql
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
| /api/lecturas | GET |
| /api/alertas | GET |
| /api/topologia | GET |
| /api/topologia/nodos/{id} | PUT |
| /api/topologia/enlaces | POST |
| /api/topologia/enlaces/{id} | DELETE |
| /api/estado | GET |
| /api/estado/nodos/{id} | GET |
