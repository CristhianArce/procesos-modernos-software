---
name: actualizar-contexto
description: Amplía la carpeta `context/` (el contexto de negocio y técnico del producto que lee el orquestador) con lo nuevo del repo, sin regenerarla ni borrar nada. Úsalo fuera del flujo, cuando se fusionó una historia, cambió un spec o falta `context/`; el orquestador no lo corre.
argument-hint: (sin argumentos)
disable-model-invocation: true
allowed-tools: Read Bash(node .claude/skills/actualizar-contexto/scripts/*) Bash(git status*) Bash(git diff*)
---

# Actualizar el contexto (`context/`)

Guía: `docs/flujo-orquestador.md`. Desde la raíz del repo, sin `cd`, un comando por llamada. **No forma parte del flujo del orquestador**: él solo lee `context/`. Lo corre la persona, a mano.

## Cuándo usarlo

- Primera vez en un clon sin `context/` (el orquestador se bloquea si falta).
- Después de fusionar una historia: sus `RN-n`, su change y sus tablas son lo nuevo.
- Cuando cambió un spec, `docs/propuesta.md` o la configuración (`package.json`, Vitest, Playwright, Docker).

No hace falta correrlo antes de cada historia: si no hay novedades, no escribe nada.

## Pasos

1. `node .claude/skills/actualizar-contexto/scripts/contexto.mjs`. Lee `docs/propuesta.md`, `evidencias/`, `openspec/`, `db/migration/`, `src/`, `contracts/` y las configuraciones. No usa agentes, base de datos ni red.
2. Informa lo que imprime el script: cuántas entradas nuevas y cuántas reemplazadas, y qué archivos tocó. Si dice «Contexto al día», termina.
3. `git diff --stat context` y `git status --short context` para mostrar qué cambió. Si el cambio es grande o inesperado, léelo antes de seguir.
4. **No hagas commit ni push**: la persona decide cómo subirlo (un PR propio o junto a su trabajo).

## Cómo funciona

- `context/contexto.md` es el índice: qué parte lee cada paso y una línea por capacidad. Las partes son `producto`, `historias`, `inventario`, `codigo`, `convenciones` y una `negocio/<capacidad>` por capacidad.
- Cada parte es una lista de **entradas con clave** (`<!-- entrada: tabla usuarios -->`). El script agrega la entrada que no existe y **reemplaza** la que cambió; las demás quedan como están.
- **Nunca borra.** Si algo desaparece del repo (por ejemplo, un change archivado), su entrada sigue en `context/` hasta que alguien la quite a mano. El historial del cambio queda en git.
- No edites las entradas a mano: el script las reescribe en la siguiente corrida. Si una está mal, corrige la fuente (spec, issue, código) y vuelve a correrlo.
- Las reglas de `CLAUDE.md` no se copian: ya están cargadas en cada agente.
- Las capacidades de plataforma y proceso van solo por nombre; la lista está en `plataforma` de `.claude/orquestador.json`. Una capacidad nueva cuenta como negocio hasta que se agregue ahí.

## Prohibido

- `git add`, `git commit`, `git push` ni ninguna escritura fuera de `context/`.
- Editar `context/` a mano para «arreglar» una entrada.
