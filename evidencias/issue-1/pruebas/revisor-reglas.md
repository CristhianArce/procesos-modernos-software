# Prueba del agente revisor-reglas (tarea 4.3; CA-5)

- **Fecha:** 2026-11-21. Sesión nueva `claude -p --model sonnet`, que lanza el subagente `revisor-reglas` (sonnet / medium, pasado en la invocación).
- **Entrada:** `.claude/fixtures/parche-violaciones.diff` aplicado de forma temporal en la raíz del repo (modo `demo`); quitado después.
- **Resultado esperado:** un CRITICAL por cada violación (SQL en `service.ts` y `fetch` a la propia API desde `page.tsx`), solo con la escala CRITICAL/WARNING/SUGGESTION. **Cumple:** 2 CRITICAL, 2 WARNING y 1 SUGGESTION.

## Historia de la prueba

1. **Con el parche en un worktree de `.claude/worktrees/`:** el agente encontró las dos violaciones, pero sus comandos `git` fueron rechazados. Claude Code pide aprobación para `cd <dir> && git ...`, porque `git` en otro directorio puede cargar hooks no confiables. **Decisión:** en `demo`, `<raiz>` es la raíz y los comandos van sin `cd`. El caso del modo normal con worktrees queda registrado en `design.md`.
2. **Con el parche en la raíz:** `git diff`, `merge-base` y `ls-files` funcionaron, con el resultado de abajo.

## Salida textual del agente

Rama: feature/issue-1-configuracion-ia-sdd · Commits: 0 (cambios sin confirmar) · Archivos: 3 (`src/app/(tablero)/acerca/page.tsx`, `src/modulos/acerca/service.ts`, `CLAUDE.md`) · CRITICAL: 2 · WARNING: 2 · SUGGESTION: 1

### CRITICAL
| # | Archivo | Método | Línea | Hallazgo | Regla |
|---|---|---|---|---|---|
| 1 | src/app/(tablero)/acerca/page.tsx | AcercaPage | 4 | La página lee los datos con `fetch("http://localhost:3000/api/acerca")` a la propia API. Debe llamar a `obtenerAcerca()` del servicio. | Capas: las páginas leen datos llamando al servicio, nunca con `fetch` de la propia API |
| 2 | src/modulos/acerca/service.ts | obtenerAcerca | 2, 5 | El servicio importa `pool` y ejecuta `pool.query` con SQL. El SQL debe vivir solo en `src/modulos/acerca/repo.ts`, con `import "server-only"`. El módulo no tiene `repo.ts`. | Capas: el SQL vive solo en `repo.ts` |

### WARNING
| # | Archivo | Método | Línea | Hallazgo | Regla |
|---|---|---|---|---|---|
| 1 | src/modulos/acerca/ | (módulo) | n/a | Faltan `schema.ts`, `menu.ts`, `src/app/api/acerca/route.ts` y `__tests__/`. La página consume `/api/acerca`, que no existe en el diff. Si esa ruta aparece, debe usar el envoltorio de `src/lib/http.ts` y `sessionFromRequest` + `requireRole`. | Estructura por módulo; autorización dentro del handler |
| 2 | src/modulos/acerca/service.ts | obtenerAcerca | 6 | Devuelve `rows[0]` sin tipo y sin manejar el caso de tabla vacía (`undefined`). La página lo leería como `datos.texto` y fallaría. | Calidad: contrato tipado y manejo de errores |

### SUGGESTION
| # | Archivo | Método | Línea | Hallazgo | Regla |
|---|---|---|---|---|---|
| 1 | src/app/(tablero)/acerca/page.tsx | AcercaPage | 4 | La URL `localhost:3000` está fija en el código. Desaparece al corregir el CRITICAL 1. | Configuración sin valores hardcodeados |

Los cambios de `CLAUDE.md` (regla del modo `demo`) son documentación y no tienen hallazgos. Excluí `.claude/`, `openspec/` y `evidencias/` como indica el flujo.

Veredicto: requiere cambios
