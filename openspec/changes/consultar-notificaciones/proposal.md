# Proposal

## Why

Los técnicos necesitan un lugar donde ver qué avisos tienen pendientes de atender (issue #24, historia HU 7). Hoy una alerta se registra y solo se ve en el dashboard; no hay forma de que un aviso quede dirigido a un técnico concreto. Esta historia deja la base: la tabla de notificaciones, su consulta propia y la página del centro de notificaciones. Crear las notificaciones a partir de alertas reales (HU 12) y marcarlas como leídas (HU 13) se apoyan en esta base.

## What Changes

- Tabla nueva `notificaciones` (migración Flyway) con un solo destinatario por fila, una copia del nombre del sensor, la magnitud, el valor, la fecha de la alerta y si fue leída. Sin clave foránea a `sensores` ni columnas de umbral o nodo (CA-1; Derivado: decisión #1; Derivado: decisión #5).
- Semilla `db/seed/notificaciones.sql` con notificaciones leídas y no leídas para la cuenta `tecnico` (CA-1).
- Módulo `src/modulos/notificaciones/` con `schema`, `service`, `repo` y `menu.ts` (CA-1, CA-2).
- Endpoint `GET /api/notificaciones`: devuelve la lista del técnico de la sesión, de la más reciente a la más antigua, y el número de no leídas. El destinatario sale de la sesión, nunca del cliente (CA-1, CA-2). Sin sesión responde 401 en JSON (CA-3) y a un administrador le responde 403 (Derivado: decisión #4).
- Página `/notificaciones` (centro de notificaciones) que lee del servicio, con estados de error y vacío (no hay estado de carga: es un Server Component sin componente cliente, la respuesta llega ya renderizada); se actualiza al recargar o navegar (CA-1; Derivado: decisión #3).
- Ítem de menú solo para técnicos mediante `menu.ts` (CA-1; Derivado: decisión #4).
- Rutas nuevas en `contracts/openapi.yaml` conservando las existentes.
- Fuera de alcance: marcar como leída, crear notificaciones desde alertas, correo/SMS/push, tiempo real, borrar, "marcar todas" (Derivado: decisión #2).

## Capabilities

### New Capabilities

- `centro-notificaciones`: consulta de las notificaciones propias de un técnico, con la más reciente primero y el número de no leídas, aisladas entre técnicos y solo para técnicos autenticados.

### Modified Capabilities

(ninguna; no cambia el comportamiento de `acceso-tablero`, `inicio-de-sesion` ni `extension-modulos`)

## Impact

- Código nuevo: `src/modulos/notificaciones/**`, `src/app/(tablero)/notificaciones/page.tsx`, `src/app/api/notificaciones/route.ts`.
- Base de datos: migración `V<AAAAMMDDHHmm>__notificaciones.sql` y semilla `db/seed/notificaciones.sql`. Lee `usuarios` sin modificarla.
- Contrato: `contracts/openapi.yaml` (ruta `/api/notificaciones`).
- Sin dependencias nuevas ni cambios al núcleo (`proxy.ts`, `src/lib/`, layout, `src/shell/`).
