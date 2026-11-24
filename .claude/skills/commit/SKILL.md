---
name: commit
description: Commitea y sube los archivos de la historia en curso, solo si el último build-test está en verde y es posterior a la última edición (salvo un commit que solo incluya evidencias/). Mensaje con el issue y el change. Úsalo en el paso 8 del orquestador.
argument-hint: <n> <change> <ruta>...
allowed-tools: Bash(node .claude/skills/orquestador/scripts/*) Bash(git add *) Bash(git commit -m *) Bash(git push -u origin feature/issue-*) Bash(git status *) Bash(git branch *) Read
---

# commit

Guía: `docs/flujo-orquestador.md`. Todos los comandos van desde la raíz del repo, sin `cd`, y un comando por llamada.

## Pasos

**Una sola llamada** (verifica el build, agrega solo las rutas explícitas, commitea y sube):

```bash
node .claude/skills/orquestador/scripts/commitear.mjs <n> --rama feature/issue-<n>-<slug> --mensaje "<tipo>: <descripción> (#<n>)" --porque "<porqué breve>" --change <change> <ruta1> <ruta2> ...
```

- `<tipo>` es `feat`, `fix`, `test`, `docs` o `chore`. El mensaje cita el issue y el script agrega la línea `Change: <change>`. Sin menciones a la IA: la autoría de cada agente queda en `evidencias/issue-<n>/agentes.md`.
- El script rechaza (código 1, `NO COMMITEAR: <motivo>`) un build que no esté en verde o sea anterior a la última edición de las rutas (un commit que solo incluye `evidencias/` no exige build), las carpetas, `.`, y las rutas de `.flujo/`, `.claude/`, `node_modules/` y `.env`. Con `NO COMMITEAR`, **no commitees por otro medio**: devuelve el motivo al orquestador, que debe correr `build-test` de nuevo.
- Los pasos manuales equivalentes, si el script no se puede usar: `node .claude/skills/orquestador/scripts/puede-commitear.mjs <n> <rutas>`, `git add <rutas>`, `git commit -m ... -m ... -m "Change: <change>"` y `git push -u origin <rama>`.

## Salida

`COMMIT <sha> en <rama> (push hecho)`.

## Prohibido

- `--amend`, `--no-verify`, `--force`, `git reset`, `git rebase` y commitear sin la verificación del build.
- `git add -A` y `git add .`. Commitear `.flujo/`, `.env` o `.claude/`.
