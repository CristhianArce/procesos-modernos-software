# Prueba del agente revisor-salida, puerta G2 (tarea 4.2; CA-4)

- **Fecha:** 2026-11-21. Sesiones nuevas `claude -p --model sonnet`, que lanzan el subagente `revisor-salida` (sonnet / medium).
- **Entrada:** cada change de ejemplo copiado a un proyecto OpenSpec temporal en `.flujo/prueba-g2-<variante>/`, con la `config.yaml` real.

## Resultado

| Change | Esperado | Obtenido | Cumple |
|---|---|---|---|
| `change-espanol` (`### Requisito:`) | `CORREGIR` con hallazgo de formato | `CORREGIR`, CRITICAL de formato en los 3 encabezados; `openspec validate` con código 1 | Sí |
| `change-ok` | `APROBADO` | `APROBADO` (solo un SUGGESTION); `openspec validate` con código 0 | Sí |

## Historia de la prueba (rechazos reales)

1. **Primera corrida de `change-ok`: `CORREGIR`.** El agente encontró un problema real en la fixture: cambiaba el contrato sin `design.md`, que `CLAUDE.md` exige. Además, uno de sus comandos compuestos (`openspec validate ... ; echo $?`) fue rechazado por permisos. **Corrección:** se agregó `design.md` a la fixture, se precisó el texto del proposal y los agentes ahora ejecutan un comando simple por llamada.
2. **Segunda corrida:** los resultados de la tabla.

## Salida textual: change-espanol

## G2 — intento 1
Veredicto: CORREGIR

| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | CRITICAL | specs/acerca/spec.md (líneas 9, 16 y 23) | `openspec validate acerca --strict --type change --no-interactive` termina con código 1 y no imprime `Change 'acerca' is valid`. Los tres encabezados usan `### Requisito:` en lugar de `### Requirement:`. El validador los ignora, así que reporta "no requirement entries parsed" y "Change must have at least one delta". Por la misma causa, el texto bajo `## ADDED Requirements` genera un WARNING porque no se traslada al archivo. | Cambiar los tres encabezados a `### Requirement: <título en español>`. Dejar el cuerpo en español y conservar `SHALL`/`MUST`, `#### Scenario:` y `**WHEN**`/`**THEN**`. Repetir la validación hasta obtener el código 0. |
| 2 | WARNING | tasks.md (encabezado `## 1. Módulo acerca`) | Todas las tareas están en un solo grupo. La sección 7 de `CLAUDE.md` pide agrupar por capa: repo, service, schema, handler, página/ui, `menu.ts`, contrato y pruebas. Además, las pruebas unitarias y de integración están dentro de las tareas 1.1 y 1.2, y no hay un grupo de pruebas propio. | Reorganizar `tasks.md` en grupos por capa, con un grupo de pruebas que tenga las tareas unitarias (sin BD) y de integración (handlers con `Request`). Cada tarea debe seguir citando su `CA-n`. |
| 3 | SUGGESTION | specs/acerca/spec.md (línea 1) | El título `# Spec Delta` es genérico. | Cambiarlo por un título descriptivo, por ejemplo `# Acerca de`. |

Cobertura de CA: `trazabilidad` reporta CA-1, CA-2 y CA-3 cubiertos, y lo confirmé en specs y tasks. No hay migraciones ni cambios de esquema, y `design.md` existe y es coherente con el cambio de contrato. Limitación: la tarea 1.4 (contrato) no se pudo contrastar con código real porque este es un change de demostración.

Motivo (si BLOQUEAR):

## Salida textual: change-ok

## G2 — intento 1
Veredicto: APROBADO

| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | tasks.md | Hay una sola sección ("1. Módulo acerca"). CLAUDE.md §7 pide agrupar por capa (repo, service, schema, handler, página/ui, `menu.ts`, contrato, pruebas). Las pruebas están dentro de cada tarea, no en un grupo propio. | Opcional: separar los grupos por capa y agregar un grupo de pruebas. No bloquea. |

Motivo (si BLOQUEAR):

Comprobaciones hechas:
- `openspec validate acerca --strict --type change --no-interactive` terminó con código 0 e imprimió `Change 'acerca' is valid`.
- `spec.md` empieza con `## Purpose` y texto real. Usa `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`, `SHALL`/`MUST` y `**WHEN**`/`**THEN**` en inglés, con el cuerpo en español.
- La salida de `trazabilidad` cubre CA-1, CA-2 y CA-3.
- `tasks.md` incluye pruebas unitarias (1.1) y de integración con 200 y 401 (1.2). No hay migración ni semilla, y `design.md` confirma que no se toca el esquema. `design.md` existe y el contrato cambia, como exige §7.
- No hay tareas fuera de alcance. Proposal, design, specs y tasks son coherentes entre sí.
- Es una demo, así que no se contrastó con código real.
