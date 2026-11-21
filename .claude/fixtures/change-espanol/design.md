# Design

## Context

Módulo nuevo y autocontenido (`src/modulos/acerca/`). No toca el núcleo ni el esquema de BD. Cambia el contrato: agrega `GET /api/acerca`.

## Decisions

- **Contrato (CA-1, CA-3):** `GET /api/acerca` responde 200 con `{ texto: string, version: string }`; sin sesión, 401 `{ error: "no autenticado" }`. Roles permitidos: `admin` y `tecnico` (`requireRole`). Esquema Zod de respuesta en `schema.ts`.
- **Capas:** el handler usa el envoltorio de `src/lib/http.ts`, autoriza y llama a `service.ts`. La versión sale de `package.json` (decisión #1). No hay SQL ni `repo.ts`.
- **Página (CA-2):** `page.tsx` llama al servicio directamente, sin `fetch` a la propia API. El ítem de menú se declara en `menu.ts`.

## Risks / Trade-offs

- [La versión de `package.json` no coincide con la imagen publicada] → Se acepta para la práctica.
