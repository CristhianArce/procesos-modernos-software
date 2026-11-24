# Proposal

## Why

Un técnico necesita saber qué avisos tiene pendientes de atender. Hoy no existe dónde guardarlos ni dónde verlos: la HU 12 (#44) creará las notificaciones a partir de las alertas y la HU 13 (#53) las marcará como leídas, y ambas dependen de la tabla y de la consulta que esta historia (#24) deja listas (CA-1, CA-2, CA-3).

## What Changes

- Tabla propia `notificaciones` con migración Flyway: un solo destinatario por fila, copia del nombre del sensor, magnitud, valor, fecha de la alerta y si fue leída (CA-1; RN-2, RN-5; Derivado: decisión #4).
- Semilla `db/seed/notificaciones.sql` con notificaciones leídas y no leídas para la cuenta `tecnico` (CA-1).
- `GET /api/notificaciones`: lista las 50 notificaciones más recientes del técnico de la sesión, con desempate por id descendente, y el número de no leídas sobre el total (CA-1; Derivado: decisión #1, #2).
- La API toma el destinatario de la sesión, nunca del cliente; un técnico no ve las de otro (CA-2; RN-3) y un visitante sin sesión recibe 401 en JSON (CA-3). Un administrador recibe 403 (RN-4; Derivado: decisión #3).
- Página `/notificaciones` (centro de notificaciones) y entrada de menú solo para técnicos (CA-1; RN-4, RN-6).
- Se agregan la ruta y sus esquemas a `contracts/openapi.yaml`.

Fuera de alcance: marcar como leída (HU 13), crear notificaciones desde alertas (HU 12), correo, SMS, push, tiempo real, preferencias y borrado.

## Capabilities

### New Capabilities
- `centro-de-notificaciones`: guarda las notificaciones de cada técnico y las deja consultar por la API y por la página del centro, con la más reciente primero, el número de no leídas, aislamiento entre técnicos y acceso solo con sesión de técnico.

### Modified Capabilities

## Impact

- Código nuevo: `src/modulos/notificaciones/` (`repo.ts`, `service.ts`, `tipos.ts`, `menu.ts`, `ui/`), `src/app/api/notificaciones/route.ts` y `src/app/(tablero)/notificaciones/` (`page.tsx`, `loading.tsx`).
- Datos: migración `V202611242000__notificaciones.sql` y semilla `db/seed/notificaciones.sql`. Lee `usuarios` sin modificarla.
- Contrato: `contracts/openapi.yaml` (ruta nueva).
- Sin dependencias nuevas ni cambios al núcleo.
