# Prueba de clon limpio (tarea 8.1; CA-2)

- **Fecha:** 2026-11-21.
- **Montaje:** `git clone --branch feature/issue-1-configuracion-ia-sdd` en una carpeta nueva (fuera del checkout de trabajo), en el commit `46c91ac`. Luego, una sesión nueva `claude -p --model sonnet` en esa carpeta, sin instalar nada.
- **Pregunta, sin herramientas:** qué agentes del proyecto tiene disponibles para la herramienta Agent y qué skills para la herramienta Skill.

## Resultado

| Esperado | Obtenido | Cumple |
|---|---|---|
| Agentes `preparador`, `revisor-salida`, `revisor-reglas` disponibles | Los 3, más `trazabilidad` (que se conserva fuera del flujo) | Sí |
| Skills `build-test`, `commit`, `abrir-pr` y los 6 de OpenSpec disponibles | Todos aparecen | Sí |
| El `orquestador` solo lo invoca la persona | No aparece en la lista de skills que el modelo puede invocar (`disable-model-invocation: true`) | Sí |

## Hallazgo: diálogo de confianza

Claude Code mostró: `Ignoring 57 permissions.allow entries from .claude/settings.json: this workspace has not been trusted`. En un clon nuevo, las reglas `allow` no se aplican hasta que alguien abre Claude Code en modo interactivo en esa carpeta y acepta el diálogo de confianza. Las reglas `deny` sí se aplican. **Corrección:** se agregó a `CLAUDE.md` (sección 2, "Primera vez en un clon").
