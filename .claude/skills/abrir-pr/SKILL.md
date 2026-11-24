---
name: abrir-pr
description: Abre el PR en borrador de la historia en curso con el cuerpo mínimo (resumen, Closes #n, tabla de CA, migraciones, cómo probar y Change) y lo deja abierto. Si ya existe un PR para la rama, devuelve ese y no crea otro. Úsalo en el paso 8 del orquestador.
argument-hint: <n> <rama> <base> <título>
allowed-tools: Bash(gh pr view *) Bash(gh pr list *) Bash(gh pr create *) Bash(gh pr edit *) Bash(node .claude/skills/orquestador/scripts/*) Read Write
---

# abrir-pr

Guía: `docs/flujo-orquestador.md`. Todos los comandos van desde la raíz del repo, sin `cd`, y un comando por llamada.

## Pasos

1. **Cuerpo**: el orquestador ya escribió `.flujo/issue-<n>/pr-body.md` (resumen, `Closes #<n>`, tabla de CA, migraciones o "Ninguna", cómo probar y `Change: <change>`). Si no existe, escríbelo tú con esa estructura.
2. **Una sola llamada** (crea el borrador, agrega la etiqueta `migracion` si el diff trae archivos en `db/migration/`, registra `PR` y `Estado del item` en `estado.md`):

   ```bash
   node .claude/skills/orquestador/scripts/abrir-pr.mjs <n> --rama <rama> --base <base> --titulo "<título>"
   ```

   El título va **sin** `(#<n>)`: el script lo agrega. Si ya hay un PR de la rama, el script lo devuelve (`YA EXISTÍA`) y no crea otro. Si la etiqueta `migracion` no existe, abre el PR sin ella y lo indica.
3. **El PR debe quedar abierto.** El script verifica al final que el estado sea `OPEN` y falla si no lo es. Un PR cerrado no se reabre solo: se informa a la persona.

## Salida

`CREADO <url>` o `YA EXISTÍA <url>`.

## Prohibido

- `gh pr merge`, `gh pr ready` (el PR queda en borrador), `gh pr close`, aprobar o pedir cambios en el PR.
- Crear un segundo PR para la misma rama.
