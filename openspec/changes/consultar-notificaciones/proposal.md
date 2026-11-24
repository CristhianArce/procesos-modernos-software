# Proposal

## Why

Los técnicos necesitan ver en un solo lugar qué avisos tienen pendientes de atender. Las HU 12 (crear notificaciones a partir de alertas) y 13 (marcar como leída) dependen de que exista antes la tabla, la consulta y la página del centro de notificaciones (issue #24, CA-1, CA-2, CA-3).

## What Changes

- Tabla propia `notificaciones` (migración Flyway) con un solo destinatario por fila, copia del nombre del sensor, magnitud, valor, fecha de la alerta y la marca de leída (RN-1, RN-2, RN-5; CA-1).
- Semilla `db/seed/notificaciones.sql` con notificaciones leídas y no leídas para la cuenta `tecnico` (CA-1).
- `GET /api/notificaciones`: lista de las notificaciones de la sesión, la más reciente primero, y el número de no leídas; 401 en JSON sin sesión y 403 para un administrador (CA-1, CA-2, CA-3; RN-3, RN-4).
- Página `/notificaciones` (centro de notificaciones) y entrada «Notificaciones» del menú solo para técnicos, vía `menu.ts` (CA-1; RN-4, RN-6).
- Rutas nuevas en `contracts/openapi.yaml`.
- No se crean notificaciones desde alertas reales (HU 12), no se marcan como leídas (HU 13) y no se usa `on-alerta.ts`.

## Capabilities

### New Capabilities
- `centro-de-notificaciones`: consulta por parte de cada técnico de sus propias notificaciones, con orden, número de no leídas, aislamiento entre técnicos y acceso restringido por sesión y rol.

### Modified Capabilities

(ninguna: la HU solo lee `usuarios` y no cambia ninguna capacidad existente)

## Impact

- Código nuevo: `src/modulos/notificaciones/{service,repo,menu}.ts` con `ui/` y `__tests__/`, `src/app/api/notificaciones/route.ts` y `src/app/(tablero)/notificaciones/{page,loading}.tsx`.
- Datos: migración `db/migration/V202611241000__notificaciones.sql` y semilla `db/seed/notificaciones.sql`; lee `usuarios` sin modificarla.
- Contrato: `contracts/openapi.yaml` (ruta y esquemas nuevos, conservando los existentes).
- Sin dependencias nuevas ni cambios en el núcleo (`proxy.ts`, `src/lib/`, shell).
