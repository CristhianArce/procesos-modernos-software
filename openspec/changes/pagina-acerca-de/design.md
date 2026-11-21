# Design

## Context

Historia de práctica (issue #6, etiqueta `practica`). En el repo no existe todavía el núcleo de la HU 1b: no hay `package.json`, `src/lib/http.ts`, `sessionFromRequest`/`requireRole`, `proxy.ts`, layout del tablero, BD ni `contracts/openapi.yaml`. Según la nota de modo práctica, todo eso queda fuera de alcance. El módulo debe ser autocontenido y probarse solo con pruebas unitarias (`typecheck` y `test:unit`).

## Goals / Non-Goals

**Goals:**
- Cubrir CA-1, CA-2 y CA-3 con código del módulo y pruebas unitarias que citen `#6 CA-n`.
- Contenido fijo en código (RN-1).

**Non-Goals:**
- Núcleo de la HU 1b (sesión real, envoltorio `http.ts`, `proxy.ts`, layout, registro del menú), contrato OpenAPI, BD, migración, semilla, pruebas de integración y e2e.
- Editar el contenido desde la interfaz.

## Decisions

1. **Herramientas mínimas** (Derivado: decisión #1). `package.json` con `typescript`, `vitest`, `zod`, `react`, `react-dom` y sus tipos; scripts `typecheck` (`tsc --noEmit`) y `test:unit` (`vitest run`). Todas están en el stack de `CLAUDE.md` o son las herramientas de prueba que ese archivo cita (Vitest, `react-dom/server`). No se instala Next.js: la página es un componente síncrono y el handler usa `Request`/`Response` estándar de Node.
2. **Sesión inyectada** (Derivado: decisión #2). Como `sessionFromRequest` no existe, `handler.ts` exporta `crearGetAcerca(obtenerSesion)`, que recibe una función `(req: Request) => Sesion | null`. Las pruebas inyectan sesiones de administrador, técnico o `null`. `route.ts` conecta `GET` con un `obtenerSesion` que devuelve siempre `null` (falla cerrado: 401) hasta que la HU 1b aporte la sesión real; ese cambio será de una línea.
3. **Contenido y forma** (CA-1, RN-1). `service.ts` devuelve `{ nombre: "Tablero de sensores eléctricos", version: "0.1.0" }`. `schema.ts` define con Zod la forma de la respuesta (`acercaSchema`) y el servicio la valida, así la forma está en un solo lugar.
4. **Menú** (CA-2). `menu.ts` exporta `itemMenuAcerca = { etiqueta: "Acerca de", ruta: "/acerca", roles: ["administrador", "tecnico"] }`. CA-1 admite ambos roles, así que el ítem también.
5. **Página** (CA-2). `src/app/(tablero)/acerca/page.tsx` es un componente síncrono sin datos de BD que llama al servicio; se renderiza a HTML con `react-dom/server` en Vitest.

## Risks / Trade-offs

- [`route.ts` responde siempre 401 hasta la HU 1b] → Es el comportamiento seguro por defecto; el comportamiento con sesión se prueba en `crearGetAcerca`.
- [Sin contrato OpenAPI] → Fuera de alcance en modo práctica; se agregará cuando exista `contracts/openapi.yaml`.
