# Proposal

## Why

El repositorio ya tiene el entorno de IA (HU 1a, #1), pero no tiene aplicación: no hay `package.json` ni `src/`. Sin un proyecto base con estructura, herramientas de calidad y puntos de extensión, el orquestador no tiene qué compilar ni probar (`build-test` corre `typecheck`, `test:unit` y `test:integration`), y las historias 3 a 10 terminarían editando los mismos archivos centrales. Esta historia (issue #2, HU 1b) deja esa base antes de la HU 2 (Docker y CI/CD).

## What Changes

- App Next.js 16 (versión exacta fijada) con la estructura de `CLAUDE.md` §4: `src/app`, `src/modulos`, `src/lib`, `src/nav`, `contracts/`, `db/migration/`, `db/seed/` y `e2e/`. Cubre CA-1.
- Scripts `lint`, `typecheck`, `test:unit`, `test:integration`, `build`, `seed` y `e2e`, con Vitest (proyectos `unit` e `integration`) y Playwright (smoke `@smoke`). Cubre CA-1.
- Núcleo de `src/lib`: envoltorio común de Route Handlers (`http.ts`) con log estructurado sin cuerpos ni secretos (`logger.ts`) y métricas HTTP (`metrics.ts`); núcleo de sesión (`session.ts`, `dal.ts`) con `requireRole`; `db.ts`. Cubre CA-3, CA-5 y CA-6.
- `GET /api/health` público y `GET /api/metrics` protegido con `METRICS_TOKEN`. Cubre CA-2 y CA-3.
- Registro de extensiones (`src/nav/registro.ts`) que descubre los `menu.ts`, `paneles.ts` y `on-alerta.ts` de cada módulo sin editar el núcleo, y filtra el menú por rol. Cubre CA-4.
- `proxy.ts` que redirige a `/login` las páginas del tablero sin sesión y deja pasar `/api/**`, que se autoriza en cada handler. Cubre CA-6.
- Exclusión de `.claude/worktrees/` y `.flujo/` en TypeScript, ESLint y Vitest. Cubre CA-7.
- Cabeceras de seguridad (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`) y `output: "standalone"` en `next.config.ts` (Derivado: decisión #1).
- `contracts/openapi.yaml` con `/api/health` y `/api/metrics`, `.env.example` sin valores, `evidencias/.gitkeep` y `AGENTS_LOG.md` vacío.

Fuera de alcance (issue #2):
- OpenSpec, `CLAUDE.md`, permisos, agentes y skills (HU 1a);
- Dockerfile, `docker compose`, Flyway, la migración de línea base, la semilla real y el CI/CD completo (HU 2);
- tablas de dominio, login y página de login (HU 3).

## Capabilities

### New Capabilities
- `calidad-proyecto`: comandos de calidad del proyecto (lint, typecheck, pruebas y build) en verde desde un clon limpio, ignorando las carpetas de trabajo de los agentes.
- `observabilidad`: salud de la app, métricas en formato Prometheus protegidas por token y log estructurado de cada petición sin datos sensibles.
- `extension-modulos`: descubrimiento de los ítems de menú, paneles de la ficha del nodo y suscriptores de alertas que declara cada módulo, sin editar el núcleo.
- `acceso-tablero`: control de acceso base del tablero: redirección de páginas sin sesión y 401 en JSON para la API protegida.

### Modified Capabilities
- Ninguna. `openspec/specs/` está vacío.

## Impact

- Archivos nuevos: `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `playwright.config.ts`, `proxy.ts` (en `src/`), `src/**`, `contracts/openapi.yaml`, `db/migration/.gitkeep`, `db/seed/.gitkeep`, `e2e/health.spec.ts`, `.env.example`, `evidencias/.gitkeep` y `AGENTS_LOG.md`.
- Dependencias: las del stack fijo (`CLAUDE.md` §3) más las herramientas de desarrollo (TypeScript, ESLint, Vitest, Playwright, `server-only`). Ninguna fuera del stack.
- El job `proyecto` del CI mínimo empieza a correr lint, typecheck, `test:unit` y build en cuanto exista `package.json`.
- Habilita a la HU 2 (empaquetar y desplegar) y a las pruebas de `build-test` del orquestador sobre el proyecto real (HU 1a, CA-6 y CA-7).
