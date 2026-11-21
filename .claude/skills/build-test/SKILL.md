---
name: build-test
description: Compila y prueba la historia en curso (npm run typecheck, test:unit y test:integration contra la BD de desarrollo ya migrada) y clasifica el fallo como código o entorno. Deja el resultado en estado.md para que commit lo lea. Úsalo en el paso 6 del orquestador.
argument-hint: <n>
allowed-tools: Bash(node .claude/skills/build-test/scripts/*) Read
---

# build-test

Ficha 3.9 de `docs/flujo-orquestador.md`. `lint` y `next build` no se corren aquí: los corre el CI.

## Uso

```bash
node .claude/skills/build-test/scripts/build-test.mjs <n>
```

Se ejecuta desde la raíz del repo, sin `cd`. Precondición: `node_modules` instalado, y la BD de desarrollo levantada y migrada (`docker compose up -d --wait db` y `docker compose run --rm flyway migrate info`).

## Qué hace

1. Corre en orden `npm run typecheck`, `npm run test:unit` y `npm run test:integration`. Se detiene en el primer paso que falla. Con `--sin-bd` (modo práctica, sin BD) corre solo `typecheck` y `test:unit`.
2. Guarda toda la salida en `.flujo/issue-<n>/build-<fecha>.log`.
3. Escribe en `.flujo/issue-<n>/estado.md` los campos `Último build`, `Log del último build` y `Fecha del último build`.
4. Imprime:
   - `BUILD SUCCESS`, o
   - `BUILD FAILURE`, con el paso, la clasificación (`codigo` o `entorno`), el primer error y la ruta del log.

## Código de salida

| Código | Significado | Qué hace el orquestador |
|---|---|---|
| 0 | `BUILD SUCCESS` | Sigue |
| 1 | Fallo de **código** (tipos, prueba roja) | Corrige en una pasada todos los errores del log, sin tocar nada más, y vuelve a correr (consume un reintento de compile) |
| 2 | Fallo de **entorno** (Docker o BD caída, red, npm, falta el proyecto) | Detiene el item: no se arregla tocando código |

Si el mismo error se repite o se agotan los reintentos, el item se detiene.
