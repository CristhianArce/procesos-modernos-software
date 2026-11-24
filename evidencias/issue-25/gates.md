## Revisión de la propuesta — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | design.md / tasks.md | Nada bloquea. El alias de la semilla (`Usuario demo 02`) y el nombre `nodos_afectados.sql` están justificados en las decisiones #4 y #5. Ambas llevan `Revisar: sí`. | Ninguna. |
Motivo (si BLOQUEAR):

Resultado de cada criterio:
- **Criterio 1:** `openspec validate afectados-de-un-nodo --strict --type change --no-interactive` imprime `Change 'afectados-de-un-nodo' is valid`.
- **Criterio 2:** la spec usa `## Purpose` con texto real, `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`, `SHALL`/`MUST` y `**WHEN**`/`**THEN**` en inglés.
- **Criterio 3:** la salida de trazabilidad que me pasaste tiene todas las listas de falta vacías. Leí las decisiones #1 a #5 y existen todas las filas citadas.
- **Criterio 3b:**
  - Las tablas `nodos` y `sensores` y los módulos `nodos` y `aislamiento` están en `contexto.md`.
  - `obtenerNodo` y `esUuid` existen en `src/modulos/nodos` (`service.ts` y `schema.ts`).
  - `src/__tests__/contrato.test.ts` existe.
  - `nodo_usuarios` y el módulo `afectados` los crea el propio change, en la tarea 1.1 y en las tareas 2 a 6.
  - No hay capacidad existente que modificar, así que `afectados-de-nodos` es una capacidad nueva.
- **Criterio 3c:** la pregunta #1 está `respondida` y cita la decisión #1, que existe.
- **Criterio 4:** hay pruebas por grupo (unitarias, de integración y e2e). El contrato va en el grupo del handler (5.2). El grupo 7 solo hace integración y aceptación. La migración y la semilla tienen su grupo.
- **Criterio 4b:** cada tarea dice cómo se verifica. El PR, el CI, las e2e contra la app y el archivado están como viñetas en `## Workflow follow-up`, no como casillas. La tarea 7.1 se verifica con `npx playwright test --list`.
- **Criterio 5:** la migración es una tabla nueva, solo hacia adelante y compatible hacia atrás.
- **Criterio 6:** no hay tareas fuera de alcance. Lo derivado cita su decisión.
- **Criterio 6b:** `design.md` (puntos 5 y 6) usa `EstadoVacio`, `.cifra` y tokens del sistema de diseño. El panel entra por `paneles.ts` y no se edita la página de la ficha.
- **Criterio 7:** proposal, design, specs y tasks son coherentes entre sí. `src/modulos/afectados/paneles.ts` ya aparece en el árbol porque el paso 5 corre en paralelo, así que no cuenta como hallazgo.
