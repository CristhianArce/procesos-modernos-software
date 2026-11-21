---
name: abrir-pr
description: Abre el PR en borrador de la historia en curso con el cuerpo mínimo (resumen, Closes #n, tabla de CA, migraciones, cómo probar y Change). Si ya existe un PR para la rama, devuelve ese y no crea otro. Úsalo en el paso 8 del orquestador.
argument-hint: <n> <rama> <base> <título>
allowed-tools: Bash(gh pr view *) Bash(gh pr list *) Bash(gh pr create *) Bash(gh pr edit *) Bash(node .claude/skills/orquestador/scripts/*) Read Write
---

# abrir-pr

Ficha 3.16 de `docs/flujo-orquestador.md`. Todos los comandos van desde la raíz del repo, sin `cd`, y un comando por llamada.

## Pasos

1. **¿Ya existe?** Ejecuta `gh pr view <rama> --json number,url,state`. Si devuelve un PR con estado `OPEN`, **no crees otro**: devuelve su número y su URL, y salta al paso 4.
2. **Cuerpo**: el orquestador ya escribió `.flujo/issue-<n>/pr-body.md` con la plantilla `.claude/skills/orquestador/plantillas/pr-body.md`. Si no existe, escríbelo tú con esa plantilla: resumen, `Closes #<n>`, tabla de CA, migraciones (o "Ninguna"), cómo probar y `Change: <change>`.
3. **Crear**:
   ```bash
   gh pr create --draft --base <base> --head <rama> --title "<título> (#<n>)" --body-file .flujo/issue-<n>/pr-body.md
   ```
   Si el diff tiene archivos en `db/migration/`, agrega la etiqueta `migracion` (`gh pr edit <pr> --add-label migracion`; si la etiqueta no existe, omite este paso e indícalo).
4. **Registrar**: `node .claude/skills/orquestador/scripts/estado.mjs escribir <n> PR <url>` y `node .claude/skills/orquestador/scripts/estado.mjs escribir <n> "Estado del item" "PR abierto"`.

## Salida

El número y la URL del PR, y si se creó o ya existía.

## Prohibido

- `gh pr merge`, `gh pr ready` (el PR queda en borrador), aprobar o pedir cambios en el PR.
- Crear un segundo PR para la misma rama.
