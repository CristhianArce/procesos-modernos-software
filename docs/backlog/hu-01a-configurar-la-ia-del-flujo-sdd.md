## Historia

Como equipo de desarrollo quiero tener versionada y probada toda la configuración de IA del flujo SDD (OpenSpec, reglas del proyecto, permisos, agentes y skills de Claude Code) para implementar las historias 3 a 10 con el orquestador sin armar el entorno a mano en cada portátil.

## Contexto

Es la parte de **configuración de IA** de la HU 1 de la propuesta (sección 5): `openspec init`, `openspec/config.yaml`, `CLAUDE.md`, `.claude/settings.json` y los agentes y skills del orquestador (plan de construcción, fases 1A, 3 y 4). Las herramientas de desarrollo quedaron en la HU 1b. Hoy en `.claude/` solo está el skill `crea-hu`. Se construye en modo interactivo, no con el orquestador, porque él depende de esta historia (especificación 2.7).

## Criterios de aceptación

- **CA-1:** Dado el repositorio con OpenSpec inicializado, cuando se valida su configuración, entonces no tiene claves duplicadas. Un change de ejemplo con el formato de specs del proyecto pasa `openspec validate --strict`, y las reglas del proyecto (propuesta, sección 8) se cargan en cada sesión de Claude Code abierta en la raíz.
- **CA-2:** Dado un clon limpio del repositorio, cuando un integrante abre Claude Code en la raíz, entonces están disponibles, sin instalar nada más, los agentes `preparador`, `revisor-salida`, `revisor-reglas` y `trazabilidad` y los skills `orquestador`, `build-test`, `entorno-docker`, `commit`, `abrir-pr` y los de OpenSpec. Ningún agente puede lanzar subagentes, y el `orquestador` solo lo puede invocar la persona.
- **CA-3:** Dada la configuración de permisos del proyecto, cuando una sesión de Claude Code intenta merge, aprobar un PR, amend, rebase, reset, force push o editar `.github/`, entonces el comando se rechaza. Crear y borrar un worktree en `.claude/worktrees/` no pide confirmación.
- **CA-4:** Dado un change de ejemplo con los encabezados de requisitos en español (`### Requisito:`), cuando el `revisor-salida` evalúa la puerta G2, entonces devuelve `CORREGIR` con un hallazgo de formato. Con el change de ejemplo correcto devuelve `APROBADO`.
- **CA-5:** Dado un parche de ejemplo con SQL fuera de la capa de repositorio y un `fetch` a la propia API desde una página, cuando el `revisor-reglas` lo revisa, entonces devuelve al menos un hallazgo `CRITICAL` por cada violación, con la escala `CRITICAL`/`WARNING`/`SUGGESTION`.
- **CA-6:** Dado un issue de práctica abierto, con la base de datos levantada y migrada, cuando la persona ejecuta `/orquestador <n> demo`, entonces en 7 minutos o menos queda un único PR en borrador que cita el issue y el nombre del change, y en su rama queda commiteado `evidencias/issue-<n>/` con la trazabilidad CA → requisito → tarea → código → prueba. Si se repite la apertura del PR, se devuelve el PR existente.
- **CA-7:** Dado un issue ya cerrado, cuando se ejecuta el orquestador, entonces el `preparador` devuelve `BLOQUEAR: ya resuelto` y no crea rama, worktree ni PR. Con Docker apagado, el fallo de `build-test` se clasifica como **entorno** y el item se detiene. Sin un build verde reciente en `estado.md`, `commit` se niega a commitear.

## Reglas de negocio

- **RN-1:** Se siguen los niveles de la propuesta. Solo el nivel **Imprescindible** bloquea el cierre. Las piezas de **nota máxima** (`Plan` como revisor cruzado, decisor de 3 agentes más consolidador, `revisor-pr`, `preguntas-tecnicas`) se agregan si sobra tiempo. Las **pospuestas** no se construyen.
- **RN-2:** En modo `demo` todo corre con sonnet, con como máximo 1 `CORREGIR` por puerta, sin worktree (rama `feature/issue-<n>-<slug>` en el checkout principal) y sin `next build` (lo corre el CI).
- **RN-3:** El presupuesto por defecto es el de la especificación 2.5: 20 agentes en los pasos 2 a 4, 2 reintentos por puerta, 2 vueltas de corrección, 2 compiles y 3 rondas de PR.
- **RN-4:** Todo comando sobre un worktree empieza con `cd "<raiz>" && ` y nunca usa `git -C`. Los `<trabajo>` van en `.flujo/issue-<n>/` y los worktrees en `.claude/worktrees/`, ambos fuera de git.
- **RN-5:** En `openspec/config.yaml`, cada clave aparece una sola vez. Las specs van en español, pero `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`, `SHALL`/`MUST` y `**WHEN**`/`**THEN**` quedan en inglés.

## Fuera de alcance

- El proyecto Next.js, la estructura, el núcleo de `src/lib` y los puntos de extensión (HU 1b).
- Docker, `docker compose`, el CD, la imagen en `ghcr.io`, la ampliación del CI (integración con Postgres, Flyway, gitleaks, `npm audit`, CodeQL, build de la imagen), las plantillas de GitHub, CODEOWNERS y las etiquetas del repo (HU 2).
- Las piezas pospuestas: `esperar-ci`, `validador-comentarios`, `generar-planes-prueba`, `ejecutor-e2e`, `reporte-historia`, `solicitar-revision-humana`, la automatización de `cierre-post-merge`, el modo `manual`, el workflow `decisor.js` y el hook `guardia.mjs`.
- Redactar los issues de las HU 3 a 10 (los crea el skill `crea-hu`).
- El modo normal reducido del orquestador (pasos 1 a 6 con G2, G3, los dos revisores y el decisor): se prueba con la HU 3 y no bloquea esta historia.

## Notas técnicas (no vinculantes)

- Change de OpenSpec: `configuracion-ia-sdd` (antes `orquestador-sdd`).
- Primera tarea: `openspec init --tools claude --language es --scope project`, porque desbloquea el change de la HU 1b. Luego, el ajuste mínimo de `openspec/config.yaml` según el plan 4.1 (solo las reglas de formato de specs, `CA-n` y `## Purpose`; el resto va en `CLAUDE.md`), comprobado con `node -e "require('yaml').parse(require('fs').readFileSync('openspec/config.yaml','utf8'),{uniqueKeys:true})"`. Revisar si los skills `openspec-*` traen `disable-model-invocation: true`.
- `CLAUDE.md` según el plan 4.2. `.claude/settings.json` con su lista `deny` según el plan 4.3, comprobando la sintaxis de permisos de la versión instalada de Claude Code. El `deny` incluye `Bash(git reset)` sin argumentos y `Edit` de `.claude/worktrees/**/.github/**`. En modo `demo` (checkout principal) la protección de `.github/` depende de las instrucciones del agente, hasta que exista `guardia.mjs`.
- Pruebas de los scripts `.mjs` y de la configuración con `node --test`, sin dependencias nuevas y sin esperar el Vitest de la HU 1b. Las pruebas de los agentes (CA-4 a CA-7) son corridas reproducibles: fixture fija, prompt fijo y salida guardada en `evidencias/issue-1/pruebas/`.
- Agentes en `.claude/agents/<nombre>.md`, con `model`/`effort`/`tools` según la tabla 1.3 del plan y `disallowedTools: Agent`.
- Skills en `.claude/skills/<nombre>/SKILL.md`. Scripts Node en `.claude/skills/orquestador/scripts/`: `estado.mjs`, `puerto.mjs`, `trazabilidad-grep.mjs`, `migracion-timestamp.mjs` y `copiar-evidencias.mjs`. Plantillas de `<trabajo>` en `.claude/skills/orquestador/plantillas/`.
- `.claude/orquestador.json` con `base`, `owner`, `repo`, `revisor`, `revisorEspecializado` y `limpiarTrabajo`.
- Fixtures en `.claude/fixtures/`, excluidas de lint, typecheck, Vitest y build: un change correcto, uno con encabezados en español, un parche con violaciones y un `<trabajo>` de ejemplo.
- Orden de construcción: OpenSpec, `CLAUDE.md` y permisos, luego las fases 3.0 → 3.10 del plan y al final la fase 4.
- Comprobar si `effort` se puede pasar por invocación de `Agent`. Si no, se usa el del frontmatter y se anota en `agentes.md`.
- **CI mínimo en esta historia** (`.github/workflows/ci.yml`, en cada PR y push a `main`): `node --test` de las pruebas de `.claude/`, `openspec validate --strict` y, en cuanto exista el proyecto (HU 1b), lint, typecheck, `test:unit` y build. La HU 2 lo amplía; así la definición de hecho ("CI en verde") se cumple sin esperar a la HU 2.
- No hay migraciones, semilla ni puntos de extensión.

## Dependencias

- HU 1b (#2, herramientas de desarrollo): necesaria para las pruebas de `build-test`, `commit` y el modo `demo` (CA-6 y CA-7). CA-1 a CA-5 no dependen de ella.
- HU 2 (infraestructura y CI/CD): necesaria solo para CA-6 y la parte de Docker de CA-7.
- 3 issues de práctica (plan, sección 2.0) para las pruebas del orquestador.

## Preguntas abiertas

- Ninguna. Resuelta: la historia cierra con el modo `demo`; el modo normal reducido queda fuera de alcance.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
