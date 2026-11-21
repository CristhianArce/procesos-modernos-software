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

## Cómo ejecutar (cuando la HU 1 y la HU 2 estén fusionadas)

Requisitos: Node 24, Docker Desktop, [GitHub CLI](https://cli.github.com/) (`gh`) y OpenSpec 2.1 (`npm i -g @fission-ai/openspec@2.1`).

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
