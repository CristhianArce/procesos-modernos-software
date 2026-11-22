## Historia

Como técnico quiero consultar mis notificaciones en un centro de notificaciones y marcarlas como leídas para saber qué avisos tengo pendientes de atender.

## Contexto

**HU 7: Consultar y marcar como leídas las notificaciones**, fila 7 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#24](https://github.com/CristhianArce/procesos-modernos-software/issues/24).
Esta historia sale de dividir la HU 7 original ("Notificar a los técnicos cuando salta una alerta") en dos: aquí queda el centro de notificaciones (tabla, consulta y marcado) y en la HU 12 el suscriptor que crea las notificaciones cuando salta una alerta. CA-1 a CA-5 son los CA-2 a CA-6 publicados en #24, sin cambios de texto.
Con el corte, esta historia deja de depender de la HU 5: se construye y se prueba con notificaciones de la semilla y con las que insertan las propias pruebas. Hasta que la HU 12 se fusione, el centro solo muestra esas notificaciones. Los usuarios y la sesión de la HU 3 se reutilizan como están implementados, sin modificarlos.

## Criterios de aceptación

- **CA-1:** Dado un técnico con notificaciones, cuando abre el centro de notificaciones, entonces ve las suyas con la más reciente primero y el número de no leídas.
- **CA-2:** Dada una notificación no leída, cuando el técnico la marca como leída, entonces deja de contarse entre las no leídas y sigue en la lista.
- **CA-3:** Dados dos técnicos, cuando uno consulta sus notificaciones, entonces no ve las del otro, y si intenta marcar una ajena como leída recibe 404.
- **CA-4:** Dado un visitante sin sesión, cuando consulta o marca notificaciones por la API, entonces recibe 401 en JSON.
- **CA-5:** Dado un identificador de notificación con formato inválido, cuando se intenta marcar como leída, entonces la API responde 400 por la validación de Zod.

## Reglas de negocio

- **RN-1:** Las notificaciones se guardan en una tabla y se muestran en la interfaz; no hay correo ni servicios externos (propuesta, sección 4).
- **RN-2:** Cada notificación tiene un solo destinatario y lleva el sensor, el valor y la fecha de la alerta que la originó, y si fue leída.
- **RN-3:** El destinatario se toma de la sesión, nunca de un dato enviado por el cliente.

## Fuera de alcance

- Crear notificaciones a partir de alertas reales (lo cubre la HU 12).
- Envío de correos, SMS o notificaciones push.
- Preferencias por técnico (silenciar, filtrar por nodo).
- Actualización en tiempo real por WebSocket.
- Borrar notificaciones.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/notificaciones/` · página `src/app/(tablero)/notificaciones/` · API `src/app/api/notificaciones/`.
- Endpoints sugeridos: `GET /api/notificaciones` (lista propia y número de no leídas) y `PATCH /api/notificaciones/{id}` (marcar como leída); se agregan a `contracts/openapi.yaml`.
- Datos: tabla propia `notificaciones` con migración Flyway y semilla `db/seed/notificaciones.sql` con notificaciones leídas y no leídas para la cuenta `tecnico` de la semilla de la HU 3. Se lee `usuarios` sin modificarla. La tabla no lleva una unicidad global por alerta, que impediría notificar a otro técnico; si la HU 12 necesita una columna para identificar la alerta, la agrega con su propia migración.
- Roles y seguridad: `sessionFromRequest(req)`, `requireRole(sesion, "tecnico")` y `conHttp`. Una notificación ajena responde 404 (CA-3), sin revelar que existe ni cambiar su estado.
- Pruebas: la semilla de la HU 3 trae un solo técnico y esta historia no la modifica, así que las pruebas de integración de CA-3 crean ellas mismas el segundo técnico y sus notificaciones.
- Puntos de extensión: `menu.ts`. No usa `on-alerta.ts` (queda para la HU 12).

### E2E futuro (no ejecutado)

Preparación: aplicación y BD de prueba migradas, con la semilla de la HU 3 y la de esta historia. El orden y el número de no leídas esperados se fijan a partir de la semilla antes del recorrido, sin usar la consulta de producción como oráculo.

1. Iniciar sesión como `tecnico` y abrir el centro: aparecen las notificaciones de la semilla, la más reciente primero, con el número de no leídas esperado.
2. Marcar como leída una no leída: sigue en la lista y el contador baja en uno. Recargar: el estado y el contador se conservan.

Cobertura del recorrido: **CA-1 y CA-2**. **CA-3**, **CA-4** y **CA-5** se cubren con pruebas de integración de los handlers.

## Dependencias

- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20)): usuarios, roles y sesión.
- HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)) solo si PA-5 decide referenciar el sensor por clave foránea.
- Sin dependencia de la HU 5 ni de las HU 6, 8, 9, 10 y 11.

## Preguntas abiertas

- **PA-1:** ¿Qué texto acompaña al sensor, el valor y la fecha? — opciones: texto con sensor, valor y umbral / incluir también el nodo. (PA-2 de #24.)
- **PA-2:** ¿Se pueden marcar todas como leídas a la vez? — opciones: no en esta historia / un botón adicional. (PA-3 de #24.)
- **PA-3:** ¿Cómo se actualiza una página ya abierta? — opciones: al recargar o navegar / actualización periódica. (PA-4 de #24.)
- **PA-4:** ¿Quién entra al centro de notificaciones? — opciones: solo técnicos / también administradores. Los CA asumen técnicos; debe coincidir con los destinatarios que decida la HU 12 (PA-1 de #24).
- **PA-5:** ¿Cómo se guarda el sensor en la notificación? — opciones: copia del nombre del sensor tal como venía en la alerta (la historia depende solo de la HU 3) / clave foránea a `sensores` (pasa a depender de la HU 4).

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
