# Prueba del skill abrir-pr (tarea 6.3; CA-6)

- **Fecha:** 2026-11-21. Sesiones nuevas `claude -p --model sonnet`, que invocan el skill `abrir-pr` con el issue de prueba #6.
- **Montaje:** la rama remota `feature/issue-6-prueba-abrir-pr` (un commit vacío creado con `git commit-tree`, sin cambiar de rama en el checkout) y la base `feature/issue-1-configuracion-ia-sdd`.

| Corrida | Esperado | Obtenido | Tiempo | Cumple |
|---|---|---|---|---|
| 1 | Crea el PR en borrador | PR #7 creado en borrador; URL guardada en `estado.md` | 40 s | Sí |
| 2 | Devuelve el mismo PR sin crear otro | "#7 ya existía"; sigue habiendo un único PR para la rama | 20 s | Sí |

El PR #7 se cerró sin fusionar y la rama de prueba se borró.

## Hallazgo: los skills del proyecto pedían permiso

En la primera ronda, las dos corridas fallaron: la herramienta Skill pidió permiso para `abrir-pr`, y en una sesión sin persona eso equivale a un rechazo. El orquestador se habría trabado igual en los pasos 3, 5, 6 y 8. **Corrección:** `allow` de `Skill(openspec-propose)`, `Skill(openspec-apply-change)`, `Skill(build-test)`, `Skill(commit)` y `Skill(abrir-pr)` en `.claude/settings.json`, con su prueba en `config.test.mjs`.

La negativa de `commit` sin build verde se prueba con `puede-commitear.mjs` en `skills.test.mjs` (3 casos).

## Salida textual: primera ronda (rechazada por permisos)

No pude ejecutar el skill `abrir-pr`: la herramienta Skill lo bloqueó por permisos y devolvió este error: "Execute skill: abrir-pr. The user can add the allow rule Skill(abrir-pr) to .claude/settings.local.json to let it run without asking."

No se creó ningún PR y no hay número ni URL. Tampoco escribí `.flujo/issue-6/pr-body.md`.

Para repetir la prueba, agrega la regla `Skill(abrir-pr)` a `.claude/settings.local.json` y vuelve a lanzarla. No armé el PR a mano con `gh`, porque eso no probaría el skill.

real	0m12.005s
user	0m0.015s
sys	0m0.031s

## Salida textual: segunda ronda, corrida 1

PR #7 — https://github.com/danielfms/procesos-modernos-software/pull/7 — **se creó** (en borrador, base `feature/issue-1-configuracion-ia-sdd`). Es un PR de prueba y así consta en el resumen del cuerpo.

real	0m40.034s
user	0m0.030s
sys	0m0.000s

## Salida textual: segunda ronda, corrida 2

PR #7: https://github.com/danielfms/procesos-modernos-software/pull/7 — ya existía (estado OPEN), no se creó otro.

real	0m20.307s
user	0m0.015s
sys	0m0.015s
