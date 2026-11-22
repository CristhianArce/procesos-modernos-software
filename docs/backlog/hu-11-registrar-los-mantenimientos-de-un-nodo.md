## Historia

Como técnico quiero registrar los mantenimientos que hago en un nodo para saber qué se ha hecho en él.

## Contexto

**HU 11: Registrar los mantenimientos de un nodo**, fila 11 de [la propuesta](../propuesta.md), §5.
Esta historia sale de dividir la HU 10 original ([#27](https://github.com/CristhianArce/procesos-modernos-software/issues/27), "Registrar mantenimiento y asignar un técnico a un nodo") en dos: la asignación por el administrador quedó en la HU 10 y aquí queda el registro por el técnico asignado. CA-1 a CA-3 son los CA-3 a CA-5 publicados en #27 y CA-4 es la mitad de registro del CA-6 original.
La red eléctrica es simulada, sin control de equipos reales. La asignación de la HU 10, los usuarios de la HU 3 y los nodos de la HU 4 son dependencias: se reutilizan como estén implementados, sin modificarlos.

## Criterios de aceptación

- **CA-1:** Dado un técnico asignado a un nodo, cuando registra un mantenimiento con fecha y descripción válidas, entonces aparece en el historial del nodo con el más reciente primero.
- **CA-2:** Dado un técnico no asignado al nodo, cuando intenta registrar un mantenimiento en él, entonces recibe 403 y no se guarda nada.
- **CA-3:** Dada una descripción vacía o una fecha inválida, cuando se registra un mantenimiento, entonces la API responde 400 por la validación de Zod.
- **CA-4:** Dado un identificador de nodo que no existe, cuando se registra un mantenimiento, entonces la API responde 404.

## Reglas de negocio

- **RN-1:** El historial se muestra en el panel de mantenimiento de la ficha del nodo, que se enchufa por `paneles.ts`: no se edita la página de la ficha de la HU 4.
- **RN-2:** Solo el técnico asignado al nodo registra mantenimientos; ni otro técnico ni el administrador pueden hacerlo.
- **RN-3:** Un mantenimiento tiene fecha con hora y descripción. El historial se ordena del más reciente al más antiguo; si dos coinciden en fecha y hora, va primero el que se registró después.
- **RN-4:** Cada mantenimiento conserva a quien lo realizó: cambiar el técnico asignado al nodo no modifica el historial.

## Fuera de alcance

- Asignar o cambiar el técnico de un nodo (lo cubre la HU 10).
- Programar mantenimientos futuros o recordatorios.
- Editar o borrar mantenimientos ya registrados.
- Campos adicionales del mantenimiento, como tipo o estado (decisión 2).
- Implementar funcionalidades o contratos propietarios de otras historias.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/mantenimiento/` · API `src/app/api/mantenimiento/`. El módulo y el panel los crea la HU 10; esta historia agrega el historial y el formulario de registro.
- Endpoints sugeridos: `GET|POST /api/mantenimiento/nodos/{id}/registros` (se agregan a `contracts/openapi.yaml`).
- Autorización en servidor: `sessionFromRequest(req)` + `requireRole(sesion, "tecnico")` dentro del handler, con el envoltorio `conHttp`; el servicio comprueba además la asignación real del técnico al nodo. Un técnico válido no asignado recibe 403 y no se guarda nada (CA-2); ocultar el formulario no sustituye el permiso. La lectura del historial reutiliza los permisos de la ficha del nodo, sin inventar otra matriz.
- Datos: tabla propia de registros con migración Flyway propia (no se modifica la migración de la HU 10); semilla en `db/seed/mantenimiento.sql`. Se leen la asignación de la HU 10 y `nodos` y `usuarios` de las HU 4 y HU 3 sin modificarlos. El registro tiene fecha y descripción (CA-1 y CA-3); tipos, nombres de columnas y límites de la descripción se concretan con los contratos reales, no se inventan.
- **Autoría (decisión 3):** cada mantenimiento conserva a quien lo realizó y su fecha aunque cambie la asignación del nodo.
- SQL solo en `repo.ts`, Zod, servicio y handlers delgados; sin Server Actions, librerías nuevas ni cambios al núcleo.

### E2E

Aplicación, API y BD de prueba reales, migradas y con datos conocidos: técnicos T1 y T2 y nodo ficticio N0 (de las HU 3 y HU 4), con T1 ya asignado a N0 (dato previo de la HU 10) y N0 sin mantenimientos. Registros ficticios M1 = `Inspección demo 01` y M2 = `Inspección demo 02`, con fechas fijas válidas F1 < F2. El historial esperado `[M2, M1]` se declara antes del caso, sin usar el ordenamiento de producción como oráculo.

1. T1 inicia sesión, abre la ficha de N0 y registra M1 con F1 y M2 con F2 por el formulario. El historial muestra `[M2, M1]`.
2. T1 recarga la ficha: ambos registros permanecen en el mismo orden.
3. T2, técnico válido no asignado, intenta registrar por la API un mantenimiento con datos válidos: recibe 403 y el historial sigue siendo exactamente `[M2, M1]`.

Cubre **CA-1** y **CA-2**. **CA-3** (descripción vacía o fecha inválida → 400) y **CA-4** (nodo inexistente → 404) se prueban con pruebas de integración de los handlers. El caso no ejercita una reasignación.

## Decisiones de la HU 4 que aplican

La HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)) cerró sus preguntas abiertas el 2026-11-22. Lo que sigue es consecuencia de esas decisiones y no cambia los CA de esta historia.

- **Borrado en cascada (decisión 5):** al eliminar un nodo, la HU 4 elimina también sus sensores y lecturas. La tabla propia de registros de mantenimiento referencia al nodo con borrado en cascada, para que eliminar el nodo no falle ni deje filas huérfanas.
- **El técnico solo consulta (decisión 6):** la lista y la ficha del nodo las pueden ver el administrador y el técnico; crear, editar y eliminar nodos o sensores es solo del administrador. El historial de mantenimientos, que reutiliza los permisos de la ficha, lo pueden leer ambos roles.

## Dependencias

- HU 10 ([#27](https://github.com/CristhianArce/procesos-modernos-software/issues/27): asignación del técnico, módulo y panel de mantenimiento).
- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20): usuarios y roles) y HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21): nodos, ficha y registro de paneles).
- Sin dependencias de las HU 6 a 9.

## Decisiones tomadas

Resueltas por el equipo el 2026-11-22. Reemplazan a las preguntas abiertas de la versión anterior.

| # | Pregunta | Decisión | Alternativa descartada |
|---|---|---|---|
| 1 | Quién puede registrar (PA-1) | Solo el técnico asignado | Cualquier técnico / también el administrador |
| 2 | Datos del mantenimiento (PA-2) | Fecha y descripción | Además tipo y estado |
| 3 | Historial al cambiar el técnico (PA-3) | Se conserva con quien lo realizó | Se reasigna al nuevo técnico |
| 4 | Fecha y orden del historial (PA-4) | Fecha con hora; en empate, primero el registrado más tarde | Solo fecha; en empate, orden de registro |

## Preguntas abiertas

Ninguna. Decididas en "Decisiones tomadas".

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
