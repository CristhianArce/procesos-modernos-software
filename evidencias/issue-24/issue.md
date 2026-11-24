# Issue #24: HU 7: Consultar las notificaciones

Estado: OPEN
Etiquetas: historia, clase, compleja

## Historia

Como técnico quiero consultar mis notificaciones en un centro de notificaciones para saber qué avisos tengo pendientes de atender.

## Contexto

**HU 7: Consultar las notificaciones**, fila 7 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#24](https://github.com/CristhianArce/procesos-modernos-software/issues/24).
Esta historia sale de dividir la HU 7 original ("Notificar a los técnicos cuando salta una alerta") en la HU 7, la HU 12 ([#44](https://github.com/CristhianArce/procesos-modernos-software/issues/44), suscriptor que crea las notificaciones) y la HU 13 ([#53](https://github.com/CristhianArce/procesos-modernos-software/issues/53), marcar como leída). Aquí quedan la tabla, la consulta y la página del centro. CA-1 es el CA-1 publicado antes (orden y no leídas); CA-2 es la mitad de CA-3 (aislamiento entre técnicos) y CA-3 es la mitad de CA-4 (consulta sin sesión).
Esta historia no depende de la HU 5: se construye y se prueba con notificaciones de la semilla y con las que insertan las propias pruebas. Los usuarios y la sesión de la HU 3 se reutilizan como están implementados, sin modificarlos.

## Criterios de aceptación

- **CA-1:** Dado un técnico con notificaciones, cuando abre el centro de notificaciones, entonces ve las suyas con la más reciente primero y el número de no leídas.
- **CA-2:** Dados dos técnicos, cuando uno consulta sus notificaciones, entonces no ve las del otro.
- **CA-3:** Dado un visitante sin sesión, cuando consulta las notificaciones por la API, entonces recibe 401 en JSON.

## Reglas de negocio

- **RN-1:** Las notificaciones se guardan en una tabla y se muestran en la interfaz; no hay correo ni servicios externos (propuesta, sección 4).
- **RN-2:** Cada notificación tiene un solo destinatario y lleva el nombre del sensor, la magnitud (voltaje, corriente o potencia), el valor y la fecha de la alerta que la originó, y si fue leída. No guarda el umbral ni el nodo.
- **RN-3:** El destinatario se toma de la sesión, nunca de un dato enviado por el cliente.
- **RN-4:** El centro de notificaciones es solo para técnicos; los administradores no reciben ni consultan notificaciones.
- **RN-5:** El sensor se guarda como copia de su nombre tal como venía en la alerta, no como clave foránea: la notificación se conserva aunque el sensor se elimine.
- **RN-6:** La lista se actualiza al recargar o navegar.

## Fuera de alcance

- Marcar notificaciones como leídas (lo cubre la HU 13).
- Crear notificaciones a partir de alertas reales (lo cubre la HU 12).
- Envío de correos, SMS o notificaciones push.
- Preferencias por técnico (silenciar, filtrar por nodo).
- Actualización en tiempo real por WebSocket.
- Borrar notificaciones.
- Actualización periódica de una página ya abierta.
- Mostrar el umbral o el nodo en la notificación.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/notificaciones/` · página `src/app/(tablero)/notificaciones/` · API `src/app/api/notificaciones/`.
- Endpoint sugerido: `GET /api/notificaciones` (lista propia y número de no leídas); se agrega a `contracts/openapi.yaml`.
- Datos: tabla propia `notificaciones` con migración Flyway y semilla `db/seed/notificaciones.sql` con notificaciones leídas y no leídas para la cuenta `tecnico` de la semilla de la HU 3. Se lee `usuarios` sin modificarla. La tabla incluye la columna de leída que usa la HU 13 y no lleva una unicidad global por alerta, que impediría notificar a otro técnico; la HU 12 no deduplica (su decisión 2).
- Roles y seguridad: `sessionFromRequest(req)`, `requireRole(sesion, "tecnico")` y `conHttp`.
- Pruebas: la semilla de la HU 3 trae un solo técnico y esta historia no la modifica, así que las pruebas de integración de CA-2 crean ellas mismas el segundo técnico y sus notificaciones.
- Puntos de extensión: `menu.ts`. No usa `on-alerta.ts` (queda para la HU 12).

### E2E futuro (no ejecutado)

Preparación: aplicación y BD de prueba migradas, con la semilla de la HU 3 y la de esta historia. El orden y el número de no leídas esperados se fijan a partir de la semilla antes del recorrido, sin usar la consulta de producción como oráculo.

1. Iniciar sesión como `tecnico` y abrir el centro: aparecen las notificaciones de la semilla, la más reciente primero, con el número de no leídas esperado.

Cobertura del recorrido: **CA-1**. **CA-2** y **CA-3** se cubren con pruebas de integración del handler.

## Decisiones de la HU 4 que aplican

La HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)) cerró sus preguntas abiertas el 2026-11-22. Lo que sigue es consecuencia de esas decisiones y no cambia los CA de esta historia.

- **Magnitudes y umbrales (decisiones 2 y 3):** cada lectura trae voltaje, corriente y potencia, y el umbral es un máximo por magnitud. El "valor" de la alerta que origina la notificación (RN-2) es el de la magnitud que superó su umbral; para que se entienda, la notificación guarda también esa magnitud (decisión 1 de esta historia).
- **Nombres sin unicidad (decisión 8):** dos sensores pueden llamarse igual. La notificación guarda una copia del nombre (decisión 5 de esta historia) y no pretende identificar al sensor.
- **Borrado en cascada (decisión 5):** al eliminar un nodo se eliminan sus sensores. Como la notificación guarda una copia del nombre y no una clave foránea, se conserva.

## Dependencias

- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20)): usuarios, roles y sesión.
- Sin dependencia de la HU 4: el sensor se guarda como copia del nombre (decisión 5), no como clave foránea a `sensores`.
- Sin dependencia de la HU 5 ni de las HU 6, 8, 9, 10 y 11. Las HU 12 y 13 dependen de esta.

## Decisiones tomadas

Resueltas por el equipo el 2026-11-22. Reemplazan a las preguntas abiertas de la versión anterior.

| # | Pregunta | Decisión | Alternativa descartada |
|---|---|---|---|
| 1 | Qué datos y texto lleva la notificación (PA-1) | Sensor, magnitud, valor y fecha. Evaluada por un agente independiente: con tres magnitudes por lectura el valor solo no se entiende, y ni el umbral ni el nodo los pide ningún CA; el nodo además haría depender la historia de la HU 4 | Además el umbral / además el nodo |
| 2 | Marcar todas como leídas (PA-2) | No; el marcado de una en una queda en la HU 13 | Un botón adicional |
| 3 | Actualizar una página ya abierta (PA-3) | Al recargar o navegar | Actualización periódica |
| 4 | Quién entra al centro (PA-4) | Solo técnicos; coincide con la decisión 1 de la HU 12 | También administradores |
| 5 | Cómo se guarda el sensor (PA-5) | Copia del nombre tal como venía en la alerta; la historia depende solo de la HU 3 | Clave foránea a `sensores` |

## Preguntas abiertas

Ninguna. Decididas en "Decisiones tomadas".

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.

## Criterios numerados

- **CA-1:** Dado un técnico con notificaciones, cuando abre el centro de notificaciones, entonces ve las suyas con la más reciente primero y el número de no leídas.
- **CA-2:** Dados dos técnicos, cuando uno consulta sus notificaciones, entonces no ve las del otro.
- **CA-3:** Dado un visitante sin sesión, cuando consulta las notificaciones por la API, entonces recibe 401 en JSON.
