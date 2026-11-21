# Tasks

## 1. Arranque: OpenSpec, reglas y permisos (entrega A, PR `Refs #1`)

- [x] 1.1 Ejecutar `openspec init --tools claude --language es --scope project` y verificar que existen `openspec/config.yaml` y los seis skills `openspec-*` en `.claude/skills/` y en `.agents/skills/` (CA-1, CA-2)
- [x] 1.2 Revisar el frontmatter de los skills `openspec-*`: ninguno trae `disable-model-invocation: true`, así que el orquestador puede invocarlos con la herramienta Skill (CA-2)
- [x] 1.3 Ajuste mínimo de `openspec/config.yaml` (reglas de formato de specs, `CA-n` y `## Purpose`) y verificar que se lee sin claves duplicadas y que `openspec instructions` no advierte reglas ignoradas (CA-1)
- [x] 1.4 Escribir `CLAUDE.md` con las reglas del proyecto y de los agentes (plan 4.2) y verificar que una sesión nueva de Claude Code en la raíz las tiene en contexto (CA-1)
- [x] 1.5 Escribir `.claude/settings.json` con `allow` y `deny` (plan 4.3 más `git reset` sin argumentos y `.github/` en worktrees) y `.gitignore` con `.flujo/`, `.claude/worktrees/`, `.env*` y `!.env.example`; verificar que el JSON es válido (CA-3)
- [x] 1.6 Crear `.claude/tests/config.test.mjs` con `node --test`: `config.yaml` sin claves duplicadas y con todas las reglas como texto; `settings.json` con cada regla `deny` obligatoria; `.gitignore` con `.flujo/` y `.claude/worktrees/`. Verificar que `node --test ".claude/tests/*.test.mjs"` pasa (CA-1, CA-3)
- [x] 1.7 Verificación manual en una sesión nueva: `gh pr merge`, `git commit --amend`, `git rebase`, `git reset` y `git push --force` se rechazan; crear y borrar `.claude/worktrees/prueba` no pide confirmación. Anotar el resultado en `evidencias/issue-1/pruebas/permisos.md` (CA-3)
- [x] 1.8 CI mínimo `.github/workflows/ci.yml` (job `configuracion-ia`: OpenSpec 2.1, `node --test ".claude/tests/*.test.mjs"`, `openspec validate --all --strict --no-interactive`; job `proyecto` condicionado a `package.json`) y verificar que el CI del PR de arranque termina en verde (CA-1, CA-3; Derivado: decisión #21)
- [x] 1.9 Abrir y fusionar el PR de arranque a `main` con `Refs #1`, y verificar que `main` contiene `openspec/`, `CLAUDE.md` y `.claude/settings.json` (Derivado: decisión #22)

## 2. Fixtures y validación del formato de specs (B0)

- [x] 2.1 Crear `.claude/fixtures/change-ok/` (un change con `## Purpose`, `### Requirement:` y escenarios que citan `CA-n`) y `.claude/fixtures/change-espanol/` (el mismo con `### Requisito:`) (CA-1, CA-4)
- [x] 2.2 Crear `.claude/fixtures/parche-violaciones.diff` (SQL en un `service.ts` y `fetch('/api/...')` en un `page.tsx`), `.claude/fixtures/trabajo-ejemplo/` con `estado.md`, `issue.md` y `agentes-log.md`, y `.claude/fixtures/repo-ejemplo/` con una migración (`CREATE TABLE` y `ALTER TABLE … ADD COLUMN`), un módulo con `menu.ts`, una semilla y un `contracts/openapi.yaml` (CA-5, CA-6)
- [x] 2.3 Agregar a `.claude/tests/` una prueba que copia cada change de ejemplo a un directorio temporal con su `openspec/` y verifica que `change-ok` pasa `openspec validate --strict` y `change-espanol` falla (CA-1)

## 3. Configuración, plantillas y scripts del orquestador (B1)

- [x] 3.1 Crear `.claude/orquestador.json` (`base`, `owner`, `repo`, `revisor`, `revisorEspecializado`, `limpiarTrabajo`) y las plantillas de `<trabajo>` en `.claude/skills/orquestador/plantillas/` (especificación 2.1), y verificar con una prueba que existe una plantilla por archivo de la especificación 2.1 (CA-6)
- [x] 3.2 Implementar `estado.mjs` (`leer`/`escribir` campos de `estado.md`) y `puerto.mjs` (parseo de `docker compose port`), y verificar con `node --test` sobre `trabajo-ejemplo` y salidas `0.0.0.0:NNNN` y `[::]:NNNN` (CA-6)
- [x] 3.3 Implementar `trazabilidad-grep.mjs` y verificar que sobre `change-ok` encuentra cada `CA-n` en requisitos, escenarios y tareas (CA-6)
- [x] 3.4 Implementar `migracion-timestamp.mjs` y verificar con `node --test` que renombra una migración de fixture con timestamp menor que la última de la base (CA-6)
- [x] 3.5 Implementar `copiar-evidencias.mjs` y verificar con `node --test` que genera `evidencias/issue-<n>/` con `agentes.md` desde `agentes-log.md` y sin logs (CA-6)
- [x] 3.6 Implementar `contexto.mjs` (sustituye a explorar en `demo`) y verificar con `node --test` sobre `repo-ejemplo` que escribe `<trabajo>/contexto.md` con las tablas y columnas de la migración (`CREATE TABLE` y `ALTER TABLE … ADD COLUMN`), los módulos con sus `menu.ts`/`paneles.ts`/`on-alerta.ts`/`metrics.ts`, las semillas y las rutas del contrato (CA-6)

## 4. Agentes de revisión (B2 a B4)

- [x] 4.1 Escribir `.claude/agents/trazabilidad.md` (haiku / low, `Read, Grep, Glob`, `disallowedTools: Agent`) y verificar con una corrida sobre `change-ok`, pasando `model` y `effort`, que devuelve una fila por `CA-n` sin criterios sin cobertura; guardar en `evidencias/issue-1/pruebas/trazabilidad.md` (CA-6)
- [x] 4.2 Escribir `.claude/agents/revisor-salida.md` (sonnet / medium, ficha 3.5) y verificar con corridas que G2 da `CORREGIR` con un hallazgo de formato sobre `change-espanol` y `APROBADO` sobre `change-ok`, con la cabecera `## G2 — intento <n>`; guardar en `evidencias/issue-1/pruebas/revisor-salida.md` (CA-4)
- [x] 4.3 Escribir `.claude/agents/revisor-reglas.md` (sonnet / high, ficha 3.11) y verificar con una corrida que el parche de ejemplo da al menos dos `CRITICAL` con archivo y línea, solo con la escala `CRITICAL`/`WARNING`/`SUGGESTION`; guardar en `evidencias/issue-1/pruebas/revisor-reglas.md` (CA-5)
- [x] 4.4 Agregar a `.claude/tests/` una prueba de frontmatter: cada agente de `.claude/agents/` tiene `name`, `description`, `model`, `disallowedTools: Agent` y una sección "Prohibido" (CA-2)

## 5. Preparador (B5)

- [x] 5.1 Crear el issue de práctica (uno solo: #6 "PRÁCTICA: Página Acerca de") y verificar que existe con las etiquetas `historia` y `practica` (CA-6, CA-7)
- [ ] 5.2 Escribir `.claude/agents/preparador.md` (sonnet / medium, ficha 3.1) y verificar con el issue de práctica #6 en `demo` que crea `feature/issue-<n>-<slug>` y `.flujo/issue-<n>/issue.md` con `CA-n`, y que una segunda corrida reutiliza todo; guardar en `evidencias/issue-1/pruebas/preparador.md` (CA-6)
- [ ] 5.3 Verificar que con el issue de práctica #6 cerrado el `preparador` devuelve `BLOQUEAR: ya resuelto` sin crear rama ni worktree, y reabrir el issue; guardar en la misma evidencia (CA-7)

## 6. Compilación, entorno, commit y PR (B6 a B8; requiere la HU 1b y el compose mínimo)

- [ ] 6.1 Escribir el skill `build-test` y su `scripts/build-test.mjs` (ficha 3.9) y verificar: verde sobre el proyecto; un tipo roto se clasifica como **código**; con Docker apagado, como **entorno**; la variante `demo` tarda menos de 2 minutos (CA-7)
- [ ] 6.2 Escribir el skill `entorno-docker` y su `scripts/entorno-docker.mjs` (ficha 3.10) y verificar con el compose mínimo que `levantar` obtiene un puerto efímero de `db` y que `bajar` deja `docker ps` sin contenedores de la historia; la prueba con `app` queda para la HU 2 (CA-6)
- [ ] 6.3 Escribir los skills `commit` (ficha 3.15) y `abrir-pr` (ficha 3.16) y verificar que `commit` se niega sin build verde en `estado.md` y que una segunda llamada a `abrir-pr` devuelve el mismo PR (CA-6, CA-7)
- [ ] 6.4 Agregar a la prueba de frontmatter los skills `build-test`, `entorno-docker`, `commit` y `abrir-pr`, con `allowed-tools` acotado (nunca `Bash` a secas) (CA-2)

## 7. Orquestador en modo demo (C1 a C3)

- [ ] 7.1 Escribir `.claude/skills/orquestador/SKILL.md` con `disable-model-invocation: true` (argumentos de 3.0; secuencia de 12 pasos del modo `demo` de `docs/flujo-orquestador.md`: `contexto.mjs` antes de propose, `trazabilidad` antes de G2, G3 sin build, `build-test` en paralelo con `revisor-reglas`, segundo `build-test` solo si hubo correcciones, `copiar-evidencias.mjs` al final; máquina de estados con `estado.mjs`, presupuesto 2.5, reglas de Bloqueado y Escalado, tabla de modelos, `cd "<raiz>" &&` con Bash) y verificar con la prueba de frontmatter que la invocación por el modelo está deshabilitada (CA-2)
- [ ] 7.2 Correr `/orquestador 6 demo` cronometrado y verificar que en 7 minutos o menos queda un único PR en borrador que cita `#<n>` y el change, con `evidencias/issue-<n>/` commiteado; guardar tiempo y salida en `evidencias/issue-1/pruebas/demo.md` (CA-6)
- [ ] 7.3 Provocar las salidas de error con el issue de práctica #6 (cerrado temporalmente da `BLOQUEAR`; Docker apagado da error de **entorno** y el item se detiene) y guardar el resultado en `evidencias/issue-1/pruebas/errores.md` (CA-7)

## 8. Verificación integral y cierre (C4 a C6)

- [ ] 8.1 Prueba de clon limpio: clonar el repo en otra carpeta, abrir Claude Code y verificar que aparecen los 4 agentes, los 5 skills y los 6 de OpenSpec sin instalar nada; anotar en `evidencias/issue-1/pruebas/clon-limpio.md` (CA-2)
- [ ] 8.2 Escribir `evidencias/issue-1/trazabilidad.md` con la tabla CA → requisito → tarea → archivo → prueba y verificar con `trazabilidad-grep.mjs` que cada CA-1 a CA-7 tiene requisito, tarea y prueba (CA-1 a CA-7)
- [ ] 8.3 Abrir el PR de cierre con `Closes #1`, que declare que CA-4 a CA-7 se verifican con corridas reproducibles, y verificar que el CI termina en verde (CA-1 a CA-7)

## Workflow follow-up

- Después del merge del PR de cierre, archivar con `openspec archive configuracion-ia-sdd --yes` en un PR propio y verificar `openspec validate --specs --strict`.
