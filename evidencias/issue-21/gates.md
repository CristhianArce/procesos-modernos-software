# Puertas

## G2 — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | design.md / specs/simulador-de-lecturas/spec.md | El diseño fija la respuesta del simulador como `{ lecturas }`. La spec y la decisión #20 solo dicen "200 con las lecturas creadas". No es una contradicción, pero la forma exacta solo queda escrita en design.md. | Si se quiere, nombrar `{ lecturas }` también en el requisito "Simulación de lecturas de un nodo" o en el esquema de `openapi.yaml`. No bloquea. |

Resultado por criterio:
- **Criterio 1:** `openspec validate` ya salió válido, según el orquestador. No lo volví a ejecutar.
- **Criterio 2:** El formato de las specs es correcto. Ambas empiezan con `## Purpose` y texto real. Usan `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`, `SHALL`/`MUST` y `**WHEN**`/`**THEN**` en inglés, con el cuerpo en español.
- **Criterio 3:** La salida de `trazabilidad-grep.mjs` tiene todas las listas vacías.
- **Criterio 3b:**
  - Las tablas nuevas (`nodos`, `sensores`, `lecturas`) las crea la migración de la tarea 1.1.
  - `usuarios` y las rutas existentes aparecen en `contexto.md`.
  - No hay capacidades en conflicto: `proposal.md` declara "Modified Capabilities: ninguna" y `inicio-de-sesion` no se toca.
  - Las decisiones #1 a #20 existen en `decisiones.md`.
- **Criterio 3c:** Las 10 preguntas están `respondida` y cada una cita su decisión #1 a #10, que existe en `decisiones.md`. Ninguna queda `abierta`.
- **Criterio 4:**
  - `tasks.md` incluye pruebas unitarias y de integración, migración y semilla.
  - El contrato va en el grupo 6, junto a los handlers.
  - Cada grupo lleva sus propias pruebas.
  - El grupo 9 hace solo integración y aceptación.
- **Criterio 4b:**
  - Todas las tareas dicen cómo se verifican.
  - Abrir el PR, esperar el CI, correr las e2e contra la app levantada y archivar van como viñetas en `## Workflow follow-up`, sin casilla.
  - La tarea 9.1 escribe la e2e y se verifica con `npx playwright test --list`.
- **Criterio 5:** La migración solo agrega tablas, es hacia adelante y compatible hacia atrás. Usa versión timestamp.
- **Criterio 6:** Todas las tareas citan un `CA-n` o `Derivado: decisión #k`.
- **Criterio 7:**
  - Proposal, design, specs y tasks son coherentes entre sí.
  - Coinciden con el código real: `registro.ts` define `paneles` con `Componente({ nodoId })`, y existen `src/__tests__/contrato.test.ts` y `src/lib/dal.ts`.
  - La decisión #17 sobre las semillas sigue el orden alfabético de `npm run seed`.

Motivo (si BLOQUEAR):
