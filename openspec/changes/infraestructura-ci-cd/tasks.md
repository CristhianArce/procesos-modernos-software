# Tasks

## 1. Entorno local

- [x] 1.1 Migración de línea base `db/migration/V202611211900__linea_base.sql` (extensión `pgcrypto`); verificar con `docker compose run --rm flyway migrate info`, que la muestra aplicada (CA-1; Derivado: decisión #3)
- [x] 1.2 `Dockerfile` multi-etapa sobre `node:24-slim`, `.dockerignore` y `public/.gitkeep`; verificar con `docker build .` y con `docker run` de la imagen, que responde 200 en `/api/health` y corre como el usuario `node` (CA-1, CA-6; Derivado: decisión #1)
- [x] 1.3 `docker-compose.yml` con `db`, `flyway` (perfil `tools`) y `app`, con healthchecks, puertos efímeros y variables obligatorias con `:?`; verificar con `docker compose config` sin `.env` (falla nombrando `POSTGRES_USER`) y sin `SESSION_SECRET` (falla nombrándola) (CA-2; Derivado: decisión #2)
- [x] 1.4 Arranque completo en un clon con un `.env` local: `up -d --wait db`, `migrate info`, `npm run seed` y `up -d --build --wait app`; verificar que `db` y `app` quedan sanos y `/api/health` responde 200 en el puerto de `docker compose port app 3000` (CA-1; Derivado: decisión #3)
- [x] 1.5 Dos entornos a la vez con distinto `COMPOSE_PROJECT_NAME`; verificar que ambos arrancan y que `docker compose port` devuelve puertos distintos (CA-1; Derivado: decisión #2)
- [x] 1.6 README: insignia del CI y pasos de arranque con el `DATABASE_URL` armado desde `docker compose port db 5432`; verificar leyendo la sección «Cómo ejecutar» (CA-1; Derivado: decisión #3)

## 2. Integración continua

- [x] 2.1 Job `proyecto` en `ci.yml` (lint, typecheck, `test:unit`, `test:integration`, build); verificar con un PR en verde (PR #13) (CA-3; Derivado: decisión #4)
- [x] 2.2 Job `imagen` en `ci.yml` (build sin push, caché `gha` y arranque con consulta a `/api/health`); verificar con el check `Imagen de Docker` en verde del PR #15 (CA-3; Derivado: decisión #5)
- [x] 2.3 Job `seguridad` (gitleaks y `npm audit --audit-level=high`) con `if: github.event_name == 'push'`; verificar que está omitido en el PR #15 y en verde en la corrida de `main` tras el PR #16 (CA-4; Derivado: decisión #4)

## 3. Publicación de la imagen y despliegue

- [x] 3.1 `.github/workflows/cd.yml` con `paths-ignore`, permisos mínimos, concurrencia que no cancela y etiquetas `latest` y `sha-<commit>`; verificar la sintaxis YAML con el módulo `yaml` que trae OpenSpec y revisar el log de la corrida de `main` del PR #16, que publica ambas etiquetas (CA-5; Derivado: decisión #6)
- [x] 3.2 Comprobar que el CD no corre con merges de documentación; verificar en `gh run list --workflow cd.yml`: hay corridas para los PR #16, #17 y #29, y ninguna para #19 y #28, que solo tocaron `docs/` (CA-5; Derivado: decisión #6)
- [x] 3.3 Comprobar el paquete público y la imagen publicada; verificar con un token anónimo de `ghcr.io` (HTTP 200 sobre el manifiesto de `latest`) y ejecutando la imagen con `--platform linux/amd64`, que responde 200 en `/api/health` (CA-6; Derivado: decisión #7)
- [x] 3.4 `render.yaml` con el servicio web basado en imagen, plan gratuito, `PORT=3000`, health check y secretos generados por Render; verificar que `GET https://tablero-oa6d.onrender.com/api/health` responde 200 con `status` igual a `ok` y que `/` sin sesión redirige a `/login` (CA-8; Derivado: decisión #12)
- [x] 3.5 Paso `Avisar a Render` al final de `cd.yml`, con `RENDER_DEPLOY_HOOK_URL` como secreto y `if` que lo omite si falta; verificar con la corrida del CD de `main` tras el PR #33, donde el paso sale en verde y no omitido, y con una prueba local del comando contra un servidor que responde 200 y 404 (CA-8; Derivado: decisión #12)

## 4. Plantillas, etiquetas y revisores

- [x] 4.1 `.github/ISSUE_TEMPLATE/historia.md` y `.github/PULL_REQUEST_TEMPLATE.md`; verificar con `diff` contra `plantilla-issue.md` de `crear-hu` (idéntico) y `pr-body.md` del orquestador (solo difiere la primera línea) (CA-7; Derivado: decisión #9)
- [x] 4.2 Etiquetas `bloqueado`, `migracion`, `revision-especializada`, `escalado`, `linea-base` y `clase` con `gh label create`; verificar con `gh label list` (CA-7)
- [x] 4.3 `.github/CODEOWNERS` con los cuatro colaboradores; verificar con `gh api repos/CristhianArce/procesos-modernos-software/codeowners/errors` (cero errores) (CA-7; Derivado: decisión #9)

## 5. Integración y aceptación de la historia

- [x] 5.1 Evidencia por criterio en `evidencias/issue-18/trazabilidad.md`; verificar que cada `CA-1` a `CA-7` apunta a una corrida o a un comando (CA-1 a CA-8; Derivado: decisión #10)
- [x] 5.2 `openspec validate infraestructura-ci-cd --strict --type change --no-interactive` y `openspec validate --all --strict --no-interactive` en verde (CA-1 a CA-8)

## Workflow follow-up

- Abrir el PR con `Closes #18` y `Change: infraestructura-ci-cd`, y esperar que el CI esté en verde (job `configuracion-ia`, que valida OpenSpec).
- Después del merge, archivar con `openspec archive infraestructura-ci-cd --yes` en un PR propio y verificar `openspec validate --specs --strict`.
