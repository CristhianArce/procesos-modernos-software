## Revisión de la propuesta — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | tasks.md (7.2) | La tarea 7.2 corre `build-test.mjs` y `openspec validate`. Es verificable y no es un paso de PR ni de CI, así que no es hallazgo. | Ninguna. |

Revisé los criterios así:
- **Criterio 1:** `openspec validate agregar-afectado-a-nodo --strict --type change --no-interactive` imprimió `Change 'agregar-afectado-a-nodo' is valid`.
- **Criterio 2:** `specs/afectados-de-nodo/spec.md` empieza con `## Purpose` y texto real. Usa `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`, `SHALL`/`MUST` y `**WHEN**`/`**THEN**` en inglés, con el cuerpo en español.
- **Criterio 3:** la salida de `trazabilidad-grep` que me diste trae todas las listas vacías. Verifiqué que los CA-1 a CA-4 aparecen en requisitos, escenarios y tareas.
- **Criterio 3b:**
  - `nodo_usuarios` y el módulo `afectados` no están en `contexto.md`, pero el propio change los crea. La tarea 1.1 trae la migración y las tareas 2.1 a 6.2 el módulo, con `Derivado: decisión #2`.
  - Lo existente que usa el change sí está en `contexto.md` o en el código: `nodos`, `obtenerNodo`, `sesionActual`, `enviarJson`, `z.guid` y los paneles 10, 20 y 30.
  - El change no modifica ninguna capacidad ya listada.
  - Las decisiones #1 a #3 que se citan existen en `decisiones.md`.
- **Criterio 3c:** las preguntas 1 y 2 están `respondida` y citan las decisiones #1 y #2, que existen.
- **Criterio 4:**
  - Cada grupo lleva sus propias pruebas, unitarias o de integración.
  - El contrato (tarea 5.2) va junto al handler (5.1).
  - El grupo final solo hace e2e y aceptación.
  - La migración no lleva semilla, por la decisión #4.
- **Criterio 4b:** todas las tareas dicen en su línea cómo se verifican, con comando concreto. El PR, el CI, correr las e2e contra la app levantada y archivar van como viñetas en `## Workflow follow-up`.
- **Criterio 5:** la migración crea una tabla nueva, solo hacia adelante y compatible hacia atrás.
- **Criterio 6:** no hay tareas fuera de alcance.
- **Criterio 6b:** el change toca `.tsx`. `design.md` y `tasks.md` reutilizan `EstadoVacio`, `role="alert"`, etiqueta visible y los paneles de `paneles.ts`. No se ven colores ni clases fuera de los tokens.
- **Criterio 7:** proposal, design, specs y tasks son coherentes entre sí. Esto incluye el orden de los chequeos en el handler (rol, luego Zod, luego servicio), la decisión #3 y el contrato.

Motivo (si BLOQUEAR): no aplica.
