## Revisión de la propuesta — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | tasks.md (1.1, 2.1, 4.1, 5.1, 5.3) | Las tareas de prueba se verifican con `npx vitest list` o con `vitest run`, y la verificación repite el nombre del CA en una línea suelta. Es correcto, solo redundante. | Opcional: quitar la línea repetida «(CA-n.) Se verifica…» y dejar una sola. |

Comprobaciones:
- `openspec validate marcar-notificacion-como-leida --strict --type change --no-interactive` termina con código 0 e imprime `Change 'marcar-notificacion-como-leida' is valid`.
- La salida de `trazabilidad-grep.mjs` no tiene ningún campo con hallazgos.
- Los encabezados y las palabras clave de la spec están en inglés: `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`, `SHALL`/`MUST` y `**WHEN**`/`**THEN**`. El cuerpo está en español.
- Los nombres de los requisitos ADDED no chocan con los de `centro-de-notificaciones`, que ya existe. El proposal declara esa capacidad como modificada y no crea una nueva, así que no hace falta `## Purpose`.
- Todo lo existente que usan los artefactos aparece en `contexto.md`: la tabla `notificaciones` con `leida`, el módulo `notificaciones` y la ruta `/api/notificaciones`. `schema.ts`, `BotonMarcarLeida` y `/api/notificaciones/{id}` los crea el propio change.
- Las decisiones #1 a #6 citadas tienen su fila en `decisiones.md`.
- `preguntas.md` no tiene ninguna fila, así que no hay preguntas abiertas.
- Zod es 4.6.7, que tiene `z.guid()`. `.boton-fantasma` existe en `globals.css`. `text-critico` sale de `--color-critico`, que apunta a `--sc-critico`.
- `tasks.md` cumple los criterios de tareas:
  - Cada grupo lleva sus pruebas y el contrato (4.3) va en el grupo del handler.
  - El grupo 6 solo hace integración y aceptación.
  - Todas las tareas dicen cómo se verifican.
  - El PR, el CI, el archivado y la ejecución de las e2e van como viñetas en `## Workflow follow-up`, no como tareas con casilla.
- No hay migración ni semilla, y el change no toca el esquema, así que no hay riesgo de compatibilidad hacia atrás.
- La interfaz usa los tokens `--sc-*` y las clases que los exponen. Hay estados de carga, error y vacío, el botón se opera con teclado y no agrega animaciones.
- Alcance: nada queda fuera de CA-1 a CA-4 ni de las decisiones #1 a #6.
