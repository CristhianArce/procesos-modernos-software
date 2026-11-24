# Design

## Context

Ver proposal.md (Why). Hoy existen `usuarios` (HU 3, con `id uuid`), la sesión `{ sub, rol }` (`sub` es el id del usuario), `conHttp`, `sessionFromRequest` y `requireRole`. Los módulos se registran con `menu.ts`. La HU 12 insertará notificaciones y la HU 13 las marcará leídas: la tabla ya trae la columna `leida` y no impone unicidad por alerta (issue #24, notas técnicas).

## Goals / Non-Goals

**Goals:**
- Tabla, consulta, endpoint y página del centro, con el destinatario tomado siempre de la sesión (CA-1, CA-2, CA-3).

**Non-Goals:**
- Crear notificaciones, marcarlas leídas, borrarlas, paginar, actualizar en vivo o mostrar umbral y nodo.

## Decisions

- **Tabla propia sin clave al sensor.** `notificaciones(id uuid PK default gen_random_uuid(), destinatario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, sensor text NOT NULL, magnitud text NOT NULL CHECK (voltaje|corriente|potencia), valor double precision NOT NULL, creada_en timestamptz NOT NULL, leida boolean NOT NULL DEFAULT false)`. El sensor es una copia del nombre (RN-5); la fecha es la de la alerta, sin default, porque la fija quien crea la notificación (RN-2). Índice `(destinatario_id, creada_en DESC)` para la consulta. Alternativa descartada: clave foránea a `sensores`, que ataría la historia a la HU 4 y borraría la notificación con el sensor.
- **Una consulta, dos datos.** El repo trae las 50 más recientes (`ORDER BY creada_en DESC, id DESC LIMIT 50`) y el conteo de no leídas del destinatario en otra consulta, en paralelo; el servicio las junta (decisiones #1, #2).
- **Destinatario de la sesión.** El handler pasa `sesion.sub` al servicio; no lee parámetros de consulta, así que `?destinatarioId=` se ignora (CA-2, RN-3). No hay esquema Zod de entrada porque el endpoint no recibe datos del cliente.
- **Solo técnicos.** `requireRole(sesion, "tecnico")`: 401 sin sesión, 403 a un administrador (CA-3, RN-4, decisión #3). La página, un Server Component, lee `sesionActual()`; si el rol no es técnico hace `redirect("/")`, y llama al servicio, nunca a la API (CLAUDE.md §4).
- **Interfaz sin cliente.** La página es de servidor y no se actualiza sola (RN-6); la lista es un componente síncrono, `ListaNotificaciones`, que recibe los datos por props y se prueba con `react-dom/server`. Estado de error: lo cubre `src/app/(tablero)/error.tsx`; carga: `loading.tsx` con `Cargando`.
- **Semilla idempotente.** `db/seed/notificaciones.sql` inserta con ids fijos y `ON CONFLICT (id) DO NOTHING`, fechas `now() - interval`, para el usuario `tecnico` leído por `nombre_usuario` (decisión #4).
- **Menú.** `menu.ts` exporta «Notificaciones», `/notificaciones`, `roles: ["tecnico"]`, orden 30.

## Componentes de `src/modulos/ui/`

Reutiliza `Tarjeta`, `Insignia` (tono `acento` para «Sin leer» y `neutro` para «Leída»: texto y forma, no solo color), `EstadoVacio` y `Cargando`; usa `cifraConUnidad` de `ui/formato.ts` con la clase `.cifra` y `formatearFecha` de `dashboard/formato.ts`. No agrega componentes reutilizables nuevos; `ListaNotificaciones` es propio del módulo.

## Firmas

Repo (`src/modulos/notificaciones/repo.ts`, con `import "server-only"`):

```ts
export type Notificacion = {
  id: string;
  sensor: string;
  magnitud: Magnitud; // de "@/modulos/alertas/magnitudes"
  valor: number;
  creadaEn: string; // ISO
  leida: boolean;
};
export type NotificacionNueva = Omit<Notificacion, "id" | "leida"> & { destinatarioId: string; leida?: boolean };
export const LIMITE_NOTIFICACIONES = 50;
export function recientesDe(destinatarioId: string): Promise<Notificacion[]>; // más reciente primero, máx. 50
export function contarNoLeidas(destinatarioId: string): Promise<number>;
export function insertar(nueva: NotificacionNueva): Promise<Notificacion>; // solo para pruebas y la HU 12; sin consumidor en esta historia
```

Servicio (`service.ts`, `import "server-only"`):

```ts
export type CentroNotificaciones = { noLeidas: number; notificaciones: Notificacion[] };
export function consultarNotificaciones(destinatarioId: string): Promise<CentroNotificaciones>;
```

API: `GET /api/notificaciones` → 200 `CentroNotificaciones` (`{ noLeidas, notificaciones: [{ id, sensor, magnitud, valor, creadaEn, leida }] }`); 401 `{ error: "No autenticado" }`; 403 `{ error: "Sin permiso" }`. Handler en `src/app/api/notificaciones/route.ts`: `export const GET = conHttp("/api/notificaciones", ...)` y `export const dynamic = "force-dynamic"`.

Interfaz:

```ts
// src/modulos/notificaciones/ui/ListaNotificaciones.tsx (síncrono, sin "use client")
export function ListaNotificaciones(props: CentroNotificaciones): JSX.Element;
```

- `data-testid="no-leidas"`: contador, con el texto «N sin leer».
- `data-testid="notificacion"`: un `<li>` por notificación, en orden; contiene sensor, magnitud, valor, fecha y estado.
- `data-testid="sin-notificaciones"`: contenedor del estado vacío.
- Página: `src/app/(tablero)/notificaciones/page.tsx` (`dynamic = "force-dynamic"`) y `loading.tsx`.
- Menú: `src/modulos/notificaciones/menu.ts` exporta `menu: ItemMenu`.

Migración: `db/migration/V202611241000__notificaciones.sql`. Semilla: `db/seed/notificaciones.sql`.

Semilla de `tecnico` (de la más reciente a la más antigua; todas con sensor «Transformador principal»): voltaje 131,5 (sin leer, hace 5 min), corriente 12,8 (sin leer, 30 min), potencia 1650 (sin leer, 2 h), voltaje 128,2 (leída, 1 día), corriente 11,4 (leída, 2 días). Son 5 notificaciones y 3 sin leer; `admin` no tiene ninguna. Los ids van de `7a1c0001-0000-4000-8000-000000000001` a `...0005` (del más reciente al más antiguo). Otras pruebas pueden agregar notificaciones a `tecnico`, así que una prueba que lee la semilla filtra por esos ids.

## Textos visibles

- Título de la página: «Notificaciones»; subtítulo: «Avisos de alertas que tienes pendientes de atender.».
- Título de la tarjeta de la lista: «Tus notificaciones».
- Contador (en el encabezado de la tarjeta): «3 sin leer» (también «0 sin leer» y «1 sin leer»).
- Cada notificación, en una línea de texto: `<sensor>` en negrita, la magnitud en minúscula (`voltaje`, `corriente` o `potencia`), el valor con unidad y coma decimal (`130 V`, `9,8 A`, `1.250 W`), la fecha de `formatearFecha` (es-CO, hora de Bogotá, p. ej. `22/11/26, 10:30:05`) y la insignia «Sin leer» o «Leída».
- Estado vacío: título «No tienes notificaciones», texto «Cuando una alerta te avise, aparecerá aquí.».
- Entrada del menú: «Notificaciones».
- Error de carga: el de `(tablero)/error.tsx`; carga: `Cargando`.

## Risks / Trade-offs

- [El técnico con más de 50 notificaciones no ve las antiguas] → El contador de no leídas cuenta todas; la paginación queda fuera de alcance (decisión #1).
- [`insertar` del repo no tiene consumidor en producción] → Lo usan las pruebas de integración y lo usará la HU 12; es la única forma de crear el segundo técnico y sus notificaciones sin tocar la semilla de la HU 3.
- [Dos técnicos en la semilla de la HU 3: solo hay uno] → Las pruebas de integración de CA-2 crean el segundo técnico y lo eliminan al terminar.
