# Design

## Context

La HU 7 (#24) dejó en `src/modulos/notificaciones/` lo siguiente:
- en `repo.ts`: `recientesDe`, `contarNoLeidas`, `insertar` y el tipo `Notificacion`;
- en `service.ts`: `consultarNotificaciones` y el tipo `CentroNotificaciones`;
- en `ui/`: el componente de servidor `ListaNotificaciones`;
- la página `src/app/(tablero)/notificaciones/page.tsx`, que esta historia no edita (decisión #4);
- el handler `GET /api/notificaciones`.

La tabla `notificaciones` (`id uuid`, `destinatario_id`, `sensor`, `magnitud`, `valor`, `creada_en`, `leida boolean`) ya tiene la columna que se escribe. El motivo está en proposal.md, en «Why».

## Goals / Non-Goals

**Goals:**
- Una sola sentencia SQL marca la notificación y comprueba el destinatario al mismo tiempo, así no hay una lectura previa que pueda quedar desactualizada.
- La UI reutiliza el patrón de `ControlAislamiento`: `fetch` a la API, `router.refresh()` y el error con `role="alert"`.

**Non-Goals:**
- Desmarcar una notificación, marcar varias a la vez o actualizar en tiempo real (fuera de alcance del issue).
- Migración, semilla o cambios a la tabla.

## Decisions

1. **`UPDATE … WHERE id = $1 AND destinatario_id = $2 RETURNING`** (CA-1, CA-2; RN-1, RN-4). Cuando no se actualiza ninguna fila, la notificación es ajena o no existe, y las dos responden el mismo 404, así que no se revela que existe. `SET leida = true` es idempotente: una ya leída devuelve su fila sin cambiar nada. Se descartó leer primero y luego actualizar: son dos consultas y queda una carrera entre ellas.
2. **Sin cuerpo, respuesta 200 con la notificación** (Derivado: decisión #1). El handler no lee `req.json()`. Se descartó `{ leida: boolean }` porque permitiría desmarcar, que está fuera de alcance.
3. **Orden en el handler: sesión, luego rol, luego id** (CA-3, CA-4; Derivado: decisión #2). Es el mismo orden que `/api/aislamiento/nodos/[id]`. Un id mal formado de un visitante responde 401 y uno de un administrador, 403.
4. **El id se valida con `z.guid()`** (CA-4). Acepta cualquier UUID con el formato `8-4-4-4-12` hexadecimal que Postgres guarda, también los de prueba que no son v4. Así un UUID válido que no existe llega al repo y responde 404 (CA-2), no 400. Se descartó `z.uuid()` de Zod 4: exige versión y variante RFC y devolvería 400 con UUID que Postgres sí acepta.
5. **Botón en un componente cliente propio** (Derivado: decisión #3, #4). `BotonMarcarLeida` se renderiza dentro de cada `<li>` sin leer de `ListaNotificaciones`, que sigue siendo un componente de servidor. No hay confirmación porque la acción no es destructiva. Mientras envía, el botón queda deshabilitado con el texto «Marcando…».
6. **Prueba de la lista de la HU 7** (Derivado: decisión #6). `BotonMarcarLeida` usa `useRouter`, que lanza un error fuera del App Router. Por eso `lista-notificaciones.test.ts` agrega `vi.mock("next/navigation")` y conserva sus aserciones.
7. **E2E con datos propios** (Derivado: decisión #5). La prueba inserta con `pg` una notificación de `tecnico` con un sensor único y la borra en `afterEach`, también si la prueba falla. Las notificaciones de la semilla no se tocan.

## Firmas

```ts
// src/modulos/notificaciones/repo.ts (se agrega)
export async function marcarLeida(id: string, destinatarioId: string): Promise<Notificacion | null>;

// src/modulos/notificaciones/service.ts (se agrega)
export const NOTIFICACION_NO_ENCONTRADA = "Notificación no encontrada";
export async function marcarComoLeida(id: string, destinatarioId: string): Promise<Notificacion>; // lanza ErrorHttp(404, NOTIFICACION_NO_ENCONTRADA) si el repo devuelve null

// src/modulos/notificaciones/schema.ts (nuevo; sin uso en componentes cliente)
export const idNotificacionSchema: z.ZodObject<{ id: z.ZodGUID }>; // z.object({ id: z.guid() })

// src/app/api/notificaciones/[id]/route.ts (nuevo)
export const PATCH: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
// conHttp("/api/notificaciones/[id]"): requireRole(await sessionFromRequest(req), "tecnico") → idNotificacionSchema.parse({ id }) → marcarComoLeida(id, sesion.sub)

// src/modulos/notificaciones/ui/BotonMarcarLeida.tsx (nuevo, "use client")
export function BotonMarcarLeida(props: { id: string }): JSX.Element;
// fetch(`/api/notificaciones/${id}`, { method: "PATCH" }); 200 → router.refresh(); fallo → mensaje en role="alert"
```

Respuestas de la API:
- **200:** `Notificacion` (`{ id, sensor, magnitud, valor, creadaEn, leida: true }`).
- **400:** `{ error: "Datos inválidos", detalles: [{ campo: "id", mensaje }] }`.
- **401 y 403:** `{ error }`, del núcleo.
- **404:** `{ error: "Notificación no encontrada" }`.

Interfaz:
- **`ListaNotificaciones`:** conserva sus props (`CentroNotificaciones`), sus `data-testid` (`no-leidas`, `sin-notificaciones`, `notificacion`) y sus textos. Solo agrega `<BotonMarcarLeida id={n.id} />` en cada fila con `leida: false`.
- **`BotonMarcarLeida`:** `<button type="button" data-testid="marcar-leida" class="boton-fantasma">`. El error es `<p role="alert" data-testid="error-marcar" class="text-sm text-critico">`.

## Textos visibles

- Botón: «Marcar como leída». Mientras envía: «Marcando…» (deshabilitado).
- Error de la API: el `error` del cuerpo JSON (por ejemplo, «Notificación no encontrada»). Si no trae `error`, se muestra «No se pudo marcar la notificación.». Si no hay conexión, «No se pudo conectar con el servidor.».
- Sin cambios respecto de la HU 7:
  - el contador «N sin leer»;
  - las insignias «Sin leer» y «Leída»;
  - el estado vacío «No tienes notificaciones»;
  - el formato de valores con `cifraConUnidad`, que muestra la unidad;
  - las fechas con `formatearFecha`, en es-CO y zona `America/Bogota`.

## Componentes de interfaz

- **Reutiliza** `Tarjeta`, `Insignia` y `EstadoVacio` (vía `ListaNotificaciones`) y las clases `.boton-fantasma` y `text-critico` (tokens `--sc-*`). No usa colores hex ni la paleta de Tailwind.
- **Nuevo:** `BotonMarcarLeida`, propio del módulo, en `src/modulos/notificaciones/ui/`.
- **Carga, error y vacío:**
  - La carga de la página es `loading.tsx` con `Cargando`, de la HU 7. La carga del botón es «Marcando…» con el botón deshabilitado.
  - Los errores de la página los cubre `(tablero)/error.tsx`. Un error del marcado es la alerta de la fila.
  - El vacío es `EstadoVacio`, de la HU 7.
- **Estado y accesibilidad:**
  - El estado se lee con el texto de la insignia, no solo con el color.
  - El botón tiene texto propio, se usa con teclado y muestra foco visible con el estilo de `.boton-fantasma`.
  - No hay animaciones nuevas.

## Risks / Trade-offs

- **Un técnico marca dos veces seguidas** → idempotente: la segunda llamada responde 200 sin cambios (RN-4).
- **El contador de una página ya abierta queda desactualizado si llegan notificaciones nuevas** → aceptado. La lista se actualiza al recargar o navegar (RN-3).
- **La prueba e2e escribe en la BD de prueba** → solo la BD aislada del CI, con un sensor único que se borra en `afterEach`. Nunca toca una BD compartida.
