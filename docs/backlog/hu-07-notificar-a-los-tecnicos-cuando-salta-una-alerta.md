## Historia

Como técnico quiero recibir una notificación en la interfaz cuando salta una alerta de umbral para enterarme de una falla sin tener el dashboard abierto.

## Contexto

Es la HU 7 de la propuesta (sección 5), historia de clase. La HU 5 registra las alertas y ofrece el punto de enganche `on-alerta.ts`; hoy nadie avisa a los técnicos. Esta historia crea el módulo `notificaciones`, que se suscribe a las alertas sin editar el módulo de alertas, guarda cada notificación en su propia tabla y la muestra en un centro de notificaciones. No envía correo ni usa servicios externos.

## Criterios de aceptación

- **CA-1:** Dada una alerta de umbral que se registra, cuando el servicio de alertas avisa a sus suscriptores, entonces se crea una notificación para cada técnico con el sensor, el valor y la fecha de la alerta.
- **CA-2:** Dado un técnico con notificaciones, cuando abre el centro de notificaciones, entonces ve las suyas con la más reciente primero y el número de no leídas.
- **CA-3:** Dada una notificación no leída, cuando el técnico la marca como leída, entonces deja de contarse entre las no leídas y sigue en la lista.
- **CA-4:** Dados dos técnicos, cuando uno consulta sus notificaciones, entonces no ve las del otro, y si intenta marcar una ajena como leída recibe 404.
- **CA-5:** Dado un visitante sin sesión, cuando consulta o marca notificaciones por la API, entonces recibe 401 en JSON.
- **CA-6:** Dado un identificador de notificación con formato inválido, cuando se intenta marcar como leída, entonces la API responde 400 por la validación de Zod.

## Reglas de negocio

- **RN-1:** Las notificaciones se guardan en una tabla y se muestran en la interfaz; no hay correo ni servicios externos (propuesta, sección 4).
- **RN-2:** La suscripción se hace solo por `on-alerta.ts`: no se edita el módulo de alertas.

## Fuera de alcance

- Envío de correos, SMS o notificaciones push.
- Preferencias por técnico (silenciar, filtrar por nodo).
- Actualización en tiempo real por WebSocket.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/notificaciones/` con `on-alerta.ts` · centro de notificaciones en `src/app/(tablero)/notificaciones/` con ítem de menú por `menu.ts`.
- Endpoints sugeridos: `GET /api/notificaciones` y `PATCH /api/notificaciones/{id}` (se agregan a `contracts/openapi.yaml`), con `sessionFromRequest` y `requireRole`.
- Datos: tabla propia `notificaciones` con migración Flyway; semilla `db/seed/notificaciones.sql`. Lee `usuarios` sin modificarla.
- Puntos de extensión: `menu.ts` y `on-alerta.ts`.
- Contador de negocio opcional: `notificaciones_creadas_total`.

## Dependencias

- HU 5 (#22: dashboard y alertas por umbral).

## Preguntas abiertas

- ¿Quién recibe la notificación? — opciones: todos los técnicos / también los administradores / solo el técnico asignado al nodo (depende de la HU 10, que es independiente). CA-1 asume todos los técnicos.
- ¿Qué texto lleva la notificación? — opciones: un texto fijo con sensor, valor y umbral / el nombre del nodo incluido.
- ¿Se puede marcar todas como leídas de una vez? — opciones: no en esta historia / sí, con un botón.
- ¿Cómo se entera el técnico de una notificación nueva con la página abierta? — opciones: al recargar o navegar / actualización periódica cada cierto intervalo.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
