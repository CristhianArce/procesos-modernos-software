# Arquitectura e infraestructura

## 1. Visión general

Una sola aplicación **Next.js 16** (App Router) sirve la interfaz y la API. Guarda sus datos en **Postgres 17**. Las migraciones del esquema las aplica **Flyway**. Todo se empaqueta en una imagen **Docker** que publica el CD en `ghcr.io` y que **Render** ejecuta en producción.

```
Navegador ──HTTP──▶ Next.js (páginas + /api/*) ──pg──▶ Postgres
                         ▲                               ▲
                  proxy.ts (redirige                Flyway (db/migration)
                  páginas sin sesión)               Semillas (db/seed)
```

## 2. La aplicación por dentro

### Capas (CLAUDE.md §4)

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Página | `src/app/(tablero)/<modulo>/page.tsx` | Lee datos llamando al servicio (nunca al `fetch` de su propia API). |
| Componente cliente | `ui/*.tsx` con `"use client"` | Interactividad; llama a `/api/...`. |
| Handler | `src/app/api/<modulo>/route.ts` | Valida con Zod, autoriza, llama al servicio y traduce errores. |
| Servicio | `service.ts` | Reglas de negocio. |
| Repositorio | `repo.ts` (`import "server-only"`) | El único lugar con SQL. |

Estas reglas se siguen siempre: sin Server Actions y sin ORM.

### Módulos

`auth`, `nodos`, `sensores`, `lecturas`, `alertas`, `simulador`, `estado` (cálculo de niveles y datos en vivo), `topologia` (mímico y editor), `dashboard`, `inicio` y `ui` (componentes visuales compartidos). Los módulos no se editan entre sí. Se extienden mediante tres archivos de registro: `menu.ts` (menú lateral), `paneles.ts` (paneles de la ficha del nodo) y `on-alerta.ts` (suscriptores de alertas).

### Autenticación y roles

- `POST /api/auth/login` verifica la contraseña (hash **scrypt**) y entrega una cookie `sesion`.
- La cookie es un **JWT firmado (HS256)** con la librería `jose`. Contiene el usuario y el rol, y dura 8 horas.
- `SESSION_SECRET` (mínimo 32 caracteres) es la clave de firma. Sin ella la app falla a propósito, en vez de desloguear a todos en silencio.
- Hay **dos barreras** distintas:
  - `proxy.ts` solo redirige **páginas** a `/login` si no hay sesión válida.
  - Cada handler de la API autoriza por sí mismo con `sessionFromRequest` + `requireRole` y responde 401 o 403 en JSON.

### Datos en vivo

El navegador consulta `/api/estado` en un bucle con `setTimeout` y se pausa cuando la pestaña está oculta. Solo repinta lo que cambió. El estado de cada nodo y sus niveles (normal, advertencia, crítico) se calculan con funciones puras, que se prueban sin base de datos.

### Simulador

- **Manual:** el botón «Simular lecturas» llama a `POST /api/simulador` (solo administrador).
- **Continuo:** `src/instrumentation.ts` arranca un bucle dentro del proceso de Next si existe `SIM_AUTO_MS` (mínimo 500 ms). Las lecturas derivan suavemente alrededor de una media, con picos ocasionales (0,5 %). Se podan las lecturas de más de 60 minutos, conservando la última de cada sensor.

### Observabilidad

- **`/api/health`:** responde `{"status":"ok"}`. Lo usan Docker y Render para saber si la app está viva.
- **`/api/metrics`:** métricas de **Prometheus** (`prom-client`). Exige `Authorization: Bearer <METRICS_TOKEN>`.
- **Logs:** `pino`, una línea por petición con método, ruta, estado y duración. Nunca se registran cuerpos, contraseñas ni tokens.
- **`conHttp`** (`src/lib/http.ts`) envuelve todos los handlers: mide, registra y traduce errores (Zod a 400, errores propios a su código, el resto a 500).

### Seguridad

Cabeceras en `next.config.ts` (CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`), entrada siempre validada con Zod, secretos solo por variables de entorno y `.env` fuera del repositorio.

## 3. Base de datos

| Elemento | Qué es |
|---|---|
| Postgres 17 | Motor. En local corre en un contenedor con un volumen (`datos`) para que persista. |
| `pg` | Cliente con SQL escrito a mano. |
| Flyway 11 | Aplica `db/migration/V<AAAAMMDDHHmm>__*.sql` en orden. Las migraciones son solo hacia adelante e inmutables una vez fusionadas. |
| Semillas | `db/seed/*.sql`, aplicadas por `npm run seed`. Son idempotentes (`ON CONFLICT DO NOTHING`), así que repetirlas es seguro. |

Migraciones actuales: línea base, usuarios, nodos/sensores/lecturas, alertas y topología. Semillas: cuentas, 2 nodos y sus sensores, y la topología de 13 nodos con 13 enlaces.

**Flyway y la semilla son pasos aparte a propósito.** Un `docker compose up` a secas arranca Postgres y la app, pero no crea las tablas ni los datos. Por eso el arranque tiene varios pasos.

## 4. Docker

### `Dockerfile` (tres etapas)

1. **deps:** `npm ci` con el `package-lock.json`.
2. **build:** `npm run build`. Next genera `output: "standalone"`, un servidor mínimo.
3. **runner:** copia solo lo necesario a una imagen `node:24-slim`, corre como usuario no root (`node`) y arranca con `node server.js`.

Los secretos **nunca** entran en la imagen. Llegan al ejecutar, como variables de entorno.

### `docker-compose.yml`

| Servicio | Función |
|---|---|
| `db` | Postgres con volumen y comprobación de salud (`pg_isready`). |
| `flyway` | Servicio de un solo uso (perfil `tools`): aplica las migraciones y termina. |
| `app` | La imagen de la app. Espera a que `db` esté sana y expone su propia comprobación contra `/api/health`. |

**Puertos efímeros:** `"5432"` y `"3000"` sin número fijo en el host. Docker asigna uno libre y se consulta con `docker compose port app 3000`. Así varias personas, ramas o historias corren a la vez sin chocar. El nombre del proyecto (`-p`) aísla además los contenedores y volúmenes de cada una.

## 5. CI/CD

### CI (`.github/workflows/ci.yml`): en cada PR y en `main`

| Job | Qué hace |
|---|---|
| Configuración de IA | Pruebas de `.claude/` y validación estricta de OpenSpec. |
| Proyecto | `npm ci`, lint, typecheck, pruebas unitarias, migraciones con Flyway sobre un Postgres de servicio, pruebas de integración y build. |
| Imagen | Construye la imagen Docker y consulta `/api/health` sobre ella. |
| Seguridad | Solo al fusionar en `main`: gitleaks (secretos) y `npm audit`. |

### CD (`.github/workflows/cd.yml`): al fusionar en `main`

1. Construye y publica la imagen en `ghcr.io` con las etiquetas `latest` y `sha-<commit>`.
2. Si existe el secreto `RENDER_DATABASE_URL`, migra y siembra la base de Render.
3. Si existe `RENDER_DEPLOY_HOOK_URL`, avisa a Render para que redescargue `:latest`.

### Render (`render.yaml`)

Un servicio web basado en la imagen publicada y una base Postgres gratuita. `SESSION_SECRET` y `METRICS_TOKEN` los genera Render. `DATABASE_URL` sale de la base. El plan gratuito de la base vence a los 30 días.

## 6. Las pruebas

| Tipo | Comando | Necesita |
|---|---|---|
| Unitarias | `npm run test:unit` | Nada (sin BD). |
| Integración | `npm run test:integration` | Postgres con migraciones y `DATABASE_URL`. Llaman a los handlers con `Request`. |
| e2e (Playwright) | `BASE_URL=... npm run e2e` | Una app ya levantada y sembrada, más el navegador Chromium. |
| Configuración de IA | `node --test ".claude/tests/*.test.mjs"` | OpenSpec instalado globalmente. |

## 7. Por qué hay varias formas de levantar la app en local

No son alternativas arbitrarias: cada una resuelve una necesidad distinta.

| Forma | Comandos | Para qué sirve | Particularidades |
|---|---|---|---|
| **A. Todo en Docker** | `docker compose up -d --wait db`, `docker compose run --rm flyway migrate info`, `npm run seed`, `docker compose up -d --build --wait app` | Ver la app **como correrá en producción**: misma imagen, mismo build. Es la mejor demostración. | Reconstruir la imagen tarda. El simulador continuo está apagado, porque compose no pasa `SIM_AUTO_MS`. |
| **B. Desarrollo (`npm run dev`)** | Postgres en Docker + `npm run dev` | Programar con recarga en caliente (HMR) y errores detallados. | Corre fuera de Docker, así que necesitas `DATABASE_URL` hacia el puerto efímero de la BD. Se puede activar `SIM_AUTO_MS`. |
| **C. Producción local (`npm run build && npm start`)** | `npm start` | Probar el build sin Docker, y es lo que usa Playwright por defecto. | Escucha en el puerto 3000. |
| **D. Corrida desechable de pruebas** | `build-test.mjs` (skill `build-test`) | Pruebas de integración con una BD propia de cada corrida (proyecto `flujo-issue-<n>`). | La levanta, migra y la destruye. Nunca toca tu BD de desarrollo. |
| **E. Render (nube)** | Automático desde `main` | Producción real. | No es local; se incluye para completar el cuadro. |

**Por qué varias:**

1. **Velocidad frente a fidelidad.** `dev` es rápido para escribir código; Docker es fiel a producción pero más lento.
2. **Aislamiento.** El proyecto está pensado para que **varios agentes y personas trabajen a la vez**. Por eso los puertos son efímeros y cada corrida tiene su propio proyecto de compose y su propio volumen.
3. **La BD siempre es un contenedor.** Postgres nunca se instala en tu máquina. Así todos usan la misma versión (17) y nadie escribe en una BD compartida, que es una regla del proyecto.
4. **Migración y semilla son pasos explícitos.** Las migraciones son inmutables y la semilla es opcional. Automatizarlas dentro de `up` mezclaría esquema con datos de demostración.
5. **Historia del proyecto.** Se construyó por historias de usuario con un orquestador de agentes (HU 1 a 6). Cada historia añadió una pieza: el Dockerfile y el compose en la HU 2, el simulador en la 6. Eso explica que convivan comandos de distintas épocas.

**Qué usar:**

- Para **mostrar** la app: la forma A.
- Para **cambiar código**: la forma B con `SIM_AUTO_MS=2500`.
- Para **validar antes de un PR**: la forma D (o `npm run lint`, `typecheck`, `test:unit`, `test:integration` y `build` por separado).

## 8. Variables de entorno

| Variable | Uso |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales del contenedor Postgres. |
| `DATABASE_URL` | Cadena de conexión de la app. En compose se arma sola con las anteriores. |
| `SESSION_SECRET` | Clave de firma de las sesiones (mínimo 32 caracteres). |
| `METRICS_TOKEN` | Token para `/api/metrics`. |
| `FLYWAY_URL`, `FLYWAY_USER`, `FLYWAY_PASSWORD` | Opcionales: por defecto Flyway usa los valores de Postgres. |
| `SIM_AUTO_MS` | Opcional: intervalo del simulador continuo (mínimo 500). Sin definir, apagado. |

Se copian de `.env.example` a `.env`, que no se sube al repositorio.
