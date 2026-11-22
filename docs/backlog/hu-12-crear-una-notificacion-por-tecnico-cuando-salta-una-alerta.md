## Historia

Como técnico quiero que cada alerta de umbral me genere una notificación para enterarme de una falla sin tener el dashboard abierto.

## Contexto

**HU 12: Crear una notificación por técnico cuando salta una alerta**, fila 12 de [la propuesta](../propuesta.md), §5.
Esta historia sale de dividir la HU 7 original ([#24](https://github.com/CristhianArce/procesos-modernos-software/issues/24), "Notificar a los técnicos cuando salta una alerta") en dos: el centro de notificaciones (tabla, consulta y marcado) quedó en la HU 7 y aquí queda el suscriptor que crea las notificaciones. CA-1 es el CA-1 publicado en #24. CA-2 y CA-3 hacen explícito lo que el recorrido E2E de #24 ya exigía (una notificación por cada alerta y por cada técnico, visible en su centro). CA-4 es el caso límite sin destinatarios.
La red eléctrica es simulada, sin equipos reales. La HU 5 debe registrar la alerta y llamar a los suscriptores; su contrato de emisión se reutiliza como esté implementado, sin editar su módulo.

## Criterios de aceptación

- **CA-1:** Dada una alerta de umbral que se registra, cuando el servicio de alertas avisa a sus suscriptores, entonces se crea una notificación para cada técnico con el sensor, la magnitud, el valor y la fecha de la alerta.
- **CA-2:** Dadas dos alertas distintas, cuando se registran, entonces cada técnico tiene una notificación por cada alerta.
- **CA-3:** Dada una notificación creada por una alerta, cuando su técnico abre el centro de notificaciones, entonces la ve como no leída, la más reciente primero y sumada al número de no leídas.
- **CA-4:** Dado que no existe ningún usuario con rol técnico, cuando se registra una alerta, entonces no se crea ninguna notificación y el suscriptor termina sin error.

## Reglas de negocio

- **RN-1:** La suscripción se hace solo por `on-alerta.ts`: no se edita el módulo de alertas.
- **RN-2:** Cada técnico recibe su propia notificación; no hay bandeja compartida.
- **RN-3:** Se notifica a todos los usuarios con rol técnico y a nadie más; no depende de la asignación de la HU 10.
- **RN-4:** No se deduplica: cada aviso del servicio de alertas crea una notificación por técnico. El servicio avisa una sola vez por alerta, así que no hay reentregas que filtrar.
- **RN-5:** Se usa el contrato de la HU 5 tal como lo implemente: el aviso llega después de guardada la alerta, con su sensor, magnitud, valor y fecha. Si este suscriptor falla, la HU 5 registra el error y conserva la alerta.

## Fuera de alcance

- Consultar y marcar notificaciones (lo cubre la HU 7).
- Envío de correos, SMS o notificaciones push.
- Colas, reintentos, trabajos programados u otra infraestructura de entrega.
- Notificar a los administradores o solo al técnico asignado al nodo (decisión 1).
- Deduplicar notificaciones de una misma alerta.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/notificaciones/` (el de la HU 7). Esta historia agrega `on-alerta.ts` y la función del servicio que crea las notificaciones; no agrega página ni endpoints, así que no tiene criterio de autorización propio.
- Endpoints sugeridos: ninguno nuevo; `contracts/openapi.yaml` no cambia.
- Datos: escribe en la tabla `notificaciones` de la HU 7 y lee los usuarios con rol `tecnico` de la HU 3, sin modificar `usuarios`. Sin migración propia: no se deduplica (decisión 2) y no se altera la tabla de la HU 7. Sin semilla nueva.
- Integración: `src/nav/registro.ts` descubre `onAlerta`, cuyo tipo actual es `manejar(alerta: unknown)`. El suscriptor valida la alerta que recibe con el tipo que defina la HU 5. SQL solo en `repo.ts`; sin cambios al núcleo.
- Puntos de extensión: `on-alerta.ts`.

### E2E futuro (no ejecutado)

Preparación: navegador, servidor y BD de prueba reales y migrados; T1 y T2 son técnicos de prueba que empiezan sin notificaciones. Con los responsables de las HU 4 y 5 se acuerda cómo producir por el flujo real dos lecturas que generen las alertas A1 y A2 con fechas F1 < F2. El orden esperado `[A2, A1]` se fija con los datos de prueba antes del recorrido.

1. Provocar las dos alertas por el flujo real de lectura y registro de las HU 4 y 5, y dejar que `on-alerta.ts` cree las notificaciones. No se insertan notificaciones ni se llama al suscriptor a mano.
2. Abrir sesiones separadas de T1 y T2: cada centro muestra sus dos notificaciones con sensor, valor y fecha correctos, en orden `[A2, A1]` y con 2 no leídas.
3. T1 marca como leída la de A2: su contador pasa a 1 y T2 conserva sus 2 no leídas.

Cobertura del recorrido: **CA-1, CA-2 y CA-3**. **CA-4** se cubre con una prueba de integración del suscriptor.

## Decisiones de la HU 4 que aplican

La HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)) cerró sus preguntas abiertas el 2026-11-22. Lo que sigue es consecuencia de esas decisiones y no cambia los CA de esta historia.

- **Magnitudes y umbrales (decisiones 2 y 3):** cada lectura trae voltaje, corriente y potencia, y el umbral es un máximo por magnitud. La alerta de la HU 5 lleva la magnitud que superó el umbral; el "valor" de CA-1 es el de esa magnitud y la notificación guarda también la magnitud (decisión 1 de la HU 7); no guarda el umbral ni el nodo. Una lectura que supera el umbral en dos magnitudes produce dos alertas y, por tanto, dos notificaciones por técnico (CA-2).
- **Simulador (decisiones 4, 7 y 10):** se ejecuta a pedido sobre un nodo y solo a veces genera una lectura por encima del umbral. Para provocar las alertas A1 y A2 del E2E de forma determinista conviene un sensor de prueba con un umbral por debajo del rango normal del simulador, en lugar de esperar una lectura fuera de rango.

## Dependencias

- HU 7 ([#24](https://github.com/CristhianArce/procesos-modernos-software/issues/24)): tabla `notificaciones` y centro de notificaciones.
- HU 5 ([#22](https://github.com/CristhianArce/procesos-modernos-software/issues/22)): registro de alertas y llamada a los suscriptores.
- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20)): usuarios con rol técnico.

## Decisiones tomadas

Resueltas por el equipo el 2026-11-22. Reemplazan a las preguntas abiertas de la versión anterior.

| # | Pregunta | Decisión | Alternativa descartada |
|---|---|---|---|
| 1 | A quién se notifica (PA-1) | A todos los técnicos; coincide con la decisión 4 de la HU 7 | También administradores / solo el técnico asignado al nodo |
| 2 | Reentregas de la misma alerta (PA-2) | No se deduplica: exigiría alterar la tabla de la HU 7 y en un monolito el servicio avisa una vez por alerta | Deduplicar por alerta y técnico, con migración propia |
| 3 | Contrato de emisión de la HU 5 (PA-3) | Se usa el que implemente la HU 5: avisa después de guardar la alerta y conserva la alerta si el suscriptor falla (RN-6 de la HU 5) | Acordarlo antes con su responsable |

## Preguntas abiertas

Ninguna. Decididas en "Decisiones tomadas".

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
