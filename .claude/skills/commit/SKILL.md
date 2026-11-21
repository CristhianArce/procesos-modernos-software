---
name: commit
description: Commitea y sube los archivos de la historia en curso, solo si el último build-test está en verde y es posterior a la última edición (salvo un commit que solo incluya evidencias/). Mensaje con el issue y el change. Úsalo en el paso 8 del orquestador.
argument-hint: <n> <change> <ruta>...
allowed-tools: Bash(node .claude/skills/orquestador/scripts/*) Bash(git add *) Bash(git commit -m *) Bash(git push -u origin feature/issue-*) Bash(git status *) Bash(git branch *) Read
---

# commit

Ficha 3.15 de `docs/especificacion-skills-agentes-orquestador.md`. Todos los comandos van desde la raíz del repo, sin `cd`, y un comando por llamada.

## Pasos

1. **Verificar el build**:
   ```bash
   node .claude/skills/orquestador/scripts/puede-commitear.mjs <n> <ruta1> <ruta2> ...
   ```
   Si imprime `NO COMMITEAR`, **no commitees**. Devuelve el motivo al orquestador, que debe correr `build-test` de nuevo. Un commit que solo incluye `evidencias/` no exige build.
2. **Agregar solo las rutas explícitas**: `git add <ruta1> <ruta2> ...`. Nunca uses `git add -A` ni `git add .`. Excluye siempre `.flujo/`, `.env` y `.claude/`.
3. **Commitear**. El mensaje sigue el estilo del repo, con el porqué breve y la línea del change, y sin menciones a la IA (la autoría de cada agente queda en `evidencias/issue-<n>/agentes.md`):
   ```bash
   git commit -m "<tipo>: <descripción> (#<n>)" -m "<porqué>" -m "Change: <change>"
   ```
   `<tipo>` es `feat`, `fix`, `test`, `docs` o `chore`.
4. **Subir**: `git push -u origin <rama>`, con `<rama>` = `feature/issue-<n>-<slug>`.

## Salida

El sha del commit (`git log` no hace falta: lo imprime `git commit`), la rama y si se hizo push.

## Prohibido

- `--amend`, `--no-verify`, `--force`, `git reset`, `git rebase` y commitear sin el paso 1.
- Commitear `.flujo/`, `.env` o `.claude/`.
