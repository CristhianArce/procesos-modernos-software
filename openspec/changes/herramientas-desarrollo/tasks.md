# Tasks

## 1. Proyecto y herramientas

- [x] 1.1 Generar la app con `create-next-app@16.4.6` (TypeScript, App Router, Tailwind, ESLint, `src/`) en una carpeta temporal, copiarla al repo sin pisar `README.md` ni `.gitignore`, y fijar las versiones exactas en `package.json`; verificar que `npm ci` termina con 0 (CA-1; Derivado: decisión #2)
- [x] 1.2 Instalar las dependencias del stack (`zod`, `pg`, `jose`, `pino`, `prom-client`, `recharts`, `server-only`) y de desarrollo (`vitest`, `@playwright/test`, `@types/pg`) con versión exacta; verificar que `npm ls` no reporta dependencias faltantes (CA-1)
- [x] 1.3 Crear la estructura `src/modulos/`, `src/nav/`, `contracts/`, `db/migration/`, `db/seed/`, `e2e/`, `evidencias/.gitkeep` y `AGENTS_LOG.md` (índice vacío) y `.env.example` solo con nombres (`DATABASE_URL`, `SESSION_SECRET`, `METRICS_TOKEN`, credenciales de Postgres y Flyway); verificar con `ls` y que `.env.example` no tiene valores (CA-1; RN-4)
- [x] 1.4 Scripts `lint` (`eslint .`), `typecheck` (`tsc --noEmit`), `test:unit`, `test:integration`, `build`, `seed` y `e2e`; `vitest.config.mts` con los proyectos `unit` e `integration` y `server-only` aliasado; ESLint con `no-console`; verificar que los cuatro comandos de CA-1 terminan con 0 sobre el proyecto vacío (CA-1; Derivado: decisión #10)
- [x] 1.5 Excluir `.claude/worktrees/` y `.flujo/` en `tsconfig.json`, `eslint.config.mjs` y `vitest.config.mts`; verificar creando `.claude/worktrees/roto/x.ts` con un error de tipos y `.flujo/issue-0/x.test.ts` que falla, corriendo typecheck, lint y pruebas en verde, y borrando ambos (CA-7; Derivado: decisión #11)
- [x] 1.6 `next.config.ts` con `output: "standalone"`, `poweredByHeader: false`, `cacheComponents: false` y las cabeceras de seguridad; verificar con una prueba de integración que lee `headers()` de la configuración y encuentra CSP, HSTS, `X-Frame-Options` y `X-Content-Type-Options` (Derivado: decisión #1)

## 2. Núcleo `src/lib`

- [x] 2.1 `logger.ts` (pino con `redact`) y `errores.ts` (`ErrorHttp` con estado y mensaje); prueba unitaria: un objeto con `password` y `authorization` sale con ambos redactados (CA-5; Derivado: decisión #8)
- [x] 2.2 `metrics.ts` con el registro en `globalThis`, `http_requests_total` e `http_request_duration_seconds`; prueba unitaria: importar dos veces no duplica el registro y el contador sube con `registrarPeticion` (CA-3; Derivado: decisión #9)
- [x] 2.3 `http.ts` con `conHttp(ruta, handler)`; pruebas unitarias: un `POST` con `{"password":"secreta-123"}` deja una línea con `metodo`, `ruta`, `estado` y `ms` sin `secreta-123`; un `ErrorHttp(403)` da 403 en JSON; un error cualquiera da 500 en JSON sin el detalle y log con estado 500 (CA-5; Derivado: decisión #7)
- [x] 2.4 `session.ts` (firmar y verificar el JWT con `jose`) y `dal.ts` (`sessionFromRequest`, `requireRole`); pruebas unitarias: token válido devuelve `sub` y `rol`, firma inválida y vencido dan `null`, sin cookie da 401, rol `tecnico` contra `administrador` da 403 (CA-6; Derivado: decisión #4)
- [x] 2.5 `db.ts` con un `Pool` de `pg` perezoso sobre `DATABASE_URL` e `import "server-only"`; verificar con typecheck que importar el módulo no abre conexión (Derivado: decisión #12)

## 3. Registro de extensiones `src/nav`

- [x] 3.1 Tipos `ItemMenu` (`etiqueta`, `href`, `roles`, `orden`), `Panel` y `SuscriptorAlerta`, y la función pura `construirRegistro(modulos)` con `menuPara(rol)`; pruebas unitarias con un módulo de prueba que declara las tres extensiones: aparecen las tres, el menú sale ordenado por `orden` y un ítem solo para `administrador` no aparece para `tecnico` (CA-4; Derivado: decisión #3)
- [x] 3.2 Descubrimiento con `import.meta.glob` sobre `src/modulos/*/{menu,paneles,on-alerta}.ts` (tope de 30 minutos), verificado con `npm run build` y con Vitest; si falla, `src/nav/modulos.ts` con imports explícitos, anotado en la decisión #3 de `design.md`. Verificar que ningún archivo del núcleo nombra el módulo de prueba (CA-4)

## 4. Handlers y contrato

- [x] 4.1 `src/app/api/health/route.ts` con `conHttp`; prueba de integración con `new Request`: 200, JSON, `status` `ok` y `version` igual a la de `package.json` (CA-2; Derivado: decisión #6)
- [x] 4.2 `src/app/api/metrics/route.ts` con `conHttp`; pruebas de integración: sin cabecera da 401 JSON, token incorrecto da 401 JSON, `METRICS_TOKEN` sin definir da 401, token correcto tras llamar a `/api/health` da 200 con `http_requests_total` para `ruta="/api/health"` (CA-3)
- [x] 4.3 `contracts/openapi.yaml` (OpenAPI 3.1) con `/api/health` y `/api/metrics` y sus respuestas 200 y 401; verificar con una prueba unitaria que declara OpenAPI 3.1 y que cada ruta de `src/app/api` aparece en `paths` (sin parser de YAML: el stack no trae uno) (CA-2, CA-3)

## 5. Páginas y `proxy.ts`

- [x] 5.1 `src/proxy.ts` con el `matcher` de la decisión #5; pruebas unitarias: `/` sin cookie y con firma inválida redirige a `/login`, con sesión válida pasa, y el `matcher` no incluye `/api/health` ni `/login` (CA-6; Derivado: decisión #5)
- [x] 5.2 Layout del tablero `src/app/(tablero)/layout.tsx` (menú desde `menuPara(rol)` de la sesión) y `src/app/(tablero)/page.tsx` de inicio, dinámicos; prueba de integración: una ruta de prueba protegida con `requireRole` responde 401 JSON sin `Location` y 403 JSON con rol insuficiente (CA-6)

## 6. Semilla

- [x] 6.1 `scripts/seed.mjs`; verificar que sin archivos en `db/seed/` imprime que no hay semillas y termina con 0, y que sin `DATABASE_URL` termina con error claro (Derivado: decisión #12)

## 7. Integración y aceptación

- [x] 7.1 Clon limpio: clonar la rama en una carpeta temporal, `npm ci`, y correr lint, typecheck, `test:unit`, `test:integration` y build en verde; anotar en `evidencias/issue-2/pruebas/clon-limpio.md` (CA-1)
- [x] 7.2 Smoke `e2e/health.spec.ts` (`@smoke`, nombre `#2 CA-2: ...`); verificar con `npx playwright test --list` que Playwright lo encuentra (CA-2)
- [x] 7.3 `evidencias/issue-2/trazabilidad.md` con la tabla CA → requisito → tarea → archivo → prueba, verificada con `node .claude/skills/orquestador/scripts/trazabilidad-grep.mjs` (CA-1 a CA-7)

## Workflow follow-up

- Correr el smoke contra la app levantada: `BASE_URL=http://localhost:<puerto> npm run e2e` (verificado en local contra `next start`; en el CI llega con la HU 2).
- Abrir el PR con `Closes #2` y `Change: herramientas-desarrollo`, y esperar que el job `proyecto` del CI corra lint, typecheck, `test:unit` y build en verde (CA-1).
- Después del merge, archivar con `openspec archive herramientas-desarrollo --yes` en un PR propio y verificar `openspec validate --specs --strict`.
