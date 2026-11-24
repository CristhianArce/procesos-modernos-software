# Proposal

## Why

La HU 7 (#24) dejó el centro de notificaciones de solo lectura: el técnico ve cuántas tiene sin leer, pero no puede indicar cuáles ya atendió, así que el contador nunca baja. La HU 13 (#53) agrega el marcado como leída, una por una, sin exponer las notificaciones de otros técnicos (CA-1 a CA-4).

## What Changes

- Nuevo endpoint `PATCH /api/notificaciones/{id}`, solo para técnicos, que marca como leída una notificación del técnico de la sesión y responde 200 con la notificación (CA-1; Derivado: decisión #1). Marcar una ya leída no cambia nada y tampoco es error (RN-4).
- Una notificación de otro técnico, o un UUID que no existe, responde 404 sin cambiar nada (CA-2). Sin sesión responde 401 en JSON (CA-3) y un administrador recibe 403 (RN-2; Derivado: decisión #2). Un id que no es UUID responde 400 por Zod (CA-4).
- Botón «Marcar como leída» en cada notificación sin leer del centro. Al terminar, el centro se vuelve a leer del servidor (CA-1; RN-3; Derivado: decisión #3, #4). La página de la HU 7 no se edita.
- `contracts/openapi.yaml` agrega la ruta `/api/notificaciones/{id}` y conserva las demás.
- Sin migración ni semilla: se escribe la columna `leida` de la tabla `notificaciones` de la HU 7.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `centro-de-notificaciones`: agrega requisitos para marcar una notificación como leída por la API y desde el centro, con aislamiento entre técnicos, acceso solo de técnicos y validación del id (CA-1, CA-2, CA-3, CA-4). Los requisitos existentes de la HU 7 no cambian.

## Impact

- Código: `src/modulos/notificaciones/` (`repo.ts`, `service.ts`, nuevo `schema.ts`, nuevo `ui/BotonMarcarLeida.tsx` y `ui/ListaNotificaciones.tsx`), nuevo `src/app/api/notificaciones/[id]/route.ts`.
- Contrato: `contracts/openapi.yaml` (nueva ruta `PATCH`).
- Datos: escribe `notificaciones.leida`; ninguna tabla nueva ni modificada.
- Pruebas: unitarias (service, schema, botón y lista), de integración (handler con `Request`) y una e2e nueva.
- Dependencias: ninguna librería nueva.
