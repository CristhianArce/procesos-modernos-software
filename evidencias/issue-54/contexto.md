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
| centro-de-notificaciones | Permite que cada técnico consulte en un centro de notificaciones los avisos que tiene pendientes de atender, con el número de no leídas,… | Consulta de las notificaciones propias por la API; Aislamiento entre técnicos; Acceso restringido a técnicos con sesión; Centro de notificaciones en la interfaz; Notificaciones guardadas con copia del sensor; Marcar una notificación propia como leída por la API; Solo el destinatario marca su notificación; Marcado restringido a técnicos con sesión; Identificador de notificación validado; Marcar como leída desde el centro |
| dashboard-de-lecturas | Muestra en un dashboard, a cualquier usuario con sesión, la última lectura y la gráfica de cada sensor y las alertas más recientes, para… | Última lectura de cada sensor en el dashboard; Gráfica de cada sensor; Alertas en el dashboard; Consulta de lecturas por la API |
| despliegue-publico | Mantiene una instancia pública de la app, en un servicio gratuito, que ejecuta siempre la última imagen publicada por el CD, sin guardar… | Servicio público con la imagen publicada; Aviso a Render desde el CD; Secretos del servicio fuera del repositorio; Base de datos del servicio público; Migraciones y semillas en el CD |
| entorno-local | Permite que cualquier integrante levante la base de datos, aplique las migraciones y arranque la app en su portátil con `docker compose`,… | Arranque local completo; Variables obligatorias; Puertos del host que no chocan |
| entorno-sdd | Deja versionado y verificable el entorno de IA del repositorio: OpenSpec con las reglas mínimas del proyecto, las reglas que Claude Code… | Configuración de OpenSpec válida y sin claves duplicadas; Formato de specs exigido por la configuración; Reglas del proyecto disponibles en cada sesión; Comandos prohibidos rechazados por la configuración de permisos; Worktrees de historia sin confirmación y fuera de git; CI que valida la configuración en cada PR |
| exportacion-de-historico | Permite que un usuario con sesión descargue en CSV las lecturas del histórico que cumplen el filtro aplicado (nodo, sensor y rango de día… | Exportar a CSV las lecturas que cumplen el filtro; Formato del archivo CSV; Valores que no se ejecutan como fórmula; Tope de lecturas exportadas; Validación del filtro de exportación; Exportar exige sesión |
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

### Requirement: Marcar una notificación propia como leída por la API
`PATCH /api/notificaciones/{id}` SHALL marcar como leída la notificación indicada del técnico de la sesión y responder 200 con ella (`leida: true`). Después de marcarla, deja de contarse en `noLeidas` y sigue en la lista. Si ya estaba leída, MUST responder 200 sin cambiar nada (CA-1; RN-3, RN-4; Derivado: decisión #1).

#### Scenario: Marcar una no leída (CA-1)
- **WHEN** un técnico con dos notificaciones sin leer marca una de ellas con `PATCH /api/notificaciones/{id}`
- **THEN** la API responde 200 con esa notificación y `leida` igual a true, y `GET /api/notificaciones` devuelve `noLeidas` igual a 1 y la sigue incluyendo en la lista

#### Scenario: Marcar una ya leída (CA-1; RN-4)
- **WHEN** un técnico marca como leída una notificación suya que ya está leída
- **THEN** la API responde 200 con `leida` igual a true y `noLeidas` no cambia

#### Scenario: El cuerpo del cliente se ignora (CA-1; Derivado: decisión #1)
- **WHEN** un técnico envía el `PATCH` con un cuerpo como `{ "leida": false }`
- **THEN** la API responde 200 con `leida` igual a true

### Requirement: Solo el destinatario marca su notificación
El `PATCH` MUST tomar el destinatario de la sesión y MUST NOT cambiar una notificación de otro técnico. Una notificación ajena o un UUID que no existe SHALL responder 404 en JSON con el mensaje `Notificación no encontrada`, sin revelar si existe (CA-2; RN-1).

#### Scenario: Notificación de otro técnico (CA-2)
- **WHEN** un técnico intenta marcar como leída una notificación sin leer de otro técnico
- **THEN** la API responde 404 en JSON y esa notificación sigue sin leer

#### Scenario: Identificador inexistente (CA-2)
- **WHEN** un técnico marca un UUID que no corresponde a ninguna notificación
- **THEN** la API responde 404 en JSON con el mensaje `Notificación no encontrada`

### Requirement: Marcado restringido a técnicos con sesión
El `PATCH` SHALL responder 401 en JSON sin sesión y 403 en JSON a un administrador, antes de validar el identificador y sin cambiar ninguna notificación (CA-3; RN-2; Derivado: decisión #2).

#### Scenario: Visitante sin sesión (CA-3)
- **WHEN** un visitante sin sesión envía `PATCH /api/notificaciones/{id}`
- **THEN** la API responde 401 con un cuerpo JSON y la notificación no cambia

#### Scenario: Administrador (CA-3; RN-2; Derivado: decisión #2)
- **WHEN** un administrador con sesión envía `PATCH /api/notificaciones/{id}`
- **THEN** la API responde 403 con un cuerpo JSON y la notificación no cambia

### Requirement: Identificador de notificación validado
El identificador del `PATCH` MUST ser un UUID. Si un técnico con sesión envía uno con otro formato, la API SHALL responder 400 con el detalle de la validación y no cambiar nada (CA-4; Derivado: decisión #2).

#### Scenario: Identificador con formato inválido (CA-4)
- **WHEN** un técnico envía `PATCH /api/notificaciones/no-es-un-uuid`
- **THEN** la API responde 400 con `error` igual a `Datos inválidos` y el detalle del campo `id`

### Requirement: Marcar como leída desde el centro
El centro de notificaciones SHALL mostrar el botón «Marcar como leída» solo en las notificaciones sin leer. Al pulsarlo y responder la API 200, el centro MUST volver a leer los datos del servidor: la notificación aparece como «Leída», sigue en la lista y el contador de no leídas baja en uno. Si la API falla, SHALL mostrar el error en la notificación sin cambiar su estado (CA-1; RN-3; Derivado: decisión #3, #4).

#### Scenario: Marcar desde el centro (CA-1)
- **WHEN** un técnico abre `/notificaciones` y pulsa «Marcar como leída» en una notificación sin leer
- **THEN** la notificación sigue en la lista con el estado «Leída», sin botón, y el contador «N sin leer» baja en uno

#### Scenario: El estado persiste al recargar (CA-1; RN-3)
- **WHEN** el técnico recarga `/notificaciones` después de marcarla
- **THEN** la notificación sigue como «Leída» y el contador conserva el valor nuevo

#### Scenario: Notificaciones ya leídas (CA-1; RN-4)
- **WHEN** el centro muestra una notificación leída
- **THEN** esa notificación no muestra el botón «Marcar como leída»

#### Scenario: Fallo de la API (CA-1; Derivado: decisión #3)
- **WHEN** el técnico pulsa «Marcar como leída» y la API responde con error o no responde
- **THEN** la notificación muestra el mensaje de error como alerta y sigue «Sin leer»
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

### afectados-de-nodos

Permite que un administrador o un técnico vea, en la ficha de un nodo y por la API, qué usuarios o dispositivos ficticios dependen de ese nodo y cuántos son, para saber a quién afecta una falla o un corte antes de actuar. Solo lectura: agregar y quitar afectados lo cubren otras historias.

````markdown
### Requirement: Panel de afectados en la ficha del nodo

La ficha de un nodo SHALL mostrar un panel «Afectados» con el total de afectados del nodo y su lista de alias, ordenada alfabéticamente por alias y, entre alias repetidos, por su identificador (CA-1; Derivado: decisión #1). El panel MUST mostrarse tanto al administrador como al técnico (CA-2) y MUST declararse en `paneles.ts` del módulo, sin editar la página de la ficha (CA-1; Derivado: decisión #5).

#### Scenario: Nodo con afectados (CA-1)

- **WHEN** un usuario con sesión abre la ficha de un nodo que tiene afectados
- **THEN** el panel «Afectados» muestra el total de afectados del nodo
- **THEN** el panel muestra la lista de sus alias ordenada alfabéticamente (Derivado: decisión #1)

#### Scenario: Alias repetidos en un nodo (CA-1)

- **WHEN** un nodo tiene dos afectados con el mismo alias
- **THEN** la lista muestra ambos y el total los cuenta a los dos (Derivado: decisión #1)

#### Scenario: El administrador ve el panel (CA-2)

- **WHEN** un administrador abre la ficha de un nodo
- **THEN** ve el panel «Afectados» con la lista y el total

#### Scenario: El técnico ve el panel (CA-2)

- **WHEN** un técnico abre la ficha de un nodo
- **THEN** ve el panel «Afectados» con la misma lista y el mismo total que el administrador

#### Scenario: Nodo sin afectados en la ficha (CA-1, CA-3)

- **WHEN** un usuario con sesión abre la ficha de un nodo sin afectados
- **THEN** el panel muestra total 0 y un estado vacío en lugar de la lista (Derivado: decisión #5)

### Requirement: Consulta de afectados por la API

`GET /api/afectados?nodoId=<uuid>` SHALL responder 200 con `{ total, afectados: [{ id, alias }] }` al administrador y al técnico, con la lista en el mismo orden que el panel (CA-2, CA-3; Derivado: decisión #1, #4). La API MUST responder 404 si el nodo no existe y una lista vacía con total 0 si el nodo existe y no tiene afectados (CA-3). MUST responder 401 sin sesión y 400 si `nodoId` falta o no es un UUID (CA-3; Derivado: decisión #3).

#### Scenario: Consulta de un nodo con afectados (CA-2)

- **WHEN** un administrador o un técnico consulta los afectados de un nodo que tiene afectados
- **THEN** la API responde 200 con el total y la lista de `{ id, alias }` ordenada por alias

#### Scenario: Nodo inexistente (CA-3)

- **WHEN** se consultan los afectados de un UUID que no corresponde a ningún nodo
- **THEN** la API responde 404 con un error JSON

#### Scenario: Nodo existente sin afectados (CA-3)

- **WHEN** se consultan los afectados de un nodo que existe y no tiene afectados
- **THEN** la API responde 200 con `afectados` vacío y `total` 0

#### Scenario: Identificador mal formado o ausente (CA-3)

- **WHEN** se consultan los afectados con un `nodoId` que no es un UUID o sin `nodoId`
- **THEN** la API responde 400 con los detalles de validación (Derivado: decisión #3)

#### Scenario: Sin sesión (CA-2)

- **WHEN** se consultan los afectados sin sesión
- **THEN** la API responde 401 en JSON

### Requirement: Datos de un afectado

Cada afectado SHALL pertenecer a un solo nodo y tener como único dato un alias obligatorio de 1 a 80 caracteres, sin unicidad dentro del nodo (CA-1; Derivado: decisión #4). Eliminar un nodo MUST eliminar sus afectados (CA-3; Derivado: decisión #7).

#### Scenario: Afectado de un solo nodo (CA-1)

- **WHEN** se consultan los afectados de un nodo
- **THEN** la respuesta no incluye afectados de otros nodos

#### Scenario: Eliminar un nodo elimina sus afectados (CA-3)

- **WHEN** se elimina un nodo con afectados
- **THEN** el borrado no falla y no quedan filas de afectados de ese nodo (Derivado: decisión #7)
````

### inicio-de-sesion

Permite que un administrador o un técnico inicie y cierre sesión con su nombre de usuario y su contraseña, y que el tablero y la API reconozcan esa sesión y su rol, para que cada historia solo decida qué rol exige.

````markdown
### Requirement: Inicio de sesión con credenciales válidas
La API SHALL iniciar sesión con el nombre de usuario y la contraseña de un usuario registrado: MUST responder 200, crear la sesión en una cookie `httpOnly` y llevar a la persona al tablero desde la página `/login`. La sesión SHALL durar 8 horas y llevar el rol del usuario, que es `administrador` o `tecnico` (CA-1; Derivado: decisión #1, #5, #6).

#### Scenario: Credenciales correctas (CA-1)
- **WHEN** un usuario registrado envía su nombre de usuario y su contraseña correctos al login
- **THEN** la API responde 200 con su usuario y su rol, y la respuesta fija una cookie de sesión `httpOnly` que dura 8 horas

#### Scenario: La interfaz lleva al tablero (CA-1)
- **WHEN** una persona envía credenciales correctas desde la página `/login`
- **THEN** la interfaz la lleva al tablero y el menú corresponde a su rol

#### Scenario: Cuentas de demostración (CA-1)
- **WHEN** se carga la semilla de autenticación y se inicia sesión con cada cuenta de demostración documentada en el README
- **THEN** la cuenta del administrador obtiene el rol `administrador` y la del técnico el rol `tecnico`

### Requirement: Credenciales incorrectas sin pistas
La API SHALL responder 401 con el mismo mensaje cuando la contraseña es incorrecta y cuando el usuario no existe, y MUST NOT crear ninguna cookie de sesión. La contraseña SHALL guardarse solo como hash, y los registros del servidor MUST NOT incluir contraseñas ni tokens (CA-2; Derivado: decisión #2, #3).

#### Scenario: Contraseña incorrecta (CA-2)
- **WHEN** se envía el nombre de un usuario registrado con una contraseña que no le corresponde
- **THEN** la API responde 401 con el mensaje `Credenciales inválidas` y sin cabecera `Set-Cookie`

#### Scenario: Usuario inexistente (CA-2)
- **WHEN** se envía un nombre de usuario que no existe
- **THEN** la API responde 401 con exactamente el mismo mensaje y sin cabecera `Set-Cookie`

### Requirement: Validación del cuerpo del login
La API SHALL validar el cuerpo del login con Zod y responder 400 cuando falta el usuario o la contraseña, o cuando el cuerpo no es JSON; MUST NOT consultar la base de datos ni contar un intento fallido en ese caso (CA-3; Derivado: decisión #4, #7).

#### Scenario: Cuerpo sin usuario (CA-3)
- **WHEN** se llama al login con un cuerpo que no trae `usuario`
- **THEN** la API responde 400 con el detalle del campo faltante

#### Scenario: Cuerpo sin contraseña (CA-3)
- **WHEN** se llama al login con un cuerpo que no trae `contrasena`
- **THEN** la API responde 400 con el detalle del campo faltante

#### Scenario: Cuerpo que no es JSON (CA-3)
- **WHEN** se llama al login con un cuerpo que no se puede leer como JSON
- **THEN** la API responde 400 y no 500

### Requirement: Límite de intentos fallidos
La API SHALL responder 429, con la cabecera `Retry-After`, a un cliente que supere 5 intentos fallidos de login en un minuto, contados por IP y por nombre de usuario, y MUST responder 429 antes de verificar la contraseña aunque esta sea correcta (CA-4; Derivado: decisión #4).

#### Scenario: Sexto intento desde la misma IP (CA-4)
- **WHEN** una IP acumula 5 intentos fallidos de login dentro de un minuto y envía un intento más
- **THEN** la API responde 429 con `Retry-After` y no consulta la base de datos

#### Scenario: Sexto intento contra el mismo usuario (CA-4)
- **WHEN** un mismo nombre de usuario acumula 5 intentos fallidos dentro de un minuto, aunque vengan de IP distintas, y llega otro intento
- **THEN** la API responde 429, incluso con la contraseña correcta

#### Scenario: La ventana vence (CA-4)
- **WHEN** pasa un minuto desde el primer intento fallido contado
- **THEN** el cliente puede volver a intentar y recibe 401 o 200 según sus credenciales

### Requirement: Acceso con la sesión emitida por el login
Las páginas del tablero SHALL redirigir a `/login` a un visitante sin sesión, y las rutas `/api/...` protegidas MUST responder 401 en JSON, sin redirección, cuando no hay sesión válida. Una sesión emitida por el login SHALL ser reconocida por el tablero y por la API con el rol de su usuario (CA-5, CA-6; Derivado: decisión #8).

#### Scenario: Página del tablero sin sesión (CA-5)
- **WHEN** un visitante sin sesión abre una página del tablero
- **THEN** es redirigido a `/login`

#### Scenario: API protegida sin sesión (CA-5)
- **WHEN** un visitante sin sesión llama a una ruta `/api/...` protegida
- **THEN** recibe 401 en JSON y sin cabecera `Location`

#### Scenario: Sesión emitida por el login abre el tablero (CA-5)
- **WHEN** una persona inicia sesión y abre una página del tablero con la cookie recibida
- **THEN** la página se muestra sin redirección

### Requirement: Endpoints reservados a administradores
Una ruta reservada a administradores SHALL responder 403 en JSON y MUST NOT ejecutar la acción cuando la sesión es de un técnico (CA-6; Derivado: decisión #8).

#### Scenario: Técnico en una ruta de administrador (CA-6)
- **WHEN** el técnico de demostración inicia sesión y llama con su cookie a una ruta que exige `administrador`
- **THEN** recibe 403 en JSON y la acción no se ejecuta

#### Scenario: Administrador en la misma ruta (CA-6)
- **WHEN** el administrador de demostración inicia sesión y llama con su cookie a esa misma ruta
- **THEN** la acción se ejecuta y recibe 200

### Requirement: Cierre de sesión
La API SHALL cerrar la sesión eliminando la cookie, de modo que la siguiente llamada a una ruta protegida responda 401 (CA-7; Derivado: decisión #5).

#### Scenario: Cierre con sesión (CA-7)
- **WHEN** un usuario con sesión llama a `POST /api/auth/logout`
- **THEN** la API responde 200 y fija la cookie de sesión vencida

#### Scenario: La sesión cerrada ya no sirve (CA-7)
- **WHEN** el cliente repite una llamada a una ruta protegida con la cookie que recibió al cerrar sesión
- **THEN** recibe 401
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
| /api/historico/exportar | GET |
| /api/lecturas | GET |
| /api/alertas | GET |
| /api/notificaciones | GET |
| /api/notificaciones/{id} | PATCH |
| /api/topologia | GET |
| /api/topologia/nodos/{id} | PUT |
| /api/topologia/enlaces | POST |
| /api/topologia/enlaces/{id} | DELETE |
| /api/estado | GET |
| /api/estado/nodos/{id} | GET |
