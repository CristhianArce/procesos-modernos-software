# Spec Delta

## Purpose

Permite que un técnico consulte en un centro de notificaciones los avisos que tiene pendientes de atender, sin ver los de otros técnicos y sin que los administradores ni los visitantes accedan a ellos.

## ADDED Requirements

### Requirement: Consulta de las notificaciones propias
El sistema SHALL devolver al técnico autenticado sus notificaciones, de la más reciente a la más antigua, junto con el número de las no leídas. Cada notificación MUST llevar el nombre del sensor, la magnitud (voltaje, corriente o potencia), el valor, la fecha de la alerta que la originó y si fue leída, y NO MUST incluir el umbral ni el nodo (CA-1; Derivado: decisión #1).

#### Scenario: Lista ordenada y con no leídas
- **WHEN** un técnico con notificaciones leídas y no leídas consulta `GET /api/notificaciones` o abre la página del centro (CA-1)
- **THEN** recibe sus notificaciones con la más reciente primero y el número de no leídas igual a las que tienen leída en falso (CA-1)

#### Scenario: Técnico sin notificaciones
- **WHEN** un técnico sin notificaciones abre el centro (CA-1)
- **THEN** la lista llega vacía, el número de no leídas es 0 y la página muestra el estado vacío (CA-1)

### Requirement: Destinatario tomado de la sesión
El sistema SHALL tomar el destinatario de la sesión y MUST ignorar cualquier identificador de usuario que envíe el cliente, de modo que un técnico solo vea las notificaciones dirigidas a él (CA-2; RN-3).

#### Scenario: Un técnico no ve las del otro
- **WHEN** dos técnicos tienen notificaciones y uno de ellos consulta las suyas (CA-2)
- **THEN** la respuesta contiene solo sus notificaciones y el número de no leídas cuenta solo las suyas (CA-2)

#### Scenario: Un parámetro del cliente no cambia el destinatario
- **WHEN** un técnico consulta `GET /api/notificaciones` con un identificador de otro usuario en la consulta (CA-2)
- **THEN** la respuesta sigue siendo la de su propia sesión (CA-2)

### Requirement: Acceso solo para técnicos autenticados
El sistema SHALL responder 401 en JSON al visitante sin sesión y 403 en JSON al administrador cuando consulten la API de notificaciones, y la página del centro MUST llevar al login sin sesión (CA-3; Derivado: decisión #4).

#### Scenario: Visitante sin sesión
- **WHEN** un visitante sin sesión consulta `GET /api/notificaciones` (CA-3)
- **THEN** recibe 401 con cuerpo JSON (CA-3)

#### Scenario: Administrador
- **WHEN** un administrador consulta `GET /api/notificaciones` (Derivado: decisión #4)
- **THEN** recibe 403 con cuerpo JSON y el menú no le muestra el centro de notificaciones (Derivado: decisión #4)

### Requirement: Notificación independiente del sensor
El sistema SHALL guardar el sensor de la notificación como copia de su nombre, de modo que la notificación se conserve si el sensor o su nodo se eliminan (CA-1; Derivado: decisión #5).

#### Scenario: Sensor eliminado
- **WHEN** se elimina el sensor cuyo nombre guarda una notificación (Derivado: decisión #5)
- **THEN** la notificación sigue apareciendo en la lista del técnico con el mismo nombre de sensor (CA-1)

### Requirement: Lista actualizada al recargar
La página del centro de notificaciones SHALL mostrar los datos al cargarse y MUST NOT consultarlos de forma periódica; la lista se actualiza al recargar o navegar (CA-1; Derivado: decisión #3).

#### Scenario: Notificación nueva tras recargar
- **WHEN** se inserta una notificación para un técnico con el centro ya abierto y luego recarga la página (Derivado: decisión #3)
- **THEN** la nueva notificación aparece en primer lugar (CA-1)
