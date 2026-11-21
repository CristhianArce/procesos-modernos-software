# Design

## Context

La motivación está en proposal.md, en la sección "Why". El diseño detallado de cada pieza ya existe: `docs/especificacion-skills-agentes-orquestador.md` tiene las fichas 3.0 a 3.23 y `docs/plan-construccion-sdd.md` tiene los borradores 4.1 a 4.5. Este documento solo registra las decisiones que condicionan la implementación.

Restricciones:
- Se implementa en un solo día y en secuencia: entrega A, luego la HU 1b y el compose mínimo, y después el resto (plan, decisión #22).
- No hay proyecto Node todavía (`package.json` llega con la HU 1b), así que las pruebas de esta historia no pueden depender de Vitest ni de dependencias del proyecto.
- La versión instalada es Claude Code 2.1.330. La sintaxis de permisos con espacio (`Bash(git fetch *)`) se comprueba en A8.

**Arranque (registrado para la trazabilidad):** las tareas 1.1 a 1.3 se hicieron antes de que existiera este change, porque sin `openspec init` no hay dónde proponer. Al aplicar el ajuste mínimo de `config.yaml` apareció un fallo silencioso: una regla sin comillas con `": "` se leía como mapa, y OpenSpec la ignoraba solo con una advertencia. Por eso CA-1 comprueba también que cada regla sea texto.

## Goals / Non-Goals

**Goals:**
- Cada pieza imprescindible con una prueba aislada antes de que el orquestador la use.
- Configuración verificable por máquina en el CI (CA-1, CA-3) y comportamiento de agentes verificable con corridas reproducibles (CA-4 a CA-7).

**Non-Goals:**
- Garantizar por permisos las prohibiciones dentro del checkout principal, donde trabaja el orquestador. Ahí rigen las instrucciones de los agentes hasta que exista `guardia.mjs`, que está pospuesto.
- Pruebas automáticas deterministas del criterio de los agentes. La salida de un modelo no es determinista.

## Decisions

1. **Pruebas con `node --test` en `.claude/tests/`** (Derivado: decisión #3 de la sesión de planificación).
   - Sin dependencias y sin esperar el Vitest de la HU 1b.
   - Para leer YAML se usa el paquete `yaml` que trae OpenSpec instalado globalmente, resuelto con `npm root -g`. Si no está, la prueba falla con un mensaje claro.
   - Alternativas descartadas: Vitest (no existe el proyecto todavía) y un parser YAML propio (frágil).
2. **`config.yaml` mínimo.** Solo las reglas de formato de specs, `CA-n` y `## Purpose`. El resto vive en `CLAUDE.md` (plan 4.1). Así hay una sola fuente de reglas y menos riesgo de claves duplicadas.
3. **`deny` ampliado** (plan 4.3).
   - Agrega `Bash(git reset)` sin argumentos, porque `git reset *` no lo cubre.
   - Agrega `Edit` de `/.claude/worktrees/**/.github/**` (cubre todas las herramientas de edición), limitado a los worktrees para no estorbar a quien edita el CI en modo interactivo.
4. **Pruebas de agentes como corridas reproducibles.** Cada una usa una fixture fija y un prompt fijo, y su salida se guarda en `evidencias/issue-1/pruebas/<pieza>.md`. El PR declara que CA-4 a CA-7 se verifican así y no con pruebas unitarias.
5. **Una sola rama de integración sin sub-ramas** (`feature/issue-1-configuracion-ia-sdd`), con un commit por pieza que cita `#1` y la tarea. Hay un PR de arranque (`Refs #1`) y un PR de cierre (`Closes #1`). Alternativa descartada: sub-ramas `hu1a/<pieza>`, que solo tienen sentido con varias personas.
6. **CI mínimo en esta historia** (Derivado: decisión #21).
   - Un job `configuracion-ia` con Node 24: instala OpenSpec 2.1 global, corre `node --test ".claude/tests/*.test.mjs"` y `openspec validate --all --strict --no-interactive`.
   - Un job `proyecto` que corre lint, typecheck, `test:unit` y build solo si existe `package.json`. Así el CI sirve antes y después de la HU 1b sin editarlo.
   - La HU 2 agrega el resto.
7. **Fixtures en `.claude/fixtures/`.** La HU 1b las excluye de lint, typecheck y Vitest (plan 1.1). El change de ejemplo vive ahí y no en `openspec/changes/`, para que `openspec validate --all` no lo valide como change real. Las pruebas lo copian a un directorio temporal con su propio `openspec/` y lo validan allí.
8. **Modelos.** Todo con sonnet. `model` y `effort` se pasan en cada invocación y quedan en `agentes-log.md`.
9. **Un solo modo de 8 pasos, 5 minutos o menos** (decisión del usuario, 2026-11-21): preparador → `contexto.mjs` → propose → G2 (`revisor-salida` con `openspec validate` y `trazabilidad-grep.mjs`) → apply → `build-test` en paralelo con `revisor-reglas` → una corrección solo si hay CRITICAL → commit, PR en borrador y evidencias. Se descartó mantener dos modos (`demo` y normal reducido), porque complicaba el flujo. Salen del flujo el agente `trazabilidad` (en su lugar, un script; ahorra unos 30 s), G3, la trazabilidad final, `entorno-docker`, worktrees, decisor, revisor cruzado y explorar.

10. **Alcance: esta historia solo consolida el orquestador** (decisión del usuario, 2026-11-21). No construye nada de la HU 1b (proyecto Next.js) ni de la HU 2 (Docker y CI/CD); las hacen otras personas o sesiones. Las tareas que necesitan el proyecto o la BD (6.1, 7.2, 7.3 y el grupo 8) esperan a esas historias. Todo lo demás se prueba sin ellas: con fixtures, proyectos falsos, el issue de prueba #6 y ramas remotas de prueba.
11. **Permisos para los skills del flujo.** En una sesión sin persona, la herramienta Skill pide permiso para cada skill del proyecto (verificado en la tarea 6.3). Por eso `settings.json` permite `Skill(openspec-propose)`, `Skill(openspec-apply-change)`, `Skill(build-test)`, `Skill(commit)` y `Skill(abrir-pr)`.

## Risks / Trade-offs

- [La sintaxis de permisos con espacio no la acepta la versión instalada] → Se comprueba en A8 con comandos reales. Si falla, se convierte a la forma `Bash(cmd:*)`, que es la que usan los skills de OpenSpec.
- [`Edit(/...)` no se resuelve relativo a la raíz] → En A8 se prueba escribir en `.flujo/` y en un worktree. Si pide permiso, se cambia a la forma sin barra inicial.
- [El flujo supera los 5 minutos] → Se cronometra en la tarea 7.2. Las palancas son: como máximo 1 `CORREGIR` por puerta, `revisor-reglas` en paralelo con `build-test`, y sin `next build`.
- [CA-6 y CA-7 dependen de la HU 1b y del compose mínimo, que se hacen el mismo día] → El orden de tareas los deja para el final. Si se atrasan, la entrega A y B0 a B5 ya están fusionadas o listas y no se pierden.
- [Claude Code pide aprobación para `cd <dir> && git ...`, porque `git` en otro directorio puede cargar hooks no confiables; verificado en las corridas de la tarea 4.3] → El orquestador trabaja en la raíz y los comandos van sin `cd`. Si en el futuro se usan worktrees (pospuestos), queda pendiente: habrá que aprobar esos comandos o buscar otra forma de aislar.
- [Los agentes arman comandos compuestos (variables, `$(...)`, `; echo $?`) que no coinciden con `allow`] → Los agentes ejecutan un comando simple por llamada (sección "Cómo ejecutar comandos").
- [Las corridas de agentes no son deterministas] → Prompts fijos y veredictos con formato cerrado (`APROBADO`/`CORREGIR`/`BLOQUEAR`, `CRITICAL`/`WARNING`/`SUGGESTION`). Se repite la corrida si el formato no se cumple.
