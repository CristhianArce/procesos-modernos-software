# Proposal

## Why

Las historias 3 a 10 se van a construir con un orquestador de agentes de Claude Code que sigue el flujo SDD con OpenSpec (issue #1, HU 1a). Hoy el repositorio solo tiene documentación y el skill `crear-hu`. Falta la configuración de IA: reglas del proyecto, permisos, agentes, skills y un CI mínimo, todo versionado y probado. Sin eso, cada integrante tendría que armar el entorno a mano, y el orquestador no podría correr de punta a punta en la demo (entrega: martes 24 de noviembre).

## What Changes

- OpenSpec inicializado (`openspec init --tools claude --language es --scope project`) con el ajuste mínimo de `openspec/config.yaml`: encabezados de specs en inglés, `CA-n` en requisitos y tareas, y `## Purpose` en capacidades nuevas. Cubre CA-1.
- `CLAUDE.md` con las reglas del proyecto (propuesta, sección 8) y las prohibiciones de los agentes. Cubre CA-1.
- `.claude/settings.json` con los permisos que dejan trabajar al orquestador y una lista `deny` contra merge, aprobación, amend, rebase, reset, force push y la edición de `.github/` en worktrees. También `.gitignore` para `.flujo/` y `.claude/worktrees/`. Cubre CA-3.
- Agentes `preparador`, `revisor-salida`, `revisor-reglas` y `trazabilidad` en `.claude/agents/`, sin permiso para lanzar subagentes, con fixtures que prueban sus veredictos. Cubre CA-2, CA-4, CA-5 y CA-7.
- Skills `orquestador` (modo `demo`, solo invocable por la persona), `build-test`, `entorno-docker`, `commit` y `abrir-pr`, con los scripts Node compartidos y las plantillas de `<trabajo>`. Cubre CA-2, CA-6 y CA-7.
- CI mínimo en GitHub Actions: pruebas `node --test` de `.claude/`, `openspec validate --strict` y, cuando exista el proyecto (HU 1b), lint, typecheck, `test:unit` y build. Derivado: decisión #21 del plan.

Fuera de alcance:
- el modo normal reducido del orquestador;
- las piezas pospuestas (`esperar-ci`, `validador-comentarios`, `generar-planes-prueba`, `ejecutor-e2e`, `reporte-historia`, `solicitar-revision-humana`, automatización de `cierre-post-merge`, modo `manual`, `decisor.js`, `guardia.mjs`);
- el proyecto Next.js (HU 1b);
- Docker, CD e imagen (HU 2).

## Capabilities

### New Capabilities
- `entorno-sdd`: configuración del entorno de IA del repositorio: OpenSpec y sus reglas, reglas del proyecto para Claude Code, permisos y prohibiciones, y CI mínimo que valida esa configuración.
- `agentes-sdd`: agentes de Claude Code del flujo SDD (preparación del issue, puertas de calidad, revisión de reglas y trazabilidad), con sus entradas, veredictos y prohibiciones.
- `orquestador-sdd`: orquestación de una historia en modo `demo`, desde el issue hasta el PR en borrador con evidencias, más los skills de compilación y prueba, entorno Docker, commit y apertura del PR.

### Modified Capabilities
- Ninguna. `openspec/specs/` está vacío.

## Impact

- Archivos nuevos: `openspec/`, `.agents/skills/`, `.claude/skills/openspec-*`, `CLAUDE.md`, `.claude/settings.json`, `.claude/orquestador.json`, `.claude/agents/*.md`, `.claude/skills/{orquestador,build-test,entorno-docker,commit,abrir-pr}/`, `.claude/fixtures/`, `.gitignore`, `.github/workflows/ci.yml` y `evidencias/issue-1/`.
- No toca código de la aplicación, el esquema ni el contrato OpenAPI.
- Dependencias: ninguna librería nueva. Las pruebas usan `node --test`. Requiere OpenSpec 2.1 y `gh` en cada portátil.
- Las pruebas de `build-test`, `commit` y el modo `demo` (CA-6, CA-7) dependen de la HU 1b (#2) y del compose mínimo de la HU 2.
