## Historia

Como administrador quiero aislar un nodo de la red desde su ficha para cortar el suministro de un tramo con falla sin afectar al resto.

## Contexto

**HU 6: Aislar un nodo de la red**, fila 6 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#23](https://github.com/CristhianArce/procesos-modernos-software/issues/23); documento canónico: `docs/backlog/hu-06-aislar-un-nodo-de-la-red.md` ([main fijado](https://github.com/CristhianArce/procesos-modernos-software/blob/6134fcef5867ad08149450e024b5069a3a761843/docs/backlog/hu-06-aislar-un-nodo-de-la-red.md)).
Se conservan literalmente los cuatro CA publicados. El refinamiento documenta confirmación, persistencia y permisos de ambas transiciones simuladas.
Ambas transiciones son simuladas: modifican el estado persistido del tablero, sin órdenes a equipos reales. La ficha, roles y columna de HU 3/HU 4 son dependencias por verificar, no entregas existentes o aceptadas.

## Criterios de aceptación

- **CA-1:** Dado un nodo conectado y un usuario administrador, cuando pulsa "Aislar nodo" y confirma, entonces el nodo queda en estado "desconectado" y la ficha lo muestra sin recargar la página.
- **CA-2:** Dado un nodo desconectado y un usuario administrador, cuando pulsa "Reconectar nodo" y confirma, entonces el nodo vuelve a "conectado".
- **CA-3:** Dado un usuario técnico, cuando abre la ficha del nodo, entonces no ve los botones de aislar o reconectar, y si llama a la API de cambio de estado recibe 403.
- **CA-4:** Dado un identificador de nodo que no existe, cuando se pide cambiar su estado, entonces la API responde 404 y el estado de los demás nodos no cambia.

## Reglas de negocio

- **RN-1:** Los únicos estados son "conectado" y "desconectado" (propuesta, fila 6).
- **RN-2:** Aislar y reconectar piden confirmación antes de cambiar el estado (CA-1 y CA-2).
- **RN-3:** Aislar un nodo solo cambia su estado visible: el simulador no se modifica y un nodo desconectado sigue recibiendo lecturas si se simula.
- **RN-4:** No se registra quién ni cuándo cambió el estado.
- **RN-5:** Esta historia actualiza únicamente la columna `estado` de `nodos`, que la HU 4 creó para ella (propuesta, fila 6). Es la única excepción a la regla de no modificar tablas ajenas: no hay migración ni se tocan otras columnas.

## Fuera de alcance

- Aislar varios nodos a la vez.
- Notificar a los técnicos del cambio (lo cubre la HU 7 solo para alertas de umbral).
- Operar equipos reales o implementar dependencias de HU 3/HU 4 en este borrador.
- Que el simulador omita los nodos desconectados.
- Auditoría de los cambios de estado.

## Notas técnicas (no vinculantes)

- Módulo `src/modulos/aislamiento/`, panel propio `paneles.ts` en la ficha de HU 4; API sugerida oficial `PATCH /api/aislamiento/nodos/{id}` con destino `conectado` o `desconectado`, validado con Zod y documentado posteriormente en `contracts/openapi.yaml`. No se cambian los textos de botones ni se suprime la confirmación de CA-1/CA-2.
- Roles reales: `administrador` y `tecnico` en `src/lib/session.ts`; el handler reutiliza `sessionFromRequest(req)`, `requireRole(sesion, "administrador")` y `conHttp`. El ejemplo oficial `admin` no coincide con el literal ni la firma actuales; se adapta la nota técnica, no los CA. El componente verifica la sesión en servidor: el registro descubre paneles, pero no los filtra automáticamente por rol.
- Propiedad de datos: `nodos.estado` es propiedad de HU 4. El alcance oficial prevé actualizar esa columna, sin migración ni semilla nuevas por HU 6, y sin cambios a otras filas o columnas. Esto contrasta con la regla general de no modificar tablas ajenas; se resuelve con una excepción acotada y documentada (decisión 4): el `repo.ts` de esta historia actualiza solo la columna `nodos.estado`, sin inventar una tabla paralela ni editar el esquema de HU 4. SQL solo en `repo.ts` con `import "server-only"`; sin Server Actions, librerías nuevas ni cambios al núcleo o a páginas ajenas.
- Estado real verificado: el checkout y el árbol remoto fijado todavía carecen de login, módulo/ficha/API de nodos y tablas de dominio. La migración inicial solo habilita `pgcrypto`, las semillas SQL están vacías y OpenAPI solo incluye salud/métricas. No se asume UUID ni nombres de contratos inexistentes. Es necesario el montaje real del panel por HU 4 y su consulta de existencia/estado, sin atribuirle aceptación.
- Trazabilidad: se retiran del borrador anterior la ausencia de modal, la exclusión de reconexión y la respuesta de repetición no publicada. Los CA siguen siendo los de #23; la recarga comprueba persistencia de ambas acciones simuladas. Ningún efecto sobre simulador o auditoría se considera resuelto por esta planificación. No hay implementación ni pruebas ejecutadas.

### E2E futuro (no ejecutado)

Preparación: aplicación, servidor/API y BD de prueba reales, migrados, con datos conocidos: administrador A, técnico T, nodo simulado N0 en `conectado` y nodo N1 con estado inicial fijo. HU 3 debe aportar autenticación real; HU 4, ficha, estado y datos válidos. La expectativa declarada es N0 `conectado → desconectado → conectado` y N1 invariable; no procede del servicio de cambio de estado.

1. Entrar como A, abrir la ficha de N0, pulsar `Aislar nodo` y confirmar. Comprobar `desconectado` en la ficha sin recargar.
2. Recargar y comprobar que N0 sigue `desconectado`. Pulsar `Reconectar nodo`, confirmar y comprobar `conectado`; recargar otra vez y verificar persistencia. N1 conserva su estado y no se envían órdenes a equipos reales.
3. En otra sesión real de navegador como T, abrir la misma ficha: no aparecen controles de aislamiento/reconexión. Con esa sesión, intentar el cambio por la API con datos válidos y comprobar 403, sin mutación de N0 ni N1.

Cobertura principal diseñada: **CA-1, CA-2 y CA-3**. No equivale a cobertura de todos los CA. **CA-4** mantiene pendiente un caso específico de nodo inexistente → 404 y restantes nodos intactos; también quedan por diseñar/implementar controles generales de sesión y validación con el contrato real. Sin mocks, cambios SQL que sustituyan las acciones, código de prueba implementado o pruebas ejecutadas. No se incorpora parada del simulador ni auditoría: ambas quedaron descartadas (decisiones 2 y 3).

## Decisiones de la HU 4 que aplican

La HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)) cerró sus preguntas abiertas el 2026-11-22. Lo que sigue es consecuencia de esas decisiones y no cambia los CA de esta historia.

- **Estado del nodo (decisión 1):** el nodo tiene nombre, ubicación y estado; se crea en "conectado" y esta historia solo cambia esa columna.
- **Simulador (decisiones 7 y 10):** se ejecuta solo a pedido (botón o API, sin temporizador) y sobre un único nodo, el indicado en el cuerpo. El simulador no mira el estado del nodo (decisión 2 de esta historia).
- **El técnico solo consulta (decisión 6):** la lista y la ficha del nodo las pueden ver el administrador y el técnico; crear, editar y eliminar nodos o sensores es solo del administrador. Coincide con CA-3.

## Dependencias

- HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)): ficha, nodos, columna de estado y contratos reales, como declara #23.
- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20)) para login/roles reales de la línea base; entorno aislado de HU 2. Las funciones generales de sesión ya presentes no sustituyen esas entregas.
- Sin dependencias de HU 7 a HU 10. Este refinamiento es documental y no declara una implementación.

## Decisiones tomadas

Resueltas por el equipo el 2026-11-22. Reemplazan a las preguntas abiertas de la versión anterior.

| # | Pregunta | Decisión | Alternativa descartada |
|---|---|---|---|
| 1 | Confirmación al aislar o reconectar (PA-1) | Se mantiene la confirmación que exigen CA-1 y CA-2 | Acción directa con deshacer |
| 2 | Simulador sobre un nodo desconectado (PA-2) | Solo cambia el estado visible; el simulador no se toca | El simulador omite el nodo (cambiaría la HU 4) |
| 3 | Registrar quién y cuándo cambió el estado (PA-3) | No | Tabla propia de auditoría con migración |
| 4 | Cómo se actualiza `nodos.estado` (PA-4) | Excepción documentada: el `repo.ts` de esta historia actualiza solo esa columna, como prevé la fila 6 de la propuesta | Función del servicio de `nodos` (obligaría a la HU 4 a entregar algo que hoy nadie usa) |

## Preguntas abiertas

Ninguna. Decididas en "Decisiones tomadas".

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
