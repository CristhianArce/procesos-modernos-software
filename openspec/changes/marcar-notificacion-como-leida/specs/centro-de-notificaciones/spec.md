# Spec Delta

## ADDED Requirements

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
