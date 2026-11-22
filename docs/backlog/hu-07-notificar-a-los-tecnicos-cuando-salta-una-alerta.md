## Historia

Como técnico quiero recibir una notificación en la interfaz cuando salta una alerta de umbral para enterarme de una falla sin tener el dashboard abierto.

## Contexto

**HU 7: Notificar a los técnicos cuando salta una alerta**, fila 7 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#24](https://github.com/CristhianArce/procesos-modernos-software/issues/24); documento canónico: `docs/backlog/hu-07-notificar-a-los-tecnicos-cuando-salta-una-alerta.md` ([main fijado](https://github.com/CristhianArce/procesos-modernos-software/blob/6134fcef5867ad08149450e024b5069a3a761843/docs/backlog/hu-07-notificar-a-los-tecnicos-cuando-salta-una-alerta.md)).
Se conservan los seis CA publicados y se documenta el recorrido de notificaciones individuales, orden, contador de no leídas y marcado persistente.
La red eléctrica es simulada, sin equipos reales. HU 5 debe originar una alerta real de la aplicación y llamar a los suscriptores; el descubrimiento del registro no demuestra que esa emisión o su contrato estén implementados.

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
- Infraestructura nueva de entrega, cambios al módulo de alertas o supuestos de asignación de HU 10 no acordados.

## Notas técnicas (no vinculantes)

- Módulo `src/modulos/notificaciones/` con `on-alerta.ts`; centro en `src/app/(tablero)/notificaciones/` y extensión `menu.ts`. Endpoints sugeridos oficiales: `GET /api/notificaciones` y `PATCH /api/notificaciones/{id}`, documentados posteriormente en `contracts/openapi.yaml`.
- Datos y propiedad: tabla propia `notificaciones`, migración Flyway y semilla `db/seed/notificaciones.sql`. La notificación tiene destinatario individual, sensor/valor/fecha de origen y estado de lectura conforme a los CA; sus columnas y tipos deben verificarse en el diseño real. Se lee `usuarios` de HU 3 sin modificarla. No se sustituye por una bandeja compartida ni por una unicidad global de alerta que impediría la notificación de otro técnico.
- Roles y seguridad: reutilizar sesión real, `sessionFromRequest(req)`, `requireRole(sesion, "tecnico")` para el acceso técnico de los CA y `conHttp`; el destinatario se obtiene de la sesión, no del identificador aportado por el cliente. Consultar y marcar se autorizan en servidor; una notificación ajena devuelve 404 según CA-4, sin revelar datos ni alterar su estado. La ampliación a administradores es una pregunta de la fuente, no un acuerdo.
- Integración real: `src/nav/registro.ts` descubre `onAlerta` y su tipo actual es `manejar(alerta: unknown)`; no garantiza ID, payload, emisión tras persistencia, manejo de fallos ni reentrega. HU 5 debe aportar contrato e invocación reales. No se edita su módulo ni se añaden colas, outbox, trabajos programados o infraestructura de entrega para resolver la ausencia. SQL solo en `repo.ts`, handlers delgados con Zod, páginas al servicio y componentes a API relativa; sin Server Actions ni cambios al núcleo.
- Recomendación pendiente, no RN aprobada: ante repetición, la identidad candidata es `(alerta, técnico)`, no solo alerta. Si PA-5 acuerda deduplicación, probar por separado reentregas secuenciales y simultáneas iniciales con el mismo par, una notificación para T1 y otra para T2, y dos alertas distintas conservadas. No se declara unicidad ni reintento automáticos antes de ese acuerdo; el test de repetición no sustituye el E2E real.
- Contratos y trazabilidad: checkout y árbol remoto fijado aún no contienen login, usuarios de dominio, lecturas ni alertas implementadas; existen los ayudantes generales y registro, no las entregas de HU 3–5. La identidad de destinatario es individual; la repetición por alerta/técnico permanece condicionada al acuerdo documentado. Los CA se mantienen textuales, sin añadir infraestructura ni dar por resueltos los fallos de emisión. Todo E2E y test descrito es futuro; no se implementó ni ejecutó.

### E2E futuro (no ejecutado)

Preparación: navegador, servidor/API y BD de prueba reales y migrados; T1/T2 son técnicos reales de prueba y empiezan sin notificaciones. Los responsables de HU 4 y HU 5 deben acordar cómo producir por su flujo real dos lecturas conocidas que generen alertas A1/A2 con fechas distintas F1 < F2 y sensor/valores esperados. Estas constantes y la expectativa `[A2, A1]` se fijan con los datos de prueba antes del recorrido, sin reutilizar el orden o filtro de producción. El contrato para obtener esos datos aún está pendiente.

1. Autenticarse realmente con el rol que HU 4 permita y provocar las dos alertas por el flujo real de lectura y registro de HU 4/HU 5. Dejar que la emisión real y `on-alerta.ts` generen una notificación individual por técnico para cada alerta. No insertar notificaciones ni llamar manualmente al suscriptor como sustituto.
2. Abrir sesiones reales separadas de T1 y T2. Cada centro muestra sus dos notificaciones con sensor, valor y fecha correctos, orden `[A2, A1]` y contador de no leídas 2. Cada técnico ve sus registros destinatarios, no los identificadores de notificación del otro.
3. T1 marca como leída su notificación de A2: sigue en su lista y el contador pasa a 1. Recargar: la lectura persiste, el orden se conserva y el contador sigue en 1. T2 conserva sus dos no leídas.
4. Desde la sesión real de T1 intentar por API marcar la notificación de T2. Esperar 404 y comprobar que la lista, estado y contador de T2 no cambian.

Cobertura principal diseñada: **CA-1 a CA-4**. **CA-5** (consulta/marcado sin sesión → 401 JSON) y **CA-6** (identificador inválido al marcar → 400) conservan pruebas específicas pendientes contra handlers y BD reales. La repetición por `(alerta, técnico)` solo se probará con la política que se acuerde en PA-5; no se presume deduplicación o nueva infraestructura. Sin mocks, código de prueba implementado ni ejecuciones; HU 10 no interviene.

## Dependencias

- HU 5 ([#22](https://github.com/CristhianArce/procesos-modernos-software/issues/22)): dashboard/alertas y suscripción real, dependencia expresa de #24.
- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20)) y HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)) de la línea base: usuarios técnicos, sesión, sensores, lecturas y semillas verificables. No se afirma que existan ni que sus responsables hayan aceptado contratos adicionales.
- Entorno real aislado de prueba y registro de extensiones de la línea base; sin depender de HU 6, HU 8, HU 9 o HU 10.

## Preguntas abiertas

- **PA-1:** La pregunta oficial sobre destinatarios permite todos los técnicos / también administradores / solo el asignado. CA-1 ya asume cada técnico y ese alcance se conserva; cualquier alternativa requiere acuerdo y revisión explícita, sin convertir HU 10 en dependencia por inferencia. Lo resuelve el equipo con el responsable de HU 7.
- **PA-2:** ¿Qué texto acompaña los datos obligatorios de sensor, valor y fecha? — opciones de la fuente: texto con sensor/valor/umbral / incluir también el nodo. No se inventa un texto exacto ni se eliminan los datos de CA-1. Lo resuelve el responsable de HU 7 con el equipo.
- **PA-3:** ¿Se incorpora marcar todas a la vez? — opciones oficiales: no en esta historia / un botón adicional. El recorrido publicado marca una notificación; no se añade el botón sin acuerdo. Lo resuelve el equipo con el responsable de HU 7.
- **PA-4:** ¿Cómo se actualiza una página ya abierta? — opciones oficiales: recargar/navegar / actualización periódica acordada. El único E2E usa apertura y recarga; no se promete polling, WebSocket o entrega automática nuevos. Lo resuelve el equipo con el responsable de HU 7.
- **PA-5:** ¿Se deduplican reentregas de la misma alerta al mismo técnico? — recomendación no ratificada: identidad `(alerta, técnico)` / alternativa: comportamiento de repetición que se acuerde con HU 5. Definir antes el ID estable y probar el par sin impedir las notificaciones de los otros destinatarios. Lo acuerdan los responsables de HU 5/HU 7.
- **PA-6:** ¿Qué contrato de emisión y errores entregará HU 5? — opciones: validar su implementación / coordinar primero ID, momento de persistencia e invocación y resultado ante fallo del suscriptor. No se presume atomicidad, reintento o entrega garantizada ni se añade infraestructura para conseguirlos. Lo coordinan los responsables de HU 5/HU 7; HU 3 aporta identidad y técnicos, y HU 4 las lecturas de prueba.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
