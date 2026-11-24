# Design

## Context

Módulo nuevo `notificaciones`, sin tocar el núcleo. Reutiliza `sessionFromRequest`, `requireRole`, `conHttp` y `sesionActual` de `src/lib`. `Sesion.sub` es el `usuarios.id` del técnico. Motivación y alcance: ver proposal.md.

## Goals / Non-Goals

**Goals:** consulta propia ordenada con no leídas; esquema listo para las HU 12 (insertar) y HU 13 (marcar leída).
**Non-Goals:** insertar desde alertas, marcar leída, paginación, tiempo real.

## Decisiones

- **Esquema** `notificaciones` (migración `V202611230100__notificaciones.sql`): `id uuid PK DEFAULT gen_random_uuid()`, `usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE`, `sensor_nombre text NOT NULL`, `magnitud text NOT NULL CHECK (voltaje|corriente|potencia)`, `valor double precision NOT NULL`, `alerta_creada_en timestamptz NOT NULL`, `leida boolean NOT NULL DEFAULT false`, `creada_en timestamptz NOT NULL DEFAULT now()`. Índice `(usuario_id, alerta_creada_en DESC)`. Sin FK a `sensores` (Derivado: decisión #5), sin umbral ni nodo (Derivado: decisión #1) y sin unicidad por alerta.
- **Orden y conteo:** `alerta_creada_en DESC, id DESC`, tope de 100 sin paginación (YAGNI). `noLeidas` se calcula en SQL sobre todas las filas del técnico, no sobre la lista devuelta.
- **Contrato:** `GET /api/notificaciones` → `200 RespuestaNotificaciones`; `401`/`403` con el error JSON estándar. Sin parámetros: el destinatario sale de la sesión (CA-2).
- **Capas:** el SQL solo en `repo.ts`; el handler hace `requireRole(sesion, "tecnico")`; la página llama al servicio con `sesionActual()`, redirige a `/` si el rol no es técnico y resuelve el error con `EstadoError`.
- **UI:** reutiliza `Tarjeta`, `Insignia`, `EstadoVacio`, `EstadoError` y `formato.ts`; sin componente cliente. «No leída» va con `Insignia` (texto, forma y color). El valor usa el formato de su magnitud y la clase `.cifra`. Componente propio `ListaNotificaciones` en `ui/`.
- **Semilla** `db/seed/notificaciones.sql`: 4 filas de `tecnico` con ids fijos `00000000-0000-4000-8000-0000000024NN` (NN = 01 a 04), idempotente (`ON CONFLICT (id) DO NOTHING`).

## Interfaces

- `repo.ts`: `export const MAXIMO_NOTIFICACIONES = 100`; `listarDeUsuario(usuarioId: string): Promise<RespuestaNotificaciones>`.
- `service.ts`: `consultar(usuarioId: string): Promise<RespuestaNotificaciones>` (delega en `repo.listarDeUsuario`).
- `schema.ts` (sin Zod): `Notificacion = { id, sensor, magnitud, valor, fecha (ISO), leida }`; `RespuestaNotificaciones = { notificaciones: Notificacion[], noLeidas: number }`.
- `src/app/api/notificaciones/route.ts`: `export const GET` (`conHttp`), llamado como `GET(req, undefined)`. Sesión de prueba: `firmarSesion({ sub: <usuarios.id>, rol })`, porque `peticion()` de `src/test/api.ts` firma `sub: "prueba-<rol>"` (sirve solo para 401 y 403).
- `menu.ts`: `{ etiqueta: "Notificaciones", href: "/notificaciones", roles: ["tecnico"] }`.
- `ui/ListaNotificaciones.tsx`: `ListaNotificaciones(props: RespuestaNotificaciones)`, export con nombre. `data-testid="notificacion"` en cada fila (con `data-leida`), `data-testid="no-leidas"` con el texto `No leídas: <n>`, insignia con el texto `No leída`, y el estado vacío con el título `No tienes notificaciones`. Valores con `formatoTension`, `formatoCorriente` y `formatoPotencia`.
- Semilla (orden esperado, de más reciente a más antigua): `…2404` Sensor de tensión S1 voltaje 128,9 V; `…2403` Sensor de potencia S3 potencia 2,15 kW (2150 W); `…2402` Sensor de corriente S2 corriente 17,2 A; `…2401` Sensor de tensión S1 voltaje 131,4 V (leída). Las otras tres sin leer.

## Risks / Trade-offs

- [Lista sin paginar] → tope de 100 y `noLeidas` independiente del tope.
- [Las HU 12 y 13 dependen del esquema] → `leida` ya existe y las columnas coinciden con los datos de la alerta.
