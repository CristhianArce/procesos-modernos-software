## Context

La HU 7 (#24) deja la tabla, la consulta y la página del centro de notificaciones. La HU 12 (#44) insertará notificaciones desde las alertas y la HU 13 (#53) las marcará como leídas, así que la tabla ya trae la columna `leida`. La sesión (`sub` = id del usuario, `rol`) y `usuarios` son de la HU 3 y no se modifican. Se sigue el patrón del módulo `alertas` (repo con SQL a mano, servicio, handler con `conHttp`).

## Goals / Non-Goals

**Goals:**
- Guardar notificaciones por destinatario y consultarlas por la API y la página (CA-1, CA-2, CA-3).
- Dejar el esquema listo para las HU 12 y 13 sin tocarlo después.

**Non-Goals:**
- Marcar como leída, crear notificaciones, tiempo real, borrado, preferencias.

## Decisions

- **Esquema (Derivado: decisión #4).** `notificaciones(id uuid pk default gen_random_uuid(), usuario_id uuid not null references usuarios(id) on delete cascade, sensor_nombre text not null, magnitud text not null check in ('voltaje','corriente','potencia'), valor double precision not null, alerta_creada_en timestamptz not null, leida boolean not null default false)`. Sin clave foránea al sensor (RN-5) y sin unicidad por alerta (la HU 12 puede notificar a varios técnicos). Índice `(usuario_id, alerta_creada_en DESC, id DESC)` para la consulta y el conteo.
- **Orden y límite (Derivado: decisión #1, #2).** `ORDER BY alerta_creada_en DESC, id DESC LIMIT 50`; las no leídas se cuentan con una consulta aparte `count(*) FILTER (WHERE NOT leida)` sobre todas las del usuario, en paralelo con la lista.
- **Acceso (Derivado: decisión #3).** El handler hace `sessionFromRequest` y `requireRole(sesion, "tecnico")`: 401 sin sesión, 403 al administrador. El destinatario es `sesion.sub`; el handler no lee parámetros, así que no hay entrada del cliente que validar con Zod.
- **Página.** Server Component que llama a `sesionActual()` y al servicio, sin `fetch` a la API. Si el rol no es técnico, muestra `EstadoError` y no consulta. `loading.tsx` con `Cargando`; el error lo cubre `(tablero)/error.tsx`. La vista es una función síncrona `ListaNotificaciones` que se prueba con `react-dom/server`.
- **Formato.** El valor usa `cifraConUnidad` con la unidad de la magnitud (V, A, W) y la clase `.cifra`; el estado leída o no leída va con texto y forma (`Insignia`), no solo con color.
- **Menú.** `menu.ts` con ítem "Notificaciones", rol `tecnico`, icono genérico.

## Firmas

Respuesta de `GET /api/notificaciones` (200):

```ts
// src/modulos/notificaciones/tipos.ts (sin Zod, importable desde cliente)
import type { Magnitud } from "@/modulos/alertas/magnitudes";
export type Notificacion = {
  id: string;
  sensor: string;        // copia del nombre
  magnitud: Magnitud;
  valor: number;
  fecha: string;         // ISO 8601 de la alerta
  leida: boolean;
};
export type CentroNotificaciones = { notificaciones: Notificacion[]; noLeidas: number };
export const LIMITE_NOTIFICACIONES = 50;
```

Repo (`src/modulos/notificaciones/repo.ts`, con `import "server-only"`):

```ts
export async function listarDeUsuario(usuarioId: string, limite: number): Promise<Notificacion[]>;
export async function contarNoLeidas(usuarioId: string): Promise<number>;
```

Servicio (`src/modulos/notificaciones/service.ts`):

```ts
export async function consultarNotificaciones(usuarioId: string): Promise<CentroNotificaciones>;
```

Handler: `export const GET = conHttp("/api/notificaciones", async (req) => ...)` en `src/app/api/notificaciones/route.ts`, con `export const dynamic = "force-dynamic"`.

Componente (`src/modulos/notificaciones/ui/ListaNotificaciones.tsx`, síncrono):

```ts
type Props = { notificaciones: Notificacion[]; noLeidas: number };
export function ListaNotificaciones(props: Props): JSX.Element;
```

`data-testid`: `no-leidas` (el número), `notificacion` (cada fila, en orden) y `notificaciones-vacio` (estado vacío). Etiquetas: título "Notificaciones", texto "<n> sin leer", insignias "Leída" y "Sin leer". Mensaje del administrador: "El centro de notificaciones es solo para técnicos".

## Contrato

Se agrega a `contracts/openapi.yaml` `GET /api/notificaciones` con respuestas 200 (`CentroNotificaciones`), 401 y 403 (el esquema de error JSON existente), conservando las rutas de las demás historias.

## Migración y semilla

`db/migration/V202611242000__notificaciones.sql`: solo hacia adelante, no modifica tablas ajenas. `db/seed/notificaciones.sql`: 4 notificaciones del usuario `tecnico` (2 leídas y 2 no leídas, fechas distintas) con ids fijos e `ON CONFLICT (id) DO NOTHING`, de modo que aplicarla otra vez no duplica.

## Risks / Trade-offs

- [El conteo y la lista salen de dos consultas] → pueden diferir si entra una notificación entre ambas; aceptable porque la lista se actualiza al recargar (RN-6).
- [Sin clave foránea al sensor] → el nombre puede repetirse entre sensores; la notificación no pretende identificarlo (HU 4, decisión 8).
- [Se borra el usuario] → la cascada elimina sus notificaciones; no hay borrado de usuarios en el alcance actual.
