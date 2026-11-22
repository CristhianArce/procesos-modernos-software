---
name: build-test
description: Compila y prueba la historia en curso (npm run typecheck, test:unit y test:integration contra una BD propia de la corrida, que el script levanta y migra) y clasifica el fallo como código o entorno. Deja el resultado en estado.md para que commit lo lea. Úsalo en el paso 6 del orquestador.
argument-hint: <n>
allowed-tools: Bash(node .claude/skills/build-test/scripts/*) Read
---

# build-test

Ficha 3.9 de `docs/flujo-orquestador.md`. `lint` y `next build` no se corren aquí: los corre el CI.

## Uso

```bash
node .claude/skills/build-test/scripts/build-test.mjs <n>
```

Se ejecuta desde la raíz del repo, sin `cd`. Precondición: `node_modules` instalado, Docker en marcha y `.env` en la raíz con `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` (`SESSION_SECRET` y `METRICS_TOKEN` pueden faltar: el script les da un valor de relleno, solo para que docker compose pueda leer el archivo). La BD no hace falta prepararla a mano.

## Qué hace

1. Corre en orden `npm run typecheck`, `npm run test:unit` y `npm run test:integration`. Se detiene en el primer paso que falla. Con `--sin-bd` (modo práctica, sin BD) corre solo `typecheck` y `test:unit`.
   - Antes de `test:integration` prepara la BD de la corrida (`scripts/bd.mjs`), siempre con `docker compose -p flujo-issue-<n>`: `up -d --wait db`, `run --rm flyway migrate` (aplica también la migración nueva de la historia), `npm run seed` y `DATABASE_URL` armada con el puerto efímero de `port db 5432` y las credenciales de `.env`. Es una BD local y desechable de este issue: nunca una compartida, ni la de desarrollo de la persona (proyecto `tablero`).
   - Si Flyway rechaza la validación porque una migración ya aplicada cambió (la historia corrigió la suya), recrea esa BD una vez (`down -v`, `up`, `migrate`). Si vuelve a fallar, es un fallo de **código**.
   - Para borrar la BD de una corrida: `docker compose -p flujo-issue-<n> down -v` (lo hace la persona, al fusionar o descartar la historia).
   - Si `DATABASE_URL` ya está en el entorno (el CI, o la persona la exportó), la usa tal cual y no toca Docker.
   - `--solo <paso>` corre un solo paso (por ejemplo `--solo test:integration` durante la implementación). No cuenta como build: no escribe en `estado.md` y `commit` no lo acepta.
   - `--comprobar-bd` es la precondición del orquestador: comprueba que la BD de la corrida levanta y que `.env` tiene las credenciales, sin migrar ni probar (código 0 o 2, con el primer error de Docker).
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
| 2 | Fallo de **entorno** (Docker o BD caída, faltan credenciales en `.env`, red, npm, falta el proyecto) | Detiene el item: no se arregla tocando código |

Si el mismo error se repite o se agotan los reintentos, el item se detiene.
