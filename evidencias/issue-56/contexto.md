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

### historico-de-lecturas

Permite que cualquier usuario con sesión consulte el histórico de lecturas de la red, paginado y con filtros por nodo, sensor y rango de fechas, para analizar el comportamiento de un sensor fuera del dashboard. Solo lectura: no escribe ninguna tabla.

````markdown
### Requirement: Consulta paginada del histórico

`GET /api/historico` SHALL responder 200 a un usuario con sesión con `{ pagina, porPagina, total, totalPaginas, lecturas }`: como máximo 25 lecturas, la más reciente primero (CA-1; RN-2; Derivado: decisión #5). Cada lectura MUST traer nodo, sensor, voltaje, corriente, potencia y `tomadaEn` en ISO 8601 (CA-1; Derivado: decisión #3, #7). La consulta MUST NOT escribir ninguna tabla (CA-1; RN-1).

#### Scenario: Primera página (CA-1)

- **WHEN** un usuario con sesión consulta el histórico sin filtros y hay más de 25 lecturas
- **THEN** la API responde 200 con 25 lecturas, la de `tomadaEn` más reciente primero, `pagina` 1, `porPagina` 25 y el `total` de lecturas

#### Scenario: Página siguiente (CA-1)

- **WHEN** se consulta `pagina=2` de un filtro con 26 lecturas
- **THEN** la API responde con la lectura número 26, la más antigua, y `totalPaginas` 2

#### Scenario: Página posterior a la última (CA-1)

- **WHEN** se consulta una página mayor que `totalPaginas`
- **THEN** la API responde 200 con `lecturas` vacía y el mismo `total` (Derivado: decisión #5)

#### Scenario: Técnico y administrador (CA-1)

- **WHEN** un técnico y un administrador consultan el histórico con los mismos filtros
- **THEN** ambos reciben la misma respuesta

### Requirement: Filtros combinados

El histórico SHALL filtrar por `nodoId`, `sensorId` (identificadores) y días `desde` y `hasta` (`AAAA-MM-DD`), y una lectura MUST aparecer solo si cumple todas las condiciones (CA-2; RN-3). Los días se interpretan en la hora de Bogotá e incluyen ambos extremos (CA-2; Derivado: decisión #1, #2, #3). Un parámetro vacío equivale a no filtrar por él (CA-2; Derivado: decisión #8).

#### Scenario: Filtro por nodo, sensor y fechas (CA-2)

- **WHEN** se filtra por un nodo, uno de sus sensores y un rango de días
- **THEN** solo aparecen lecturas de ese sensor, de ese nodo, tomadas entre las 00:00 de `desde` y el final de `hasta` en la hora de Bogotá

#### Scenario: Borde del día en la hora de Bogotá (CA-2)

- **WHEN** una lectura se tomó a las 23:30 de Bogotá del día anterior a `desde`, ya en `desde` según UTC
- **THEN** esa lectura no aparece (Derivado: decisión #3)

#### Scenario: Un solo día (CA-2)

- **WHEN** `desde` y `hasta` son el mismo día
- **THEN** aparecen solo las lecturas de ese día (Derivado: decisión #2)

### Requirement: Filtro sin resultados

Un filtro que no coincide con ninguna lectura SHALL responder 200 con `lecturas` vacía y `total` 0, también cuando el nodo o el sensor no existen o el sensor no es del nodo filtrado (CA-3; Derivado: decisión #4).

#### Scenario: Rango sin lecturas (CA-3)

- **WHEN** se filtra por un rango de días sin lecturas
- **THEN** la API responde 200 con `lecturas` vacía, `total` 0 y `totalPaginas` 0

#### Scenario: Identificador que no existe (CA-3)

- **WHEN** se filtra por un `nodoId` o `sensorId` bien formado que no existe, o por un sensor de otro nodo
- **THEN** la API responde 200 con `lecturas` vacía (Derivado: decisión #4)

### Requirement: Validación de los filtros

La API MUST responder 400 con los detalles de Zod si `desde` o `hasta` no son una fecha `AAAA-MM-DD` válida, si `desde` es posterior a `hasta`, si `nodoId` o `sensorId` no son UUID o si `pagina` no es un entero mayor o igual a 1 (CA-4; Derivado: decisión #2, #5).

#### Scenario: Fecha mal formada (CA-4)

- **WHEN** se consulta con `desde=2026-13-40` o `hasta=ayer`
- **THEN** la API responde 400 con `detalles`

#### Scenario: Rango invertido (CA-4)

- **WHEN** se consulta con `desde` posterior a `hasta`
- **THEN** la API responde 400 con `detalles`

#### Scenario: Página o identificador inválido (CA-4)

- **WHEN** se consulta con `pagina=0`, `pagina=abc` o un `nodoId` que no es UUID
- **THEN** la API responde 400 con `detalles` (Derivado: decisión #5)

### Requirement: Acceso con sesión

`GET /api/historico` MUST responder 401 en JSON sin sesión (CA-5).

#### Scenario: Visitante sin sesión (CA-5)

- **WHEN** un visitante sin sesión consulta `GET /api/historico`
- **THEN** la API responde 401 con un cuerpo JSON

### Requirement: Página del histórico

La página `/historico` SHALL mostrar el formulario de filtros, la tabla de la página actual con fechas en la hora de Bogotá, el total y enlaces de página que conservan los filtros (CA-1, CA-2; Derivado: decisión #7, #8). MUST mostrar un estado vacío sin resultados (CA-3) y un error de validación sin tabla con filtros inválidos (CA-4). El menú SHALL incluir «Histórico» para ambos roles (CA-1; Derivado: decisión #9).

#### Scenario: Recorrido de filtros y páginas (CA-1, CA-2)

- **WHEN** un usuario filtra por el nodo y el sensor de la semilla del histórico y su rango de días
- **THEN** la primera página muestra 25 lecturas, la más reciente primero, y la segunda la lectura restante

#### Scenario: Sin resultados en la página (CA-3)

- **WHEN** el filtro no coincide con ninguna lectura
- **THEN** la página muestra el estado vacío y no muestra la tabla

#### Scenario: Filtros inválidos en la página (CA-4)

- **WHEN** la página se abre con `desde` posterior a `hasta`
- **THEN** muestra el mensaje de filtros inválidos y no muestra la tabla

#### Scenario: Entrada del menú (CA-1)

- **WHEN** se filtra el menú para un administrador y para un técnico
- **THEN** ambos ven «Histórico»
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

### centro-de-notificaciones

Permite que cada técnico consulte en un centro de notificaciones los avisos que tiene pendientes de atender, con el número de no leídas, sin ver los de otros técnicos y sin correo ni servicios externos.

````markdown
### Requirement: Consulta de las notificaciones propias por la API
`GET /api/notificaciones` SHALL responder 200, a un técnico con sesión, con `noLeidas` (cuántas de sus notificaciones no están leídas) y `notificaciones` (a lo sumo las 50 más recientes), de la más reciente a la más antigua. Cada una MUST traer id, sensor (copia del nombre), magnitud, valor, fecha de la alerta (`creadaEn`) y si fue leída (`leida`) (CA-1; RN-2; Derivado: decisión #1, #2).

#### Scenario: Notificaciones de un técnico (CA-1)
- **WHEN** un técnico con tres notificaciones, dos sin leer, consulta `GET /api/notificaciones`
- **THEN** la API responde 200 con `noLeidas` igual a 2 y sus tres notificaciones, la de fecha más reciente primero, cada una con sensor, magnitud, valor, fecha y `leida`

#### Scenario: Técnico sin notificaciones (CA-1)
- **WHEN** un técnico sin notificaciones consulta `GET /api/notificaciones`
- **THEN** la API responde 200 con `noLeidas` igual a 0 y `notificaciones` vacía

#### Scenario: Más de 50 notificaciones (CA-1; Derivado: decisión #1)
- **WHEN** un técnico con 60 notificaciones, 55 sin leer, consulta `GET /api/notificaciones`
- **THEN** la API responde 200 con sus 50 más recientes y `noLeidas` igual a 55

### Requirement: Aislamiento entre técnicos
`GET /api/notificaciones` MUST tomar el destinatario de la sesión y MUST NOT aceptar un destinatario enviado por el cliente. La respuesta SHALL contener únicamente notificaciones del técnico de la sesión y contar solo las suyas como no leídas (CA-2; RN-3).

#### Scenario: Dos técnicos con notificaciones (CA-2)
- **WHEN** dos técnicos tienen notificaciones propias y uno de ellos consulta `GET /api/notificaciones`
- **THEN** la respuesta no incluye ninguna notificación del otro y `noLeidas` cuenta solo las del que consulta

#### Scenario: Destinatario enviado por el cliente (CA-2)
- **WHEN** un técnico consulta `GET /api/notificaciones?destinatarioId=<id de otro técnico>`
- **THEN** la API ignora el parámetro y responde solo con las notificaciones del técnico de la sesión

### Requirement: Acceso restringido a técnicos con sesión
`GET /api/notificaciones` SHALL responder 401 con un cuerpo JSON sin sesión, y 403 con un cuerpo JSON a un administrador, porque el centro de notificaciones es solo para técnicos (CA-3; RN-4; Derivado: decisión #3).

#### Scenario: Visitante sin sesión (CA-3)
- **WHEN** un visitante sin sesión consulta `GET /api/notificaciones`
- **THEN** la API responde 401 con un cuerpo JSON

#### Scenario: Administrador (CA-3; Derivado: decisión #3)
- **WHEN** un administrador con sesión consulta `GET /api/notificaciones`
- **THEN** la API responde 403 con un cuerpo JSON y ninguna notificación

### Requirement: Centro de notificaciones en la interfaz
La página `/notificaciones` SHALL mostrar a un técnico sus notificaciones, la más reciente primero, con el sensor, la magnitud, el valor con su unidad, la fecha en es-CO (zona `America/Bogota`) y si está leída o sin leer, y el número de no leídas. Sin notificaciones MUST mostrar un estado vacío. El menú SHALL incluir «Notificaciones» solo para técnicos, y un administrador que abra la página SHALL ser redirigido al inicio (CA-1; RN-1, RN-4, RN-6; Derivado: decisión #3).

#### Scenario: Técnico abre el centro (CA-1)
- **WHEN** un técnico con notificaciones abre `/notificaciones`
- **THEN** ve el número de no leídas y sus notificaciones, la más reciente primero, cada una con sensor, magnitud, valor, fecha y estado de lectura

#### Scenario: Centro sin notificaciones (CA-1)
- **WHEN** un técnico sin notificaciones abre `/notificaciones`
- **THEN** ve el mensaje de que no tiene notificaciones y el número de no leídas en 0

#### Scenario: Entrada del menú por rol (CA-1; Derivado: decisión #3)
- **WHEN** se filtra el menú para un técnico y para un administrador
- **THEN** «Notificaciones» aparece solo para el técnico

#### Scenario: Administrador abre la página (CA-3; Derivado: decisión #3)
- **WHEN** un administrador abre `/notificaciones`
- **THEN** es redirigido al inicio y no ve notificaciones

### Requirement: Notificaciones guardadas con copia del sensor
El sistema SHALL guardar cada notificación con un solo destinatario (un usuario), la copia del nombre del sensor, la magnitud, el valor, la fecha de la alerta y la marca de leída, sin umbral ni nodo y sin clave foránea al sensor, de modo que se conserve al eliminar el sensor o su nodo (CA-1; RN-2, RN-5; Derivado: decisión #4).

#### Scenario: Se elimina el sensor de origen (CA-1)
- **WHEN** se elimina el sensor cuyo nombre guarda una notificación
- **THEN** la notificación sigue existiendo y la consulta la devuelve con el nombre copiado

#### Scenario: Semilla de demostración (CA-1; Derivado: decisión #4)
- **WHEN** se aplica la semilla de notificaciones, dos veces seguidas, con las cuentas de la semilla de la HU 3
- **THEN** la cuenta `tecnico` tiene notificaciones leídas y sin leer, sin duplicados, y la cuenta `admin` no tiene ninguna
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
