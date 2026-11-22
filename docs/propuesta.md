# Propuesta de arquitectura y SDD – Tablero de sensores eléctricos


## 1. Resumen

Construiremos un **tablero de sensores eléctricos** como monolito modular, empaquetado en una única imagen de Docker, con la mayor parte del esfuerzo puesto en lo que da nota: un flujo SDD trazable y una demo individual que cada estudiante pueda ejecutar en 5 a 10 minutos.

La aplicación permite administrar nodos y sensores de una red eléctrica, simular lecturas de voltaje, corriente y potencia, visualizarlas en un dashboard, generar alertas por umbral y, en las historias de clase, aislar nodos, notificar a técnicos y consultar el histórico.

**Principios de diseño**

- Menos piezas que se puedan romper: un solo contenedor, una sola base de datos, un solo lenguaje (TypeScript).
- Todo corre local con `docker compose` (BD, migraciones con Flyway, semilla y app; ver sección 4), porque cada estudiante construye su historia en su propio portátil.
- Las historias de clase son independientes entre sí: cada una añade su carpeta, su tabla y su migración, y se enchufa en puntos de extensión ya construidos.
- Los agentes de IA hacen trabajo real y verificable: evidencias por historia, un registro de actividad y al menos un rechazo documentado de una puerta de calidad o un revisor.
- La infraestructura se reduce a una imagen de Docker (una sola app Next.js con interfaz y API) y Postgres. El alcance llega hasta construir la imagen, publicarla en GitHub Container Registry y ejecutarla en Render (plan gratuito); la base de datos en Render se agrega con la HU 3.

Taller: Aplicación de Solución IA bajo Spec-Driven Development. Entrega: 24 de noviembre de 2026, 18:00. Modalidad objetivo: B (SDD multiagente, nota máxima 5.0).

## 2. Requisitos del taller y rúbrica

La demostración individual pesa más que cualquier otro criterio (40 %), así que el diseño prioriza que cada integrante domine el proceso por sí mismo.

| Criterio | Peso | Qué se evalúa |
| --- | --- | --- |
| Producto funcional | 30 % | Aplicación integrada, historias implementadas, despliegue, pruebas y seguridad |
| Aplicación de SDD | 30 % | Calidad y trazabilidad de especificaciones, planificación, implementación y validación |
| Demostración individual | 40 % | Cada estudiante construye una historia nueva en vivo, desde su computador, con SDD |

**Requisitos técnicos:** frontend integrado, backend con APIs y lógica de negocio, persistencia en base de datos, SDD con GitHub Spec Kit (preferida) u OpenSpec, despliegue en un entorno accesible y preferiblemente gratuito, pruebas automatizadas y prácticas básicas de seguridad, y un backlog de unas 10 historias (5 implementadas y 5 para desarrollar en clase).

**Modalidades:** la A (SDD con IA) tiene nota máxima de 4.5. La B (SDD con equipo de agentes) llega a 5.0, pero solo si se demuestra colaboración efectiva entre agentes; declararla no basta.

**Demostración presencial:** en la fase 1 el equipo presenta la app desplegada, las historias, las especificaciones, las pruebas, los controles de seguridad y la arquitectura de agentes. En la fase 2 cada estudiante recibe una historia del profesor y la especifica, implementa, prueba e integra en 5 a 10 minutos.

**Entregables:** repositorio, especificaciones y backlog, instrucciones de instalación y ejecución, enlace a la aplicación desplegada, evidencias de pruebas y seguridad, y descripción de la arquitectura multiagente.

## 3. Arquitectura

La aplicación es un monolito modular: una sola app Next.js 16 (App Router) que contiene la interfaz y la API, empaquetada en una imagen de Docker que depende únicamente de Postgres. El pipeline de GitHub Actions construye, prueba y publica la imagen, sin desplegarla.

```
                  ┌──────────── App Next.js en un contenedor (docker compose en local) ──────────┐
                  │  ┌──────────────────────────────────────────────┐                            │
┌───────────┐     │  │ proxy.ts: solo redirige páginas sin sesión   │                            │
│ Navegador │     │  ├──────────────────────────────────────────────┤                            │      ┌──────────────────┐
│  admin    │HTTP │  │ Páginas (Server Components) + componentes    │                            │      │ Postgres         │
│  técnico  ├────►│  │ 'use client' (formularios, Recharts)         │                            │      │ (contenedor en   │
└───────────┘     │  ├──────────────────────────────────────────────┤            SQL (pg)        │      │  docker compose) │
                  │  │ API: Route Handlers app/api/** + Zod         │────────────────────────────┼─────►│ migraciones      │
                  │  ├──────────────────────────────────────────────┤                            │      │ con Flyway       │
                  │  │ src/modulos/<modulo>: schema · service · repo│                            │      └──────────────────┘
                  │  └──────────────────────────────────────────────┘                            │
                  │  Módulos: auth y roles · nodos y sensores · lecturas · simulador ·           │
                  │           alertas                                                            │
                  │  [ Historias 6 a 10 se enchufan con su propia carpeta ]                      │
                  └──────────────────────────────────────▲───────────────────────────────────────┘
                                                         │ docker pull
                               ┌─────────────────────────┴──────────────────────────┐
                               │ GitHub Container Registry (ghcr.io)                │
                               └─────────────────────────▲──────────────────────────┘
                                                         │ docker push (solo en main)
                               ┌─────────────────────────┴──────────────────────────┐
                               │ GitHub Actions: lint, pruebas, migraciones,        │
                               │ seguridad, build de la imagen                      │
                               └────────────────────────────────────────────────────┘
```

Cómo se integran interfaz y API dentro de la misma app:

- **Páginas** (`src/app/**/page.tsx`, Server Components por defecto): leen datos llamando directamente a la capa de servicio (`await nodosService.listar()`), sin pasar por la propia API. Las páginas que leen la BD son dinámicas (leen la sesión, o llevan `export const dynamic = "force-dynamic"`) para que `next build` no intente consultar una BD que no existe durante el build.
- **Componentes interactivos** (`"use client"`: formularios, botón de simular, gráficas Recharts): llaman a la API con `fetch("/api/...")` relativo, en el mismo origen, así que no hay CORS, la cookie de sesión viaja sola y no hace falta una URL de API horneada en el build. Tras una mutación, `router.refresh()` recarga los datos del servidor.
- **API** (Route Handlers en `src/app/api/<modulo>/route.ts`): es la única superficie HTTP y la que documenta `contracts/openapi.yaml`. Cada handler es delgado: valida con Zod, obtiene la sesión con `sessionFromRequest(req)` y aplica `requireRole()`, invoca al servicio y traduce errores a códigos HTTP (401 sin sesión, 403 con rol incorrecto, en JSON). No se usan Server Actions, para no tener una segunda API sin documentar.
- **Autenticación**: `proxy.ts` (el antiguo `middleware.ts`, renombrado en Next.js 16; corre en Node) solo redirige a `/login` las **páginas** sin cookie. Su `config.matcher` excluye `/api/:path*`, `/login`, `/_next/*` y los archivos estáticos, para no romper el healthcheck, el login ni las llamadas `fetch` a la API. La verificación real está en `src/lib/dal.ts`: `verifySession(token)` (pura, verifica el JWT con `jose`), `sessionFromRequest(req)` para los Route Handlers (se puede probar con Vitest), `sessionFromCookies()` (usa `cookies()`) para páginas y layouts, y `requireRole()` encima de ambas.
- **Rutas públicas**: `GET /api/health` no exige sesión y devuelve solo `{ status }`; `GET /api/metrics` exige `Authorization: Bearer $METRICS_TOKEN` (comparación en tiempo constante; 404 si la variable no está definida); `POST /api/auth/login` es pública y tiene rate limit.

Las historias de clase (6 a 10) se enchufan agregando su propia carpeta, sin tocar el núcleo. GitHub Actions ejecuta pruebas, valida las migraciones y los escaneos de seguridad, construye la imagen en cada PR y, al fusionar en `main`, la publica en GitHub Container Registry. Cualquiera puede ejecutarla con `docker compose` apuntando a esa imagen.

| Componente | Responsabilidad |
| --- | --- |
| Interfaz (páginas App Router + componentes `"use client"`) | Login, tablero de nodos, gráficas de lecturas, alertas y paneles de las historias de clase |
| API (Route Handlers + Zod) | Autenticación con JWT y roles (`proxy.ts` solo redirige páginas; `sessionFromRequest` y `requireRole` en cada handler), validación, lógica de negocio y contrato OpenAPI |
| Módulo `simulador` | Genera lecturas de voltaje, corriente y potencia con `POST /api/simulador`, un botón en la interfaz y un temporizador opcional |
| Módulo `alertas` | Compara cada lectura con los umbrales del sensor, registra la alerta y avisa a los suscriptores registrados (`on-alerta.ts`) |
| Módulo `notificaciones` (historia 7, de clase) | Guarda la notificación en una tabla y la muestra en un centro de notificaciones de la interfaz; no forma parte de la línea base |
| Postgres | Usuarios, nodos, sensores, lecturas y alertas; migraciones versionadas con Flyway (`V<AAAAMMDDHHmm>__<descripcion>.sql`) |
| GitHub Actions | Lint, pruebas, `flyway migrate info` sobre un Postgres de servicio (con `validateOnMigrate` activo, que ya verifica checksums), verificación de que las migraciones nuevas tienen versión mayor que la última de `origin/<base>`, gitleaks, `npm audit`, CodeQL (no bloqueante), build de la imagen en cada PR y publicación en `ghcr.io` al fusionar en `main` |
| Observabilidad (en la app) | Logs JSON por petición, `GET /api/health` (público, con chequeo de la BD, usado como healthcheck del contenedor) y `GET /api/metrics` en formato Prometheus (con token) con métricas técnicas y, opcionalmente, de negocio |
| GitHub Container Registry | Guarda la imagen publicada (`ghcr.io/cristhianarce/procesos-modernos-software`), con etiquetas `latest` y `sha-<commit>` |

## 4. Stack tecnológico y decisiones

El stack es TypeScript de extremo a extremo en una sola app Next.js (sin monorepo ni workspaces), con un solo contenedor para interfaz y API, lo que reduce los puntos de fallo en la demo en vivo.

| Capa | Elección | Por qué |
| --- | --- | --- |
| SDD | OpenSpec + Claude Code | Admitida por el taller; ligera, sin numeración de features y con un change por historia en `openspec/changes/` |
| Lenguaje | TypeScript | Un solo lenguaje; los esquemas Zod y los tipos se comparten entre interfaz y API sin paquete aparte |
| Framework | Next.js 16 (App Router, `output: "standalone"`, `cacheComponents: false`), versión fijada y con parches de seguridad al día | Interfaz y API en una sola app: un build, una imagen, un puerto, sin CORS. El enrutamiento por carpetas deja que cada historia agregue su carpeta sin tocar un archivo central. `cacheComponents: false` evita aprender el modelo nuevo de caché dentro del plazo del taller |
| Interfaz | React (Server Components + componentes `"use client"`) + Tailwind + Recharts | Rápido de generar; las gráficas de sensores salen casi gratis (Recharts va en componentes `"use client"`) |
| API | Route Handlers + Zod | API HTTP real, documentable en OpenAPI y probable con Vitest; Zod valida toda entrada, que cuenta como control de seguridad |
| Acceso a datos | `pg` (node-postgres) con SQL escrito a mano y pool único en `globalThis` | Flyway es dueño del esquema; un ORM con migraciones propias (Prisma) chocaría con él |
| Base de datos | Postgres (contenedor en `docker compose`) | SQL normal para el histórico y los filtros |
| Migraciones | Flyway en Docker (`flyway/flyway`), versiones con timestamp | Cada migración corre una vez por ambiente y queda en la tabla de historial; con timestamp, dos historias en paralelo no chocan de versión. Se usa la imagen de Docker, así que no añade un lenguaje al proyecto |
| Autenticación | JWT propio con roles `admin` y `tecnico` (librería `jose`, en cookie `httpOnly`, verificado en `verifySession`) | Cumple "login con roles" y funciona igual en local y en la imagen publicada |
| Contenedor | Un solo contenedor (la app Next.js `standalone`) | Arranque local en cuatro pasos: `docker compose up -d --wait db`, `docker compose run --rm flyway migrate info`, `npm run seed` y `docker compose up -d --build --wait app` |
| Registro de imágenes | GitHub Container Registry (`ghcr.io`) | Gratuito para repositorios públicos y sin cuentas extra: Actions publica con el `GITHUB_TOKEN` (permiso `packages: write`) |
| Despliegue | Render (plan gratuito), servicio web basado en la imagen publicada, definido en `render.yaml` | Ejecuta la imagen de `ghcr.io` sin cambiar el build. Los servicios basados en imagen no se redespliegan solos: el CD llama al *deploy hook* del servicio al publicar. La base de datos de Render se agrega con la HU 3 |
| CI/CD | GitHub Actions | Lint (`eslint .`; Next.js 16 quitó `next lint`), typecheck, pruebas, migraciones, seguridad, build y publicación de la imagen |
| Pruebas | Vitest: `test:unit` (servicios y esquemas, sin BD) y `test:integration` (Route Handlers invocando sus funciones `GET`/`POST` con objetos `Request`, contra el Postgres del compose ya migrado), incluidas pruebas de los controles de seguridad (401 sin sesión, 403 con rol incorrecto, 400 por Zod, 429 por rate limit en login, cabeceras de seguridad presentes); `vitest.config.mts` asigna `server-only` a un módulo vacío para poder importar `repo.ts`. Además, 2 smoke de Playwright (`e2e/*.spec.ts`, etiqueta `@smoke`) contra la app levantada con `docker compose` (`BASE_URL`) | Cobertura suficiente sin consumir días. Vitest no puede renderizar Server Components asíncronos: esas páginas se cubren con Playwright. Los handlers usan `sessionFromRequest(req)`, no `cookies()`, para que se puedan probar fuera de Next |
| Observabilidad | `pino` (logs JSON), `prom-client` (métricas Prometheus), healthcheck de Docker sobre `/api/health` | Sencilla y sin servicios externos: los logs se leen con `docker compose logs app` y las métricas con `curl -H "Authorization: Bearer $METRICS_TOKEN" .../api/metrics`. Un dashboard con Prometheus y Grafana queda pospuesto (ver "Observabilidad") |
| Seguridad | gitleaks, `npm audit`, CodeQL (no bloqueante), Dependabot, cabeceras de seguridad en `next.config` (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`), rate limit en login y pruebas de integración de los controles | Evidencia automática en el pipeline y pruebas que demuestran que los controles funcionan, no solo que existen |

**Estructura de la app**

```
.claude/                         # skills, agentes y workflow del orquestador (+ skills de OpenSpec)
openspec/                        # specs consolidadas y changes por historia
evidencias/issue-<n>/            # evidencias de cada historia (paso 8); AGENTS_LOG.md es su índice
proxy.ts                         # redirige a /login solo páginas sin sesión; matcher excluye /api, /login, /_next y estáticos
next.config.ts                   # output:"standalone", cacheComponents:false, poweredByHeader:false, headers(), serverExternalPackages:["prom-client"]
contracts/openapi.yaml           # contrato de la API (Route Handlers)
db/migration/V<AAAAMMDDHHmm>__<descripcion>.sql   # Flyway (contenedor aparte)
db/seed/<modulo>.sql             # semilla idempotente por módulo, aplicada por npm run seed
src/
  app/
    layout.tsx
    login/page.tsx
    (tablero)/layout.tsx         # sessionFromCookies + menú filtrado por rol
    (tablero)/page.tsx           # dashboard
    (tablero)/<modulo>/page.tsx  # una carpeta por historia
    api/auth/login/route.ts
    api/<modulo>/route.ts        # y api/<modulo>/[id]/route.ts
    api/health/route.ts          # público; { status }: 200 si responde la BD (SELECT 1), 503 si no; healthcheck del contenedor
    api/metrics/route.ts         # métricas Prometheus (Authorization: Bearer $METRICS_TOKEN)
  modulos/<modulo>/
    schema.ts                    # Zod de entrada y salida, espejo de openapi.yaml
    service.ts                   # reglas de negocio
    repo.ts                      # SQL con pg (import "server-only")
    ui/*.tsx                     # componentes "use client" (formularios, Recharts)
    menu.ts                      # ítem de menú { etiqueta, href, roles, orden }
    paneles.ts                   # opcional: paneles para la ficha del nodo { titulo, componente, roles, orden }
    on-alerta.ts                 # opcional: suscriptor que el servicio de alertas llama al registrar una alerta
    metrics.ts                   # opcional: contadores de negocio del módulo, sobre el registro de src/lib/metrics.ts
    __tests__/*.test.ts
  lib/ db.ts · session.ts (jose) · dal.ts (verifySession, sessionFromRequest, sessionFromCookies, requireRole) · http.ts (envoltorio de handlers: Zod → 400, errores → código, log y métricas por petición) · logger.ts (pino) · metrics.ts (registro único de prom-client) · rate-limit.ts
  nav/registro.ts                # descubre los menu.ts, paneles.ts y on-alerta.ts de los módulos
e2e/*.spec.ts · playwright.config.ts · vitest.config.mts (alias de server-only) · Dockerfile · docker-compose.yml (servicios db, flyway y app)
```

**Decisiones descartadas (y por qué)**

- **Frontend Vite separado + Next.js solo como API:** dos builds, un paso para copiar los estáticos, workspaces, URL de la API horneada en el build y autenticación repartida en dos lados. Una sola app Next.js lo evita.
- **Server Actions como API:** serían una segunda superficie HTTP sin documentar en OpenAPI y difícil de probar; se usan solo Route Handlers.

- **Microservicios reales:** añaden despliegue, red y depuración sin aportar nota. Se usa monolito modular.
- **Cognito:** aporta seguridad real pero es una fuente de fallos en el plazo del taller. Un JWT propio basta para la historia de login.
- **Lambda + EventBridge para el simulador:** menos controlable en vivo que un `POST /api/simulador` y un botón.
- **AWS en general (CDK, SNS, OIDC):** el taller no lo exige y cada servicio suma cuentas, permisos y puntos de fallo. Se descarta; puede añadirse después si sobra tiempo.
- **Fly.io:** según fuentes de 2026, las cuentas nuevas no tienen plan gratuito, solo una prueba de 2 horas de ejecución o 7 días.
- **Railway:** da 5 USD de prueba única y luego 1 USD mensual de crédito, que una app con base de datos agota rápido; el plan de pago parte de 5 USD al mes.
- **Supabase como base externa:** pausa los proyectos gratuitos tras una semana sin actividad, y una base externa añade otra cuenta y otra conexión que configurar.
- **Kiro:** su plan gratuito ofrece pocos créditos mensuales y cada estudiante necesitaría cuota propia.
- **Spec Kit:** es la preferida del enunciado, pero su numeración secuencial de features choca cuando cinco estudiantes trabajan a la vez y su ciclo (constitution, specify, clarify, plan, tasks, analyze, implement) no cabe en 10 minutos. Se elige OpenSpec y no se mezclan herramientas.

**Imagen de Docker y publicación (alcance actual)**

- Un `Dockerfile` multi-etapa basado en el ejemplo oficial `with-docker` de Next.js: instala dependencias, ejecuta `next build` con `output: "standalone"` y deja una imagen final `node:24-slim`, con usuario sin privilegios, que copia `.next/standalone`, `.next/static` y `public/` (standalone no los copia solo) y ejecuta `node server.js` con `PORT` y `HOSTNAME=0.0.0.0`.
- Las variables `NEXT_PUBLIC_*` se fijan en el build; la app no las usa (la interfaz llama a `/api` relativo). `DATABASE_URL`, `SESSION_SECRET` y `METRICS_TOKEN` se pasan al ejecutar el contenedor, nunca en un `.env` dentro de la imagen (`.dockerignore` excluye `.env*`).
- `docker-compose.yml` define tres servicios:
  - `db` (Postgres): `ports: ["5432"]` (puerto del host efímero) y `healthcheck` con `pg_isready`;
  - `flyway`: con `profiles: ["tools"]`, así que un `up` no lo arranca; se usa solo con `docker compose run --rm flyway migrate info`, la única forma de migrar en local;
  - `app`: `ports: ["3000"]` (puerto del host efímero) y `healthcheck` con `node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"`, porque la imagen `node:24-slim` no trae `curl` ni `wget`.
- Los puertos se publican sin fijar el del host, para que varias historias corran a la vez; `docker compose port db 5432` y `docker compose port app 3000` devuelven el asignado.
- Arranque: `docker compose up -d --wait db` → `docker compose run --rm flyway migrate info` → `npm run seed` (con `DATABASE_URL` apuntando al puerto que devuelve `docker compose port db 5432`) → `docker compose up -d --build --wait app`. Un `docker compose up` a secas no migra ni carga la semilla.
- `npm run seed` aplica de forma idempotente los archivos `db/seed/<modulo>.sql`. La HU 2 crea el mecanismo (todavía sin tablas); cada historia de la 3 a la 5 agrega la semilla de su módulo, así no hay un archivo de semilla compartido.
- En cada PR, GitHub Actions construye la imagen sin publicarla, para detectar fallos de build antes del merge.
- Al fusionar en `main`, un job con `permissions: packages: write` inicia sesión en `ghcr.io` con el `GITHUB_TOKEN` y publica `ghcr.io/cristhianarce/procesos-modernos-software:latest` y `:sha-<commit>`. El paquete hereda la visibilidad pública del repositorio por la etiqueta `org.opencontainers.image.source`, así que cualquiera puede hacer `docker pull` sin credenciales; el nombre de la imagen se pasa a minúsculas porque `ghcr.io` lo exige. Los merges que solo tocan `openspec/`, `evidencias/`, `AGENTS_LOG.md` o `docs/` no vuelven a publicar (`paths-ignore`).
- **Notificaciones sin servicios externos:** la historia 7 guarda la notificación en una tabla y la muestra en la interfaz; un correo real queda fuera del alcance.
- **Demo individual:** cada estudiante trabaja en local con `docker compose`.

**Observabilidad (sencilla, dentro de la app)**

- **Logs estructurados:** `src/lib/logger.ts` crea un logger `pino` que escribe JSON a stdout. El envoltorio de handlers de `src/lib/http.ts` registra una línea por petición: `requestId` (también devuelto en la cabecera `X-Request-Id`), método, ruta, código, duración en ms y rol del usuario. Nunca registra contraseñas, tokens, cuerpos de petición ni datos personales. Se leen con `docker compose logs app`.
- **Salud:** `GET /api/health` es público (`proxy.ts` no lo intercepta), hace `SELECT 1` en Postgres y devuelve solo `{ status }` con 200 o 503. El servicio `app` del compose lo usa como `healthcheck`, así que `docker compose up -d --wait app` solo termina cuando la app puede hablar con la BD.
- **Métricas:** `src/lib/metrics.ts` exporta un registro único de `prom-client` guardado en `globalThis`, como el pool de la BD, y crea cada métrica con `register.getSingleMetric(nombre) ?? new ...` para que la recarga en desarrollo no la duplique. `next.config.ts` declara `serverExternalPackages: ["prom-client"]` para que todas las rutas usen la misma instancia. `GET /api/metrics` las expone en formato Prometheus y exige `Authorization: Bearer $METRICS_TOKEN` (comparación en tiempo constante; 404 si la variable no está definida). Se consultan con `curl -H "Authorization: Bearer $METRICS_TOKEN" http://localhost:<puerto>/api/metrics`. Métricas:
  - técnicas: `http_requests_total{route,method,status}`, `http_request_duration_seconds{route}` (histograma), métricas por defecto del proceso Node. La etiqueta `route` es la plantilla de la ruta (`/api/nodos/[id]`), no la ruta con ids, para no disparar la cardinalidad;
  - de negocio, opcionales: `auth_login_fallidos_total`, `simulador_lecturas_total`, `alertas_umbral_total{severidad}`. Una historia agrega su contador solo si tiene una acción de negocio relevante, en `src/modulos/<modulo>/metrics.ts` sobre el registro de `src/lib/metrics.ts` (por ejemplo `nodos_aislados_total` en la historia 6), sin editar `src/lib/`. En modo `demo` nunca es obligatorio.
- **Alarmas:** por ahora no hay alarmas operativas automáticas; las alertas por umbral de la historia 5 son de negocio. **Pospuesto:** un perfil `observabilidad` del compose con Prometheus y Grafana (dashboard y reglas como "app caída", "5xx > 5 %" o "pico de alertas por umbral"), que se apoya en `/api/metrics` sin cambiar la app.

**Despliegue (Render):** la rúbrica pide un despliegue accesible. `render.yaml` define un servicio web gratuito que ejecuta `ghcr.io/cristhianarce/procesos-modernos-software:latest`, con `PORT=3000`, `/api/health` como health check y `SESSION_SECRET` y `METRICS_TOKEN` generados por Render. Un servicio basado en imagen no se redespliega al publicar una imagen nueva, así que el último paso de `cd.yml` llama al *deploy hook* (secreto `RENDER_DEPLOY_HOOK_URL`) y se omite si el secreto no existe. Hoy no hay base de datos: se agrega con la primera migración (HU 3), y la base gratuita vence a los 30 días (límites en la sección 12).

## 5. Backlog de historias de usuario

Las dos primeras historias crean el proyecto y la infraestructura sobre la que corre el SDD; las cinco historias de clase dependen solo de la línea base y no entre sí.

| # | Historia | Fase | Depende de | Entrega |
| --- | --- | --- | --- | --- |
| 1 | **Proyecto y entorno SDD**, en dos issues con su change de OpenSpec cada uno ([backlog](backlog/README.md)). **1a `configuracion-ia-sdd` (#1), configuración de IA para el SDD:** `openspec init --tools claude --language es --scope project`, reglas del proyecto en `openspec/config.yaml` y `CLAUDE.md`, permisos en `.claude/settings.json`, y skills y agentes del orquestador en `.claude/` (ver [flujo del orquestador](flujo-orquestador.md)). **1b `herramientas-desarrollo` (#2), herramientas de desarrollo:** app Next.js 16 con la estructura de la sección 4 (`src/app`, `src/modulos`, `src/lib`, `contracts/`, `db/migration/`, `db/seed/`, `e2e/`), herramientas de calidad (lint, typecheck, Vitest, Playwright), puntos de extensión (rutas, menú, paneles de la ficha del nodo, suscriptores de alertas, migraciones) y la base de observabilidad (`logger.ts`, `metrics.ts`, envoltorio de handlers, `/api/health`, `/api/metrics`). La 1a arranca primero con OpenSpec, reglas y permisos, porque el change de la 1b lo necesita | Línea base | – | Repositorio listo para que cualquier historia siga el flujo SDD |
| 2 | **Infraestructura y CI/CD:** `Dockerfile`, `docker compose` con `db`, `flyway` y `app` (healthchecks), mecanismo de semilla `npm run seed`, pipeline de GitHub Actions con lint, typecheck, pruebas, migraciones, gitleaks, `npm audit`, CodeQL, build de la imagen y CD que publica en `ghcr.io` (paquete marcado público); etiquetas del repo (`historia`, `bloqueado`, `migracion`, `revision-especializada`, `escalado`) | Línea base | 1 | Imagen del esqueleto publicada en `ghcr.io` y pipeline en verde |
| 3 | Login con roles (admin y técnico) | Línea base | 2 | `auth` |
| 4 | CRUD de nodos y sensores, con simulador de lecturas (voltaje, corriente, potencia) | Línea base | 3 | `nodos`, `sensores`, `lecturas`, `POST /api/simulador` |
| 5 | Dashboard con última lectura, gráfica por sensor y alertas por umbral | Línea base | 4 | Panel del frontend, `alertas` |
| 6 | Aislar nodo: botón de corte en la ficha del nodo (campo `estado` conectado o desconectado) | Clase | Línea base | `nodos` (columna `estado` ya creada en la base) |
| 7 | Notificar a técnicos cuando salta una alerta de umbral (centro de notificaciones en la interfaz) | Clase | Línea base (historia 5) | Módulo `notificaciones`, suscrito a las alertas con `on-alerta.ts` |
| 8 | Usuarios o dispositivos afectados por un nodo | Clase | Línea base | Tabla propia `nodo_usuarios` |
| 9 | Histórico con filtros y exportación a CSV | Clase | Línea base | Lee solo `lecturas` |
| 10 | Registro de mantenimiento y asignación de técnico a un nodo | Clase | Línea base | Tabla propia, lee `nodos` y `usuarios` |

**Cambios frente al borrador anterior:** las historias 1 y 2 pasan a ser habilitadoras (proyecto SDD e infraestructura), porque todo lo demás se construye con ellas y su especificación es la primera evidencia de trazabilidad. Las construye el equipo con Claude Code en modo interactivo (cada una con su change de OpenSpec; la 1 en dos issues, `herramientas-desarrollo` para el herramientas de desarrollo y `configuracion-ia-sdd` para OpenSpec, reglas, permisos, agentes y skills, para que la base quede lista el primer día sin esperar al orquestador), porque tocan Docker y `.github/`, que el orquestador tiene prohibido; el orquestador trabaja desde la historia 3. Para mantener cinco historias base, el simulador se une al CRUD (historia 4) y las alertas al dashboard (historia 5). Las historias de clase no cambian: la 7 se dispara con cualquier alerta de umbral y la 8 usa una tabla propia, así que ninguna depende de otra.

**Puntos de extensión que debe traer la línea base** (sin ellos, cada estudiante edita los mismos archivos centrales, como `Menu.tsx`, y aparecen los conflictos):

- Rutas por carpeta (enrutamiento de Next.js): cada historia agrega `src/app/(tablero)/<modulo>/page.tsx` (interfaz), `src/app/api/<modulo>/route.ts` (API) y `src/modulos/<modulo>/` (`schema.ts`, `service.ts`, `repo.ts`, `ui/`, `__tests__/`); no hay archivo central de rutas. `proxy.ts`, `src/lib/` y el layout del tablero son núcleo y ninguna historia los edita: los permisos por ruta se declaran en el propio handler con `requireRole`.
- Registro de menú: cada módulo declara su ítem en `src/modulos/<modulo>/menu.ts` (`{ etiqueta, href, roles, orden }`) y `src/nav/registro.ts` los descubre con `import.meta.glob` (soportado por Turbopack desde 16.3 y por Vitest). Si da problemas, el respaldo es un `registro.ts` con una línea de import por módulo. Ocultar el ítem es cosmético: el rol se verifica siempre en el servidor.
- Registro de paneles de la ficha del nodo: la página del nodo (historia 4) muestra los paneles que declaran los módulos en `src/modulos/<modulo>/paneles.ts`, descubiertos por `src/nav/registro.ts` con el mismo mecanismo (y el mismo respaldo manual). Así las historias 6 (aislar), 8 (afectados) y 10 (mantenimiento) agregan su panel sin editar la página de la historia 4.
- Suscriptores de alertas: al registrar una alerta, el servicio de `alertas` (historia 5) llama a los `src/modulos/<modulo>/on-alerta.ts` registrados en `src/nav/registro.ts`. La historia 7 se suscribe así sin editar el módulo de alertas; si el registro falla, su respaldo es consultar periódicamente la tabla `alertas`.
- Único archivo compartido que sí editan varias historias: `contracts/openapi.yaml` (cada una agrega sus rutas); sus conflictos se resuelven al sincronizar en el paso 5, conservando las rutas de ambos lados. La evidencia multiagente va por historia en `evidencias/issue-<n>/`, y `AGENTS_LOG.md` es un índice que se regenera en el PR de archivo, que es serializado, así que no genera conflictos.
- Carpeta de migraciones de Flyway con versión timestamp, por ejemplo `db/migration/V202611231030__aislar_nodo.sql`.
- Un change de OpenSpec por historia, con nombre descriptivo y no numérico: `openspec/changes/aislar-nodo/`. Así no hay choques de numeración entre estudiantes.
- Datos semilla por módulo (`db/seed/<modulo>.sql`): las historias 3 a 5 dejan usuarios, nodos, sensores y lecturas para probar cualquier historia de clase desde el primer minuto.

## 6. Arquitectura multiagente (Modalidad B)

La colaboración es real solo si hay trabajo de al menos dos agentes distintos, un rechazo genuino del agente de calidad y la corrección posterior, todo con evidencia en el repositorio.

La arquitectura de agentes es la del [flujo del orquestador](flujo-orquestador.md), y cada pieza está detallada en su ficha (sección 3 del mismo documento). Los skills y agentes son de Claude Code, viven en `.claude/skills/` y `.claude/agents/` y se versionan en el repo. El orquestador es un skill que corre en la sesión principal: cada historia (un issue de GitHub) avanza por sus pasos en su propia rama, con un change de OpenSpec y un PR con el código; tras el merge, un segundo PR pequeño (`chore/archivar-<change>`) archiva el change. Para la entrega tiene **un solo modo**, de 8 pasos y 5 minutos o menos, que trabaja en el checkout principal; el diseño completo (worktrees para trabajar varias historias en paralelo, decisor, ciclo del PR) queda documentado y pospuesto. La tabla marca qué corre en la entrega.

| Agente o skill | Paso | Responsabilidad | Rechaza cuando | Entrega |
| --- | --- | --- | --- | --- |
| `orquestador` (skill, sesión principal) | 0–10 | Encadena los pasos, aplica topes y reglas de Bloqueado y Escalado; corre los skills de OpenSpec (`/openspec-explore`, `/openspec-propose`, `/openspec-apply-change`) | Falta la línea base, se agota el presupuesto o se requiere algo prohibido | Sí (flujo único; sin `/openspec-explore`) |
| `preparador` | 1 | Rama en el checkout principal (worktree: pospuesto), volcado del issue con criterios numerados `CA-n` | El issue está cerrado o ya tiene PR, la rama tiene cambios o falta la línea base de OpenSpec | Sí |
| `preguntas-tecnicas` | 2–4 | Responde dudas técnicas con evidencia del código y separa las de negocio | — (clasifica, no rechaza) | Pospuesto |
| `decisor` (3 agentes + consolidador) | 2–5, 7 | Decide las dudas de negocio por votación; por defecto, 3 llamadas `Agent` en paralelo y un consolidador (el workflow guardado es opcional) | La pregunta exige algo prohibido | Pospuesto (las dudas de negocio se le preguntan a la persona) |
| `revisor-salida` | G1–G4 | Puertas de calidad tras cada comando de OpenSpec | Criterios sin mapear, `openspec validate` inválido, tareas sin hacer o código que no sigue la spec (`CORREGIR` o `BLOQUEAR`) | Solo G2, con `openspec validate --strict` y la salida del script `trazabilidad-grep.mjs` |
| `generar-planes-prueba` | 3 | Planes E2E y smoke derivados de `specs/` | — | Pospuesto |
| `revisor-reglas` y revisor cruzado (`Plan`) | 5 | Revisan el diff contra las reglas del proyecto, seguridad y corrección | Hallazgos `CRITICAL` o `WARNING` | Solo `revisor-reglas`, en paralelo con `build-test` |
| `ejecutor-e2e` | 5, 7 | Smoke con Playwright contra Docker | Un caso falla | Pospuesto |
| `revisor-pr` y `validador-comentarios` | 7, 9 | `revisor-pr` comenta el PR con evento `COMMENT` (nunca aprueba ni pide cambios: es la misma cuenta que lo abrió) y `validador-comentarios` valida los comentarios, también los de la persona en el paso 9 | Comentario confirmado sin resolver | Pospuesto |
| `trazabilidad` | G2, 8 | CA → requisito → tarea → código → prueba | Criterio sin cobertura | Pospuesto (lo reemplaza el script `trazabilidad-grep.mjs`) |

**Flujo por historia (flujo único de la entrega)**

1. `preparador` crea la rama en el checkout principal y vuelca el issue.
2. `contexto.mjs` lista tablas, módulos, semillas y rutas existentes, sin agentes.
3. `/openspec-propose` desde el issue y ese contexto; las dudas de negocio se le preguntan a la persona.
4. G2 (`revisor-salida`, con `openspec validate --strict` y `trazabilidad-grep.mjs`) puede devolver el trabajo una vez.
5. `/openspec-apply-change` (pruebas, contrato `contracts/openapi.yaml` y migración Flyway).
6. `build-test` (typecheck, unitarias e integración) en paralelo con `revisor-reglas`.
7. Si hay `CRITICAL`, una sola pasada de corrección y otro `build-test`.
8. Commit, push, PR en borrador y commit de `evidencias/issue-<n>/`. La persona marca el PR listo, lo revisa otra cuenta y se fusiona; tras el merge, el CD publica la imagen en `ghcr.io` y el change se archiva a mano en un PR propio (G4).

**Evidencia exigible (Modalidad B)**

- `evidencias/issue-<n>/` en el PR de cada historia: `issue.md`, `decisiones.md`, `gates.md`, `verificacion.md` y `agentes.md` (`ciclo-pr.md` y `trazabilidad.md` llegan con el ciclo del PR y la trazabilidad final, pospuestos).
- Registro por invocación: tras cada agente, el orquestador agrega una fila a `<trabajo>/agentes-log.md` (fecha y hora, paso, agente, modelo/effort, id del agente, veredicto, rechazos). En el paso 8 se construye `evidencias/issue-<n>/agentes.md` a partir de ese registro, y se copian también las salidas propias de cada agente (las secciones de `gates.md` que escribe `revisor-salida`, las tablas de hallazgos de los revisores), no un resumen del orquestador.
- Evidencia externa (pospuesta con `revisor-pr`): sus comentarios quedarían visibles en el PR de GitHub.
- `AGENTS_LOG.md`: índice de todas las historias, regenerado desde los `agentes.md` en cada PR de archivo.
- Al menos un rechazo real (un `CORREGIR` de `revisor-salida` o un `CRITICAL` de `revisor-reglas`) con su corrección posterior.
- Commits y PR que citan el issue (`#<n>`) y el change (`Change: <nombre>`).
- Contrato descrito en `design.md` (paso 3), aplicado a `contracts/openapi.yaml` en el paso 4 y respetado por la API y la interfaz.

## 7. Flujo SDD y demostración individual

El flujo completo del orquestador es demasiado largo para la demo de 5 a 10 minutos, así que para la entrega tiene un solo modo, reducido a 8 pasos, que termina en 5 minutos o menos; es el mismo con el que se construyen las HU 3 a 5. Cada historia queda trazada en su propia carpeta `openspec/changes/<nombre>/`.

**Flujo OpenSpec (OpenSpec 2.1, skills de Claude Code)**

1. `openspec init --tools claude --language es --scope project` (una sola vez, en la HU 1a): crea `openspec/` e instala los skills en `.claude/skills/` (y una copia en `.agents/skills/`, que también se versiona).
2. `/openspec-explore` (opcional): aclarar la idea con la IA antes de proponer.
3. `/openspec-propose <nombre>`: genera `proposal.md`, `specs/` (deltas de requisitos), `design.md` y `tasks.md`, y se detiene sin tocar código. Se revisa antes de seguir.
4. `/openspec-apply-change`: implementa las tareas y marca el checklist de `tasks.md`.
5. `openspec archive <nombre> --yes`: fusiona los deltas en `openspec/specs/` y mueve el change a `openspec/changes/archive/`.

**El orquestador (también en la demo individual):** `/orquestador <n>` encadena preparar → contexto (un script lista las tablas, módulos y rutas que ya existen, sin agentes) → `/openspec-propose` (desde el issue y ese contexto, sin explorar) → G2 con la salida del script `trazabilidad-grep.mjs` → `/openspec-apply-change` → `build-test` en paralelo con una revisión de `revisor-reglas` → corregir CRITICAL y repetir `build-test` solo si hubo → commit, PR en borrador y commit de evidencias. Las dudas de negocio se le preguntan al estudiante. Si el orquestador falla, el respaldo es correr a mano los skills de OpenSpec en el mismo orden. El archivo se hace a mano después de fusionar el PR, uno a la vez y en un PR propio, para que los deltas de varios estudiantes no choquen.

Ajustes para que quepa en el tiempo (meta: 5 minutos o menos en el ensayo):

- Trabaja en el checkout principal, en la rama `feature/issue-<n>-<slug>`, sin worktree: reutiliza `node_modules` y no corre `npm ci`.
- `db` ya está levantada y migrada antes de empezar.
- `build-test` reducido: `typecheck`, `test:unit` y `test:integration`; el lint y `next build` los corre el CI.
- `revisor-reglas` (sonnet / medium) corre en paralelo con `build-test`.
- Solo G2, con máximo un `CORREGIR`; G3 está pospuesto.
- Una sola pasada de corrección, y solo si hay `CRITICAL`.
- La sesión y los agentes corren con sonnet, sin decisor.
- Si no hay red, el push y el PR son opcionales y la evidencia queda local.

**Preparación de la demo individual**

- Un prompt-plantilla de una línea por historia, ya escrito y probado, y al menos un ensayo con una historia **no vista**, porque el profesor puede traer otra.
- Arranque local (sección 4) verificado en el portátil de cada integrante, no solo en el de quien lo preparó.
- Cuenta de IA propia por estudiante, con reserva de cuota; la demo corre solo con sonnet.
- Una rama con cada historia ya resuelta como respaldo y un **video pregrabado obligatorio** por estudiante.
- Un hotspot del celular por estudiante: Claude Code, `gh` y el push necesitan internet.
- En Windows: `git config --global core.longpaths true` y `LongPathsEnabled` activado.
- La noche anterior: Docker Desktop iniciado, `docker compose pull` (Postgres y Flyway) y dependencias instaladas.
- Ensayos cronometrados por integrante el lunes 23 en la noche y el martes 24 en la mañana.

**Nota de versión (verificada con OpenSpec 2.1.0 el 21 de noviembre; la 2.1.1 salió el 19 de noviembre, se fija la serie 2.1.x):** desde la 2.0 no hay comandos `/opsx:*`; se instalan skills que se invocan por su nombre (`/openspec-propose`, `/openspec-explore`, `/openspec-apply-change`, `/openspec-update-change`, `/openspec-sync-specs`, `/openspec-archive-change`). El perfil `core` trae esos seis; los adicionales (`new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`) se activan sin interacción con `openspec config set profile custom`, `openspec config set workflows '[...]'` y `openspec update .` (la configuración es global por máquina). `--language es` solo agrega al `context:` la instrucción de escribir en español: los encabezados y las palabras clave de las specs quedan en inglés (ver sección 8).

## 8. Reglas del proyecto (esbozo)

OpenSpec no tiene un comando de constitución: estas reglas se guardan en `CLAUDE.md` y en `openspec/config.yaml` (las generales en `context:`, las de cada artefacto en `rules:`, cada clave una sola vez), para que cada propuesta las respete y no discuta tecnología.

- **Stack fijo:** TypeScript, una sola app Next.js 16 (App Router) para interfaz y API, Route Handlers + Zod, `pg`, Postgres, Flyway, Tailwind, Recharts, `jose`, `pino`, `prom-client`. Sin Server Actions, sin ORM con migraciones propias. No se añaden librerías sin aprobación del equipo.
- **Estructura:** `src/app` (páginas y `api/`), `src/modulos/<modulo>`, `src/lib`, `src/nav`, `contracts/`, `db/migration/`, `db/seed/`, `e2e/` y `openspec/`.
- **Capas:** las páginas leen datos llamando al servicio, nunca a `fetch` de la propia API; los componentes `"use client"` llaman a `/api/...`; los handlers solo validan, autorizan, llaman al servicio y traducen errores; el SQL vive solo en `repo.ts` (con `import "server-only"`).
- **Caché:** nada con datos de un usuario se marca `"use cache"` ni `Cache-Control: public`; las páginas que leen la BD son dinámicas.
- **Trazabilidad:** cada historia es un change en `openspec/changes/<nombre>/` con proposal, specs, design y tasks; cada requisito y tarea cita su criterio `CA-n`; los commits y PR citan el issue y el nombre del change.
- **Formato de specs:** texto en español, pero `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`, `SHALL`/`MUST` y `**WHEN**`/`**THEN**` en inglés; si no, `openspec validate --strict` falla.
- **Validación:** toda entrada pasa por Zod; ninguna ruta confía en datos del cliente.
- **Autorización:** la API se autoriza solo dentro de cada handler (`sessionFromRequest` + `requireRole`, 401/403 en JSON); `proxy.ts` solo redirige páginas y su `matcher` excluye `/api`, `/login`, `/_next` y estáticos.
- **Observabilidad:** todo Route Handler pasa por el envoltorio de `src/lib/http.ts` (log y métricas por petición); nada de `console.log` suelto; los logs nunca incluyen contraseñas, tokens ni cuerpos de petición. Los contadores de negocio son opcionales: si la historia tiene una acción de negocio relevante, va en `src/modulos/<modulo>/metrics.ts` sobre el registro de `src/lib/metrics.ts`, con nombre `<modulo>_<evento>_total`.
- **Pruebas:** las pruebas de aceptación de la historia deben pasar antes de fusionar.
- **Extensión:** rutas, ítems de menú, paneles de la ficha del nodo y suscriptores de alertas solo mediante los registros de extensión (`menu.ts`, `paneles.ts`, `on-alerta.ts`); no se edita el núcleo ni la página de otra historia.
- **Datos:** migraciones Flyway `db/migration/V<AAAAMMDDHHmm>__<descripcion>.sql`, solo hacia adelante, compatibles hacia atrás e inmutables una vez fusionadas; ninguna historia modifica tablas ajenas; los agentes nunca escriben en una BD compartida.
- **Seguridad:** nunca secretos en el repositorio; `DATABASE_URL`, `SESSION_SECRET` y `METRICS_TOKEN` se pasan como variables al ejecutar el contenedor y el `.env` local queda fuera del repo y de la imagen; roles verificados en el servidor.
- **Agentes:** cada agente trabaja solo en su alcance. Nunca: merge, aprobar PRs, amend, rebase, reset, force push, escribir en BD compartidas, tocar `.github/`, CODEOWNERS ni la configuración de Docker o CI. Las puertas y los revisores pueden rechazar, y sus rechazos quedan en `evidencias/issue-<n>/agentes.md`.

## 9. Alcance y cronograma hasta la entrega

Hoy es el sábado 21 de noviembre de 2026 y la entrega es el martes 24 a las 18:00. El orquestador depende de las historias 1 y 2 (`openspec/`, `docker compose`, CI), así que ambas se cierran antes de implementar las historias 3 a 5.

**Alcance mínimo para el 24 de noviembre**

- **Imprescindible:**
  - Arranque de la HU 1a: `openspec init`, `openspec/config.yaml`, `CLAUDE.md` y `.claude/settings.json`.
  - HU 1b (herramientas de desarrollo) y HU 2, con el CD que publica en `ghcr.io`.
  - Orquestador con un solo modo (8 pasos, 5 minutos o menos) con `preparador`, `revisor-salida` (G2), `revisor-reglas`, `build-test`, `commit`, `abrir-pr`, los scripts `estado`, `contexto`, `trazabilidad-grep`, `copiar-evidencias`, `migracion-timestamp` y `puerto`, y la copia de evidencias.
  - Prueba de punta a punta con un solo issue, el #6 "[PRUEBA] Página Acerca de" (etiqueta `prueba`, fuera del backlog; su PR se cierra sin fusionar).
  - HU 3 a 5 construidas con ese mismo flujo, cada una con su `evidencias/issue-<n>/` y un rechazo real.
  - Issues de las historias 6 a 10 con criterios `CA-n`.
  - Ensayo por estudiante, rama de respaldo y video.
- **Para nota máxima** (solo cuando lo imprescindible esté en verde; fuera del orquestador):
  - 2 smoke de Playwright en el CI.
  - `/api/metrics`.
  - Índice `AGENTS_LOG.md`.
- **Pospuesto** (queda documentado en el [flujo del orquestador](flujo-orquestador.md), pero no se construye para la entrega):
  - El agente `trazabilidad` (lo reemplaza el script `trazabilidad-grep.mjs`; el archivo del agente existe pero el flujo no lo usa), la puerta G3 y la trazabilidad final del paso 8.
  - Worktrees, `entorno-docker` (solo servía al smoke local) y `openspec-explore` con `preguntas-tecnicas`.
  - Decisor (3 agentes en paralelo más consolidador) y revisor cruzado `Plan`.
  - El ciclo del paso 7: `revisor-pr`, automatización de `esperar-ci`, `validador-comentarios` y resolución de hilos por GraphQL.
  - `generar-planes-prueba` y `ejecutor-e2e` con capturas por verificación, reemplazados por los 2 smoke escritos a mano en el CI.
  - `reporte-historia` y `solicitar-revision-humana`.
  - La automatización de `cierre-post-merge`. El archivo se hace a mano con los mismos comandos, igual después del merge y uno a la vez.
  - El hook `guardia`.
  - Prometheus y Grafana.
  - La base de datos en Render y las migraciones en el entorno público (las agrega la HU 3).

**Cronograma**

| Fecha | Entregable | Hito de verificación |
| --- | --- | --- |
| Sáb 21 nov | Arranque de la HU 1a (`configuracion-ia-sdd`): `openspec init`, `config.yaml`, `CLAUDE.md` y `settings.json`; HU 1b (`herramientas-desarrollo`): app Next.js, puntos de extensión y base de observabilidad | `npm run lint`, `typecheck`, `test:unit` y `build` en verde; `openspec/config.yaml` sin claves duplicadas; la lista `deny` rechaza los comandos prohibidos |
| Dom 22 nov | HU 2 (compose con `db`, `flyway` y `app`, CI, CD a `ghcr.io` con paquete público, etiquetas del repo); issues de las historias 3 a 10 con criterios `CA-n` (sin change: el orquestador lo crea en el paso 3; los de HU 1b (#2) y 1a (#1) ya existen, el de HU 2 se crea el sábado con el skill `crear-hu` y el de prueba #6 ya existe); resto de la HU 1a (`configuracion-ia-sdd`): agentes, skills y scripts del nivel imprescindible | Arranque local en una máquina limpia; CI en verde; imagen del esqueleto publicada; el orquestador corre de punta a punta sobre el #6 en 5 minutos o menos |
| Lun 23 nov | HU 3 a 5 con el mismo flujo único del orquestador; piezas para nota máxima si hay tiempo; en la noche, ensayo cronometrado por estudiante | Login, CRUD y simulador, dashboard y alertas en local; cada historia con su `evidencias/issue-<n>/` y un rechazo real |
| Mar 24 nov (hasta las 18:00) | Ensayo con una historia no vista, ramas de respaldo, video por estudiante, README, `AGENTS_LOG.md` y matriz de seguridad; ninguna funcionalidad nueva después de las 12:00 | Instrucciones de instalación probadas desde cero; cada integrante termina una demo en 5 minutos o menos |

## 10. Evidencias por criterio de rúbrica

Cada criterio de la rúbrica tiene evidencias concretas que se guardan en el repositorio a medida que se producen, no al final.

| Criterio | Evidencias |
| --- | --- |
| Producto funcional (30 %) | Imagen publicada en `ghcr.io`, arranque local probado (healthcheck en verde), datos semilla, pruebas automatizadas en verde con el resumen de `vitest --coverage` y el reporte de Playwright como artefactos del CI, badge del CI en el README, salida de `/api/metrics` y logs JSON durante la demo |
| Aplicación de SDD (30 %) | Un change de OpenSpec por historia (activo o archivado), `openspec/specs/` actualizado, matriz de trazabilidad CA → requisito → tarea (la que produce el script `trazabilidad-grep.mjs` para G2; el tramo a código y caso de prueba, del agente `trazabilidad`, está pospuesto), reglas del proyecto |
| Demostración individual (40 %) | Prompt-plantilla por historia, ensayo cronometrado por integrante (también con una historia no vista), rama de respaldo y video pregrabado obligatorio |
| Seguridad | Reportes de gitleaks, `npm audit` y CodeQL (no bloqueante); pruebas de integración que demuestran los controles (401 sin sesión, 403 con rol incorrecto, 400 por Zod, 429 por rate limit en login, cabeceras de seguridad presentes); matriz `evidencias/seguridad.md` (control → prueba → evidencia) |
| Multiagente | `evidencias/issue-<n>/` por historia (con `agentes.md` construido del registro por invocación y las salidas propias de cada agente), `AGENTS_LOG.md`, un rechazo real de una puerta o un revisor documentado con su corrección |
| Entrega | Repositorio, backlog, instrucciones de instalación y ejecución, enlace a la imagen en `ghcr.io`, descripción de la arquitectura multiagente |

## 11. Riesgos y mitigaciones

Los dos riesgos con mayor probabilidad de afectar la nota son que la demo individual falle en un portátil concreto y que el despliegue gratuito se duerma o caduque justo en la demo.

| Riesgo | Mitigación |
| --- | --- |
| Cuota de IA agotada durante la demo individual | Cuenta propia por estudiante con reserva de cuota; el orquestador corre solo con sonnet y sin decisor; rama de respaldo con la historia ya resuelta |
| `docker compose` falla en algún portátil | Ensayar en máquinas ajenas el lunes 23, documentar requisitos y tener devcontainer o Codespaces como alternativa |
| Wi-Fi caído en el salón | La demo necesita internet (Claude Code, `gh`, push), así que no hay modo sin red: hotspot del celular por estudiante, dependencias e imágenes ya descargadas, demo que tolera no hacer push (evidencia local) y video pregrabado |
| La demo no cabe en 10 minutos | Flujo único de 8 pasos (sección 7): checkout principal sin `npm ci`, BD ya migrada, `build-test` reducido en paralelo con `revisor-reglas`, solo G2 con un `CORREGIR`, una sola pasada de corrección; meta de 5 minutos en el ensayo |
| Rutas largas en Windows (`node_modules` dentro de `Documents\EAFIT\...`) | `git config --global core.longpaths true` y `LongPathsEnabled`; el orquestador no crea worktrees (pospuestos) |
| Conflictos entre historias desarrolladas en paralelo | Puntos de extensión en la línea base, un archivo y una migración por historia y reglas de nombres en las reglas del proyecto |
| El despliegue gratuito en Render se duerme tras 15 minutos y su base vence a los 30 días | Abrir la URL un par de minutos antes de la demo para despertar el servicio; la fase 1 también puede mostrarse con `docker compose` sobre la misma imagen; si la base caduca, se crea otra y se aplican de nuevo las migraciones |
| La multiagencia resulta ser teatro | Puerta G2 y `revisor-reglas` con veredicto propio, `evidencias/issue-<n>/`, `AGENTS_LOG.md` y al menos un rechazo real con su corrección |
| El flujo completo del orquestador no cabe en la demo de 10 minutos | Un solo modo reducido a 8 pasos (≤ 5 minutos), lo demás pospuesto, y respaldo con los skills de OpenSpec a mano |

## 12. Puntos por verificar y fuentes

Los puntos pendientes se verificaron el 21 de noviembre de 2026:

- **Comandos de OpenSpec en Claude Code:** con OpenSpec 2.1.0 no existen `/opsx:*`; `openspec init --tools claude --scope project` instala skills (`/openspec-propose` y los demás) en `.claude/skills/` y una copia en `.agents/skills/`. La 2.1.1 salió el 19 de noviembre; se fija la serie 2.1.x. `openspec validate <change> --strict --type change --no-interactive` y `openspec archive <change> --yes` funcionan sin interacción. `verify` existe en el perfil extendido.
- **`isolation: worktree` en subagentes:** está en la documentación oficial de Claude Code (crea el worktree en `.claude/worktrees/`). También se confirmó que la herramienta `Agent` acepta `model` y `effort` por invocación (además del frontmatter del agente) y que los subagentes no pueden lanzar workflows, así que el `decisor` lo lanza solo la sesión principal.
- **Límites gratuitos de Render:** confirmados en render.com/docs/free (suspensión a los 15 minutos, cerca de 1 minuto para despertar, 750 horas al mes, Postgres de 1 GB que vence a los 30 días más 14 de gracia, una base gratuita por espacio de trabajo, SMTP bloqueado). Los *Preview Environments* exigen plan Pro, así que no hay CD efímero por PR.
- **GitHub:** el repositorio es público, así que CodeQL, `ghcr.io` y gitleaks (cuenta personal) son gratuitos; también los environments con revisores obligatorios, si se separa un entorno de producción.
- **Observabilidad:** `prom-client` y `pino` requieren el runtime de Node; los Route Handlers corren en Node por defecto, y no se usan en `proxy.ts`. `pino`, `thread-stream` y `pg` ya están en la lista automática de `serverExternalPackages` de Next.js; `prom-client` no, así que se declara en `next.config.ts` para que todas las rutas compartan el registro. `pino` sin transporte escribe JSON a stdout, que es como se usa; se verificará en la HU 1b con la salida `standalone`.
- **Next.js 16** (16.4.6 a la fecha; la 16.4.5 trae el parche de seguridad de noviembre): `middleware.ts` se renombró `proxy.ts` y corre en Node; `create-next-app` activa Cache Components por defecto; `output: "standalone"` no copia `public/` ni `.next/static`; Vitest no renderiza Server Components asíncronos. El descubrimiento de `menu.ts` con `import.meta.glob` (Turbopack 16.3+) se probará en la HU 1b; si falla, se usa el `registro.ts` manual.

Los datos de herramientas proceden de consultas hechas el 14, el 17 y el 21 de noviembre de 2026.

**Fuentes**

- [OpenSpec en GitHub (Fission-AI)](https://github.com/Fission-AI/OpenSpec)
- [OpenSpec: cómo funcionan los comandos](https://openspec.dev/docs/how-commands-work)
- [OpenSpec 1.0: cambios de comandos](https://newreleases.io/project/github/Fission-AI/OpenSpec/release/v1.0.0)
- [Spec Kit vs BMAD vs OpenSpec en 2026](https://dev.to/willtorber/spec-kit-vs-bmad-vs-openspec-choosing-an-sdd-framework-in-2026-d3j)
- [Reseña de Kiro](https://dev.to/pickuma/amazon-kiro-review-awss-spec-driven-agentic-ide-in-2026-4f48)
- [Guía de subagentes de Claude Code](https://alexcloudstar.com/md/blog/claude-code-subagents-guide-2026/)
- [Render: despliegue gratuito (documentación oficial)](https://render.com/docs/free)
- [Render: Preview Environments (requieren plan Pro)](https://render.com/docs/preview-environments)
- [Claude Code: subagentes](https://code.claude.com/docs/en/sub-agents.md)
- [Next.js 16.4](https://nextjs.org/blog/next-16-4) y [aviso de seguridad de noviembre de 2026](https://nextjs.org/blog/november-2026-security-release)
- [Next.js: Server y Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js: Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) y [Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Next.js: proxy.js (antes middleware)](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) y [autenticación](https://nextjs.org/docs/app/guides/authentication)
- [Next.js: output standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) y [ejemplo with-docker](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [Next.js: pruebas con Vitest](https://nextjs.org/docs/app/guides/testing/vitest) y [con Playwright](https://nextjs.org/docs/app/guides/testing/playwright)
- [GitHub: publicar imágenes en Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub: environments y revisores obligatorios](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [Render: precios 2026 (reseña de terceros)](https://temps.sh/blog/render-pricing-2026)
- [Fly.io: precios 2026, sin plan gratuito para cuentas nuevas (terceros)](https://temps.sh/blog/fly-io-pricing-2026)
- [Railway: plan gratuito 2026 (terceros)](https://kuberns.com/blogs/railway-free-tier/)
- [Supabase: pausa de proyectos gratuitos (oficial)](https://supabase.com/kb/faqs/platform/free-project-pausing)
