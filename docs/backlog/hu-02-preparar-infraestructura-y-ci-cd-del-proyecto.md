## Historia

Como equipo de desarrollo quiero un entorno local reproducible, un CI ligero en cada PR y un CD que publique la imagen y la despliegue en Render para que cualquier historia se pruebe, se valide, se empaquete y se vea publicada sin pasos manuales.

## Contexto

Es la HU 2 de la propuesta (sección 5) y la fase 2 del [flujo del orquestador](../flujo-orquestador.md). Parte de la app base de la HU 1b y de la configuración de IA de la HU 1a. Hoy no hay forma de levantar la app con su base de datos ni un pipeline que proteja `main`. Esta historia deja `docker compose` con `db`, `flyway` y `app`, un CI mínimo, la imagen publicada en `ghcr.io`, su despliegue en Render y las plantillas y etiquetas del repositorio. En Render corre solo la app, sin base de datos hasta la HU 3.

## Criterios de aceptación

- **CA-1:** Dado un clon limpio con un `.env` copiado de `.env.example`, cuando se levanta la base, se aplican las migraciones con Flyway, se carga la semilla y se levanta la app, entonces `db` y `app` quedan sanos, `migrate info` muestra la migración de línea base aplicada y `GET /api/health` responde 200 en el puerto que asigna `docker compose port`.
- **CA-2:** Dado un `.env` ausente o sin una variable obligatoria, cuando se levanta `docker compose`, entonces falla antes de arrancar y el mensaje nombra la variable que falta.
- **CA-3:** Dado un PR, cuando corre el CI, entonces ejecuta lint, typecheck, pruebas unitarias, pruebas de integración y build, y además construye la imagen y comprueba que arranca y responde 200 en `/api/health`. Si cualquiera de esos pasos falla, el check del PR queda en rojo.
- **CA-4:** Dado un push a `main`, cuando corre el CI, entonces además ejecuta gitleaks sobre el historial y `npm audit` con nivel alto o crítico, y falla si encuentra un secreto o una vulnerabilidad de ese nivel. En un PR esos controles no corren.
- **CA-5:** Dado un merge en `main` que cambia código de la app, cuando corre el CD, entonces publica en `ghcr.io` la imagen con las etiquetas `latest` y `sha-<commit>`. Si el merge solo toca documentación, specs o evidencias, no publica.
- **CA-6:** Dada la imagen publicada, cuando se consulta `latest` sin iniciar sesión en `ghcr.io`, entonces responde. Y cuando se ejecuta con `DATABASE_URL`, `SESSION_SECRET` y `METRICS_TOKEN`, `GET /api/health` responde 200.
- **CA-7:** Dado el repositorio, cuando se consultan sus plantillas y sus etiquetas, entonces existen una plantilla de historia de usuario, una de PR y las etiquetas `historia`, `bloqueado`, `migracion`, `revision-especializada` y `escalado`.
- **CA-8:** Dada una imagen nueva publicada por el CD, cuando el CD avisa a Render, entonces el servicio público ejecuta esa imagen y `GET /api/health` responde 200 en su URL. Si Render rechaza el aviso, el CD termina en rojo.
- **CA-9:** Dado un push a `main` con el secreto de la base de Render configurado, cuando el CD corre, entonces aplica las migraciones y las semillas a la base de Render antes de avisar al servicio, y la app pública usa esa base. Si una migración falla, el CD termina en rojo sin avisar a Render. Si el secreto no existe, el paso se omite.

## Reglas de negocio

- **RN-1:** El CI de cada PR es ligero: solo lo indispensable para detectar una rotura. Los controles de seguridad corren al fusionar en `main`.
- **RN-2:** Ningún secreto en el repositorio ni en la imagen: `DATABASE_URL`, `SESSION_SECRET` y `METRICS_TOKEN` llegan por variables de entorno en tiempo de ejecución, nunca al construir.
- **RN-3:** Los puertos del host son efímeros, para que varias historias o personas corran a la vez sin chocar.
- **RN-4:** El CD solo se dispara al fusionar en `main` y solo tiene permiso de escritura de paquetes en el job que publica.
- **RN-5:** Los secretos de la app en Render (`SESSION_SECRET` y `METRICS_TOKEN`) los genera Render y no están en el repositorio; la URL del aviso de despliegue es un secreto del repositorio y, si falta, el aviso se omite.
- **RN-6:** La base de Render es gratuita (vence a los 30 días, con 14 de gracia). Su URL externa es un secreto del repositorio; el CD la usa con la imagen de Flyway y con `psql`, y la app usa la URL interna que le inyecta Render.

## Fuera de alcance

- Tablas de dominio, semilla de datos y login (HU 3 a 5). Aquí solo el mecanismo de semilla.
- Configuración de IA, `CLAUDE.md` y skills (HU 1a) y la app base (HU 1b).

## Notas técnicas (no vinculantes)

- Change de OpenSpec: `infraestructura-ci-cd`; con `design.md`, porque agrega servicios y flujos de trabajo.
- Archivos: `Dockerfile` (multi-etapa sobre `node:24-slim`, `output: "standalone"`), `.dockerignore`, `docker-compose.yml` (`db`, `flyway` con `profiles: ["tools"]`, `app`; healthchecks y puertos `["5432"]` y `["3000"]`), migración de línea base `db/migration/V<AAAAMMDDHHmm>__linea_base.sql`, `.github/workflows/ci.yml` y `cd.yml`, `.github/ISSUE_TEMPLATE/` y `PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS` y `render.yaml` (servicio web basado en imagen, plan gratuito).
- Orden de arranque: `up -d --wait db` → `run --rm flyway migrate info` → `npm run seed` → `up -d --build --wait app`.
- Etiquetas del repo creadas con `gh label create`; paquete de `ghcr.io` público tras el primer CD.
- Datos: sin tablas propias; la migración de línea base solo habilita la extensión `pgcrypto`.
- Puntos de extensión: ninguno.

## Dependencias

- HU 1a (#1) y HU 1b (#2).

## Preguntas abiertas

- ¿Se agrega CodeQL (no bloqueante)? — opciones: sí, en un workflow aparte solo en `main` / no, por mantener el CI ligero. La propuesta lo menciona; el CI actual no lo trae.
- ¿Se agrega al CI un Postgres de servicio, `flyway migrate info` y un script que compare la versión mínima nueva de `db/migration/` con la máxima de la base del PR? — opciones: ahora / cuando la HU 3 traiga la primera migración o prueba con BD. Hoy las pruebas de integración no usan BD.
- ¿Se activa la protección de `main` (PR obligatorio, checks del CI, `CODEOWNERS`)? — opciones: sí, la configura quien administra el repositorio / no. Requiere permisos de administrador.
- ¿Cómo se aplican las migraciones y la semilla en la base de datos de Render cuando exista? — opciones: a mano con Flyway apuntando a la URL externa de la base / desde el CD con un usuario propio. Se decide con la HU 3, que trae la primera migración.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
