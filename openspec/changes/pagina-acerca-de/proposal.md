# Proposal

## Why

Los usuarios del tablero (administradores y técnicos) no tienen a mano el nombre ni la versión de la app que están usando (issue #6). Además, esta historia de práctica sirve para probar el orquestador con un módulo autocontenido que solo usa los puntos de extensión.

## What Changes

- Nuevo módulo `src/modulos/acerca/` con el contenido fijo en código (nombre y versión), sin BD (RN-1).
- Nuevo endpoint `GET /api/acerca`: 200 con `{ nombre, version }` para un usuario autenticado con rol administrador o técnico (CA-1) y 401 con JSON de error sin sesión (CA-3).
- Nueva página `/acerca` que muestra el nombre y la versión (CA-2).
- Nuevo ítem "Acerca de" en el menú mediante `src/modulos/acerca/menu.ts` (CA-2).
- Modo práctica: se crea un `package.json` mínimo (TypeScript, Vitest, React, Zod) para poder correr `typecheck` y `test:unit`. El núcleo de la HU 1b (`src/lib/http.ts`, sesión, `proxy.ts`, layout), el contrato `contracts/openapi.yaml`, la BD y las pruebas de integración/e2e quedan fuera de alcance.

## Capabilities

### New Capabilities
- `acerca-de`: información fija de la app (nombre y versión) expuesta por API a usuarios autenticados, página que la muestra e ítem de menú que lleva a ella.

### Modified Capabilities
- (ninguna)

## Impact

- Código nuevo: `src/modulos/acerca/{schema,service,handler,menu}.ts`, `src/modulos/acerca/__tests__/`, `src/app/api/acerca/route.ts`, `src/app/(tablero)/acerca/page.tsx`.
- Herramientas nuevas: `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`.
- Sin tablas, sin migración y sin semilla (RN-1). Sin cambios en el núcleo.
