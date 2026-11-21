## Historia

Como equipo de desarrollo quiero un proyecto base con la estructura, las herramientas de calidad, la observabilidad y los puntos de extensión ya definidos para que cada historia agregue su módulo sin editar el núcleo ni chocar con el trabajo de los demás.

## Contexto

Es la parte de **herramientas de desarrollo** de la HU 1 de la propuesta (sección 5) y de la fase 1B del plan de construcción. La configuración de IA para el SDD (OpenSpec, `CLAUDE.md`, permisos, agentes y skills) quedó en la HU 1a. Hoy el repositorio solo tiene documentación. Esta historia deja una app Next.js 16 que compila y pasa las pruebas, con la estructura de la sección 4, el núcleo de `src/lib` y los registros de extensión que usarán las HU 3 a 10.

## Criterios de aceptación

- **CA-1:** Dado un clon limpio del repositorio, cuando se instalan las dependencias y se ejecutan lint, typecheck, pruebas unitarias y build, entonces los cuatro terminan con código 0.
- **CA-2:** Dada la app en ejecución, cuando se hace `GET /api/health` sin autenticación, entonces responde 200 con un cuerpo JSON.
- **CA-3:** Dada la app en ejecución, cuando se hace `GET /api/metrics` sin token o con un token incorrecto, entonces responde 401 en JSON. Con `Authorization: Bearer <METRICS_TOKEN>` responde 200 con métricas en formato Prometheus, incluidas las de peticiones HTTP.
- **CA-4:** Dado un módulo de prueba que declara un ítem de menú, un panel de la ficha del nodo y un suscriptor de alertas, cuando se consulta el registro de extensiones, entonces el ítem, el panel y el suscriptor aparecen sin haber editado ningún archivo del núcleo. Un ítem de menú restringido a un rol no aparece para un usuario con otro rol.
- **CA-5:** Dado un Route Handler que pasa por el envoltorio común, cuando recibe una petición con una contraseña en el cuerpo, entonces se registra una línea de log estructurado con método, ruta, código de estado y duración, y la línea no contiene ni el cuerpo ni la contraseña.
- **CA-6:** Dado un visitante sin sesión, cuando abre una página del tablero, entonces se le redirige a `/login`. Cuando llama a una ruta `/api/...` protegida no hay redirección: recibe 401 en JSON.
- **CA-7:** Dado un worktree en `.claude/worktrees/` con código que no compila y archivos en `.flujo/`, cuando se ejecutan typecheck, lint y pruebas en el checkout principal, entonces esas carpetas se ignoran y los comandos siguen en verde.

## Reglas de negocio

- **RN-1:** El stack es fijo (propuesta, sección 8): TypeScript, Next.js 16 App Router, Route Handlers + Zod, `pg`, Tailwind, Recharts, `jose`, `pino` y `prom-client`. No se usan Server Actions ni un ORM con migraciones propias.
- **RN-2:** Los logs nunca incluyen contraseñas, tokens ni cuerpos de petición. No se usa `console.log` suelto.
- **RN-3:** Las rutas, el menú, los paneles de la ficha del nodo y los suscriptores de alertas solo se extienden mediante los registros (`menu.ts`, `paneles.ts`, `on-alerta.ts`). `proxy.ts`, `src/lib/` y el layout del tablero son núcleo.
- **RN-4:** Ningún secreto en el repositorio: `.env.example` lleva solo nombres de variables (`DATABASE_URL`, `SESSION_SECRET`, `METRICS_TOKEN`, credenciales de Postgres y Flyway), sin valores reales.

## Fuera de alcance

- OpenSpec, `CLAUDE.md`, `.claude/settings.json`, agentes y skills (HU 1a).
- Dockerfile, `docker compose`, Flyway, la migración de línea base, la semilla y CI/CD (HU 2).
- Las tablas de dominio, el login y la página de login (HU 3). Aquí solo va el núcleo de sesión (`session.ts`, `dal.ts`).

## Notas técnicas (no vinculantes)

- Change de OpenSpec: `herramientas-desarrollo` (antes `proyecto-entorno-sdd`).
- Generar con `npx create-next-app@16` en una carpeta temporal (porque choca con el `README.md`) y copiar al repo. Fijar la versión exacta de Next. En `next.config.ts`: `output: "standalone"`, `cacheComponents: false`, `poweredByHeader: false`, y cabeceras CSP, HSTS, `X-Frame-Options` y `X-Content-Type-Options`.
- Estructura: `src/app`, `src/modulos`, `src/lib/{db,session,dal,http,logger,metrics,rate-limit}.ts` con pruebas unitarias, `src/nav/registro.ts`, `contracts/openapi.yaml` (esqueleto con `/api/health`), `db/migration/`, `db/seed/`, `e2e/health.spec.ts` (smoke `@smoke`), `evidencias/.gitkeep` y `AGENTS_LOG.md` (índice vacío).
- `proxy.ts`: su `matcher` excluye `/api/**`, `/login`, `/_next/**` y los estáticos.
- Descubrimiento de módulos con `import.meta.glob` bajo Turbopack y Vitest, con un tope de 30 minutos. Si falla, `registro.ts` manual, anotado en `design.md`.
- Scripts de `package.json`: `lint` (`eslint .`), `typecheck`, `test:unit`, `test:integration`, `build`, `seed` y `e2e`. Vitest con proyectos `unit` e `integration` y `server-only` aliasado a un módulo vacío. Playwright con `BASE_URL`.
- `.gitignore`: `.env*` (salvo `.env.example`), `.flujo/`, `.claude/worktrees/`, `test-results/` y `playwright-report/`. Las mismas carpetas quedan excluidas en `tsconfig.json`, `eslint.config.mjs` y `vitest.config.mts`.
- No hay migraciones ni semilla.

## Dependencias

- Ninguna para el código. El change de OpenSpec de esta historia se crea en cuanto la HU 1a haya hecho `openspec init`, que es su primera tarea (HU 1a, #1).

## Preguntas abiertas

- ¿Qué devuelve `GET /api/health`? Opciones: a) solo `{ "status": "ok" }` / b) además la versión de la app, y el estado de la BD cuando exista (HU 2).

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
