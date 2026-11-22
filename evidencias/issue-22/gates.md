## G2 — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | WARNING | tasks.md 6.4 | La verificación de la página es solo `npm run typecheck` y la prueba e2e de la tarea 8.1, que únicamente se comprueba con `npx playwright test --list`. Ningún comando observa el comportamiento de la página. Es aceptable porque las páginas asíncronas solo se prueban con Playwright (CLAUDE.md §7), pero es débil. | Opcional. Añadir a 6.4 una verificación observable, por ejemplo que `/dashboard` redirige a login sin sesión (prueba de proxy), o dejar la corrida real de e2e como viñeta de Workflow follow-up (ya está). |
| 2 | SUGGESTION | tasks.md 5.3 | El contrato se agrega después de los dos handlers (5.1 y 5.2) dentro del mismo grupo 5. Está en el grupo del handler, así que cumple la regla. | Ninguna obligatoria. |

Comprobaciones hechas:
- `openspec validate dashboard-lecturas-y-alertas --strict --type change --no-interactive` termina con "Change 'dashboard-lecturas-y-alertas' is valid".
- La salida de `trazabilidad-grep.mjs` no deja ningún campo con elementos.
- Los dos specs usan `## Purpose`, `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`, `SHALL`/`MUST` y `**WHEN**`/`**THEN**` en inglés, con el cuerpo en español.
- Todo lo existente que se usa aparece en `contexto.md`: las tablas `sensores` y `lecturas` con sus columnas de umbral, los módulos `lecturas`, `sensores` y `simulador`, y `/api/simulador`. Lo nuevo lo crea el change: la tabla `alertas`, los módulos `alertas` y `dashboard`, y las rutas `/api/lecturas` y `/api/alertas`. `src/nav/registro.ts` existe y expone `suscriptores` con `manejar`. Recharts 3.11.0 ya está en `package.json`.
- Ninguna capacidad existente se modifica; las dos capacidades nuevas no duplican ninguna de las 10 ya listadas en `contexto.md`.
- Las preguntas #1 a #3 están `respondida` y cada una cita su decisión en `decisiones.md`. Las decisiones #1 a #12 tienen fila.
- Cada tarea lleva su verificación en la misma línea y las pruebas van en el grupo de su capa. El grupo 8 es solo integración y aceptación. Abrir el PR, esperar el CI, correr la e2e y archivar están como viñetas en `## Workflow follow-up`.
- La migración es aditiva y usa versión timestamp (`V202611222300`, posterior a la última existente).
- El comando `build-test.mjs 22 --solo test:integration` que citan las tareas es válido: `--solo` acepta ese paso.
- Proposal, design, specs y tasks son coherentes entre sí. Con #12 se evita una consulta por sensor.

Motivo (si BLOQUEAR):
