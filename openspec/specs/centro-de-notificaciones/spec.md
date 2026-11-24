# centro-de-notificaciones Specification

## Purpose
Permite que cada técnico consulte en un centro de notificaciones los avisos que tiene pendientes de atender, con el número de no leídas, sin ver los de otros técnicos y sin correo ni servicios externos.

## Requirements

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
