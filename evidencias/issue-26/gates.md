## Revisión de la propuesta — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | tasks.md 7.2 | La tarea 7.2 se verifica con `trazabilidad-grep.mjs --pruebas 26`. Es una comprobación del flujo y no una tarea de código. Es válida porque tiene casilla y verificación propia, y no es PR, CI ni archivado. | Ninguna obligatoria. Si el orquestador no corre ese script en el paso de aplicar, pasarla a `## Workflow follow-up`. |

Comprobaciones:
- `openspec validate consultar-historico-de-lecturas --strict --type change --no-interactive` termina con "Change 'consultar-historico-de-lecturas' is valid".
- Formato de specs: los encabezados y las palabras clave están en inglés y la capacidad nueva empieza con `## Purpose` con texto real.
- La salida de `trazabilidad-grep.mjs` no deja nada pendiente: todas las listas están vacías.
- Contexto: todas las tablas y módulos que usan los artefactos figuran en `contexto.md`. El change crea su propio módulo `historico` y su semilla. No modifica ninguna capacidad existente, así que no hay deltas MODIFIED.
- Preguntas: las tres están `respondida` y citan las decisiones #1, #2 y #3, que existen en `decisiones.md`.
- Decisiones: las citadas (#1 a #10) tienen fila.
- Tareas: cada una lleva su verificación en la misma línea y cada grupo trae sus pruebas. El contrato va en el grupo del handler (5.2). El grupo 7 es solo de integración y aceptación.
- El PR, el CI y el archivado están como viñetas en `## Workflow follow-up`, no como tareas con casilla.
- Sin migración: el change no toca el esquema y solo agrega una semilla propia con `ON CONFLICT DO NOTHING`.
- Alcance: nada queda fuera de los CA ni de una decisión. Las partes derivadas de decisiones del orquestador (#4, #5 y #6) están marcadas para revisión.
- Interfaz: usa `EstadoVacio`, `EstadoError`, `Cargando`, `formato.ts`, `.cifra`, `.tabla`, `.campo` y `.boton-primario`. Los controles son nativos, con etiqueta visible y operables con teclado.
- Archivos que citan las tareas, comprobados en el repo: `src/__tests__/contrato.test.ts`, `src/modulos/dashboard/formato.ts` y `src/modulos/ui/*`.
Motivo (si BLOQUEAR):

Nota del orquestador: la tarea 7.2 se cumple en el cierre del paso 5, que corre `trazabilidad-grep.mjs --pruebas 26`.
