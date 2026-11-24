## Revisión de la propuesta — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | tasks.md 6.1 | La verificación de la e2e es solo `npx playwright test --list`. Es lo que pide CLAUDE.md §7, así que es válida. Conviene que la prueba cite `#54 CA-n` en el nombre de cada `test`, como dice 6.2. | Ninguna obligatoria. |

Comprobaciones hechas:
- `openspec validate agregar-afectado-nodo --strict --type change --no-interactive` termina con código 0 e imprime `Change 'agregar-afectado-nodo' is valid`.
- Formato de specs: los encabezados, `SHALL`/`MUST` y `**WHEN**`/`**THEN**` están en inglés y el cuerpo en español. La capacidad nueva empieza con `## Purpose` y texto real.
- Trazabilidad: la salida de `trazabilidad-grep.mjs` tiene todos los campos de problemas vacíos. `preguntas.md` no tiene preguntas abiertas y cada pregunta cita una decisión que existe. Las decisiones #1 a #4 tienen fila en `decisiones.md`.
- Contexto: `nodo_usuarios`, el módulo `afectados`, `GET /api/afectados` y `paneles.ts` aparecen en `contexto.md`. `sesionActual` y `enviarJson` existen en el código.
- Capacidades: el delta usa solo `ADDED` en una capacidad nueva. Los requisitos vigentes de `afectados-de-nodos` no cambian.
- `tasks.md`: cada grupo trae sus pruebas y cada tarea dice cómo se verifica. El contrato va en el grupo del handler. Sin migración ni semilla (decisiones #2 y #4). PR, CI y archivado van en `## Workflow follow-up`.
- Interfaz: reutiliza `Cargando`, `EstadoError` y `EstadoVacio`; tokens `--sc-*`, `role="alert"`, estados del formulario y teclado.
- Reglas del e2e: la prueba crea su propio nodo, usa `Date.now()` y limpia en `afterEach`.

Motivo (si BLOQUEAR): no aplica.
