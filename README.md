# Tablero de sensores eléctricos (SDD multiagente)

Aplicación para administrar nodos y sensores de una red eléctrica, simular lecturas de voltaje, corriente y potencia, verlas en un tablero y generar alertas por umbral. Se construye con Spec-Driven Development (OpenSpec) y un orquestador de agentes de Claude Code que lleva cada historia de usuario desde el issue hasta el PR, con puertas de calidad y evidencia trazable. Taller "Aplicación de Solución IA bajo SDD", modalidad B; entrega el 24 de noviembre de 2026.

![CI](https://img.shields.io/badge/CI-pendiente-lightgrey) <!-- pendiente: reemplazar por el badge de ci.yml cuando exista -->

## Stack

- Una sola app **Next.js 16** (App Router) para interfaz y API: páginas con Server Components y componentes `"use client"`, API en **Route Handlers + Zod**.
- **Postgres** con `pg` y SQL escrito a mano; migraciones versionadas con **Flyway**.
- **Docker** (`docker compose` en local) y **GitHub Actions** (lint, pruebas, seguridad, build de la imagen).
- Imagen publicada en **GitHub Container Registry**: `ghcr.io/danielfms/procesos-modernos-software`. El despliegue en un entorno público está pospuesto.
- SDD con **OpenSpec** en lugar de Spec Kit: su numeración secuencial choca cuando varios estudiantes trabajan a la vez y su ciclo no cabe en la demo de 10 minutos (ver [propuesta §4](docs/propuesta.md#4-stack-tecnológico-y-decisiones)).

## Documentación

- [Propuesta de arquitectura y SDD](docs/propuesta.md): requisitos, arquitectura, backlog, reglas del proyecto, cronograma y riesgos.
- [Flujo del orquestador](docs/flujo-orquestador.md): la secuencia única de 8 pasos que corre para la entrega (5 minutos o menos) y, como referencia, el flujo completo con los pasos 0 a 10 y las puertas G1 a G4.
- [Especificación de skills y agentes](docs/especificacion-skills-agentes-orquestador.md): ficha de cada pieza del orquestador.
- [Plan de construcción del entorno SDD](docs/plan-construccion-sdd.md): orden de construcción, niveles y calendario.

## Configuración inicial (una vez por portátil)

Requisitos base: Node 24, Git ≥ 2.40 y Docker Desktop. Se usa Git Bash, no PowerShell, para que los comandos coincidan con los permisos de `.claude/settings.json`.

### GitHub CLI (`gh`)

```
winget install --id GitHub.cli --source winget
gh auth login                                  # GitHub.com, HTTPS, autenticar git con gh
gh auth refresh -h github.com -s workflow      # solo si vas a hacer push de .github/workflows/ (HU 2)
gh auth status                                 # verificar
```

El orquestador y el skill `crear-hu` usan `gh` para leer y crear issues y PR. Las etiquetas del repo (`historia`, `bloqueado`, `migracion`, `revision-especializada`, `escalado`) las crea la HU 2. `gh` falla si se aplica una etiqueta que no existe.

### OpenSpec

```
npm i -g @fission-ai/openspec@2.1              # se fija la serie 2.1.x
openspec --version
openspec validate --all --strict --no-interactive
```

- El repo **ya está inicializado** (`openspec init --tools claude --language es --scope project`, HU 1a). No hay que volver a correr `init`.
- `openspec/config.yaml` solo trae las reglas mínimas (encabezados de specs en inglés, `CA-n` y `## Purpose`). El resto de las reglas vive en `CLAUDE.md`.
- Los skills `openspec-*` están versionados en `.claude/skills/` y `.agents/skills/`. Si cambia la versión de OpenSpec, se regeneran con `openspec update .`.
- En Claude Code se invocan por nombre: `/openspec-propose`, `/openspec-explore`, `/openspec-apply-change`, `/openspec-update-change`, `/openspec-sync-specs` y `/openspec-archive-change` (desde OpenSpec 2.0 no existen los `/opsx:*`).

### Claude Code

```
npm i -g @anthropic-ai/claude-code             # o el instalador oficial de https://claude.com/claude-code
claude                                         # en la raíz del repo; la primera vez pide iniciar sesión (/login)
node --test ".claude/tests/*.test.mjs"         # pruebas de la configuración de IA
```

Qué trae el repo y no hay que configurar a mano:

- `CLAUDE.md`: reglas del proyecto (stack, capas, datos, seguridad, SDD y reglas de agentes).
- `.claude/settings.json`: permisos compartidos. La lista `allow` cubre los comandos del flujo y la lista `deny` bloquea merge, aprobar PR, force push, amend, rebase, reset y leer `.env`. Los ajustes personales van en `.claude/settings.local.json` (ignorado por git), nunca en el compartido.
- `.claude/skills/`: `crear-hu` (redacta y publica historias como issues) y los skills de OpenSpec. Los agentes y el skill del orquestador llegan con la HU 1a.
- `.claude/worktrees/` (worktrees de cada historia) y `.flujo/` (`<trabajo>` de cada issue) están fuera de git.

Si varias sesiones de Claude trabajan en el mismo clon, no cambies de rama en el checkout principal: usa un worktree (`git worktree add .claude/worktrees/<nombre> origin/main`).

## Cómo ejecutar (cuando la HU 1 y la HU 2 estén fusionadas)

Requisitos: los de la [configuración inicial](#configuración-inicial-una-vez-por-portátil).

```
cp .env.example .env                          # completar los valores locales
docker compose up -d --wait db                # Postgres
docker compose run --rm flyway migrate info   # aplicar migraciones
npm ci && npm run seed                        # datos semilla
docker compose up -d --build --wait app       # la app, sana según /api/health
docker compose port app 3000                  # puerto local asignado
```

O, sin compilar, con la imagen publicada:

```
docker pull ghcr.io/danielfms/procesos-modernos-software:latest
```

Credenciales de demostración: pendiente (las crea la semilla de la HU 3).

## Historias de usuario

Las historias son issues de GitHub, con criterios de aceptación numerados (`CA-n`). Cada una se implementa con el orquestador (`/orquestador <n>`), que tiene un solo modo: la secuencia de 8 pasos del [flujo del orquestador](docs/flujo-orquestador.md), con un change de OpenSpec en `openspec/changes/<nombre>/` y un PR en borrador al final. Antes de correrlo, la BD de desarrollo debe estar levantada y migrada (los dos primeros comandos de arriba) y `node_modules` instalado.

## Evidencias

- `evidencias/issue-<n>/`: decisiones, puerta de calidad G2 (con su trazabilidad CA → requisito → tarea), verificación y agentes que intervinieron en cada historia.
- `AGENTS_LOG.md`: índice de todas las historias con sus rechazos y correcciones.
