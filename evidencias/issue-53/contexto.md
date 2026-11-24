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

### integracion-continua

Detecta de forma automática, en cada PR y con poco tiempo de espera, que una historia rompió la calidad del proyecto o la imagen, y revisa secretos y vulnerabilidades al fusionar en `main`.

````markdown
### Requirement: Validación de cada PR
El CI SHALL ejecutar en cada PR lint, typecheck, pruebas unitarias, pruebas de integración y build del proyecto, y marcar el check del PR en rojo si cualquiera falla (CA-3; Derivado: decisión #4).

#### Scenario: PR en verde (CA-3)
- **WHEN** se abre un PR cuyo código pasa lint, typecheck, pruebas y build
- **THEN** el job `proyecto` termina en verde y el PR puede fusionarse según los checks

#### Scenario: Un paso falla (CA-3)
- **WHEN** en un PR falla el lint, el typecheck, una prueba o el build
- **THEN** el job `proyecto` termina en rojo, los pasos siguientes no corren y el check del PR queda en rojo

### Requirement: La imagen se construye y arranca en cada PR
El CI SHALL construir la imagen de Docker en cada PR sin publicarla y comprobar que arranca y responde 200 en `/api/health` (CA-3; Derivado: decisión #5).

#### Scenario: Imagen que arranca (CA-3)
- **WHEN** se abre un PR y el job `imagen` construye la imagen y la ejecuta con valores de relleno para las variables
- **THEN** `GET /api/health` responde 200 antes de 30 intentos y el job termina en verde sin publicar nada

#### Scenario: Imagen que no arranca (CA-3)
- **WHEN** la imagen no responde 200 en `/api/health` tras 30 intentos
- **THEN** el job muestra los logs del contenedor y termina en rojo

### Requirement: Controles de seguridad solo al fusionar en main
El CI SHALL ejecutar gitleaks sobre el historial y `npm audit` con nivel alto o crítico en cada push a `main`, y fallar si encuentra un secreto o una vulnerabilidad de ese nivel; en un PR esos controles MUST NOT correr (CA-4; Derivado: decisión #4).

#### Scenario: Push a main (CA-4)
- **WHEN** se fusiona un PR en `main`
- **THEN** el job `seguridad` corre gitleaks sobre el historial completo y `npm audit --audit-level=high`, y termina en verde si no hay hallazgos

#### Scenario: Hallazgo de seguridad (CA-4)
- **WHEN** gitleaks detecta un secreto o `npm audit` una vulnerabilidad alta o crítica en un push a `main`
- **THEN** el job `seguridad` termina en rojo

#### Scenario: PR sin controles de seguridad (CA-4)
- **WHEN** corre el CI de un PR
- **THEN** el job `seguridad` no se ejecuta
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
