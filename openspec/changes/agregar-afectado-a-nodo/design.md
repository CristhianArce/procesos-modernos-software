# Design

## Context

La HU 8 (#25), que debía crear la tabla `nodo_usuarios`, el módulo `afectados` y su panel de solo lectura, no está fusionada: ni la tabla ni el módulo existen (ver `contexto.md`). La persona decidió que esta historia cree lo mínimo (decisión #2). Del repo se reutilizan: la tabla `nodos` (HU 4), `obtenerNodo` del servicio de `nodos` (404 `Nodo no encontrado`), `sessionFromRequest`, `requireRole`, `sesionActual` y `conHttp` del núcleo, `enviarJson` de `nodos/ui` (lo usa ya `FormularioSensor`) y el registro de paneles (`Sensores` 10, `Simulador` 20, `Aislamiento` 30). Ver `proposal.md` para el motivo.

## Goals / Non-Goals

**Goals:**
- Que un administrador agregue un alias afectado a un nodo desde su ficha y lo vea en la lista con el total actualizado.
- Que el técnico vea la lista pero no pueda agregar ni por la interfaz ni por la API.

**Non-Goals:**
- Quitar afectados (HU 15), un `GET /api/afectados` (HU 8), notificaciones, unicidad del alias, importar o calcular afectados.
- Editar el núcleo, la página de la ficha o el módulo `nodos`.

## Decisions

1. **Tabla propia `nodo_usuarios`** (decisión #2). `id uuid PK DEFAULT gen_random_uuid()`, `nodo_id uuid NOT NULL REFERENCES nodos (id) ON DELETE CASCADE` (decisión 5 de la HU 4), `alias text NOT NULL CHECK (char_length(alias) BETWEEN 1 AND 100)`, `creado_en timestamptz NOT NULL DEFAULT now()` e índice por `nodo_id`. Sin índice único (RN-4). Migración `V202611240600__nodo_usuarios.sql`, sin semilla (decisión #4). Se usa el nombre `nodo_usuarios` que fija el issue para que la HU 8 lo reutilice.
2. **`POST /api/afectados` con el nodo en el cuerpo** (decisión #3), como `POST /api/sensores`. Orden en el handler: `requireRole(sesion, "administrador")` (401/403 aunque el cuerpo sea inválido: CA-4), luego Zod con `req.json().catch(() => undefined)` (400: CA-2) y luego el servicio (404: CA-3). Responde 201 con el afectado.
3. **Validación** (decisión #1). `afectadoCrearSchema = z.object({ nodoId: z.guid(), alias: z.string().trim().min(1).max(100) })`. Un `nodoId` mal formado es 400 (como `sensores`); un UUID sin nodo es 404.
4. **Servicio fino.** `agregarAfectado` llama a `obtenerNodo(nodoId)` (lanza 404) antes de `repo.crear`, así un nodo inexistente no guarda nada. `listarAfectados(nodoId)` devuelve los afectados del nodo en orden de alta para el panel.
5. **Panel por `paneles.ts`** (RN-2). `paneles = [{ titulo: "Afectados", orden: 40, Componente: PanelAfectados }]`. `PanelAfectados` es un Server Component: lee `sesionActual()` y `listarAfectados(nodoId)` del servicio (nunca `fetch` a la propia API), muestra el total (`data-testid="total-afectados"`), la lista (`data-testid="lista-afectados"`) o `EstadoVacio` si no hay, y solo al administrador `FormularioAfectado`. Ocultar el formulario es cosmético: la API exige el rol.
6. **Formulario cliente.** `FormularioAfectado` (Client Component) envía con `enviarJson("/api/afectados", { nodoId, alias })`, muestra el error en `role="alert"`, limpia el campo y hace `router.refresh()` para que el panel vuelva a leer la lista y el total sin recargar. Campo `alias` con etiqueta visible, `required` y `maxLength={100}`; botón «Agregar afectado». No importa Zod.
7. **Contrato.** `contracts/openapi.yaml` suma `POST /api/afectados` con `security: sesion`, cuerpo `AfectadoCrear`, respuesta 201 `Afectado` y las respuestas compartidas 400, 401, 403 y 404, conservando las demás rutas.

## Interfaces

```ts
// src/modulos/afectados/schema.ts
export const afectadoCrearSchema: z.ZodObject<{ nodoId: z.ZodGUID; alias: z.ZodString }>;
export type AfectadoCrear = { nodoId: string; alias: string };

// src/modulos/afectados/repo.ts (import "server-only")
export type Afectado = { id: string; nodoId: string; alias: string; creadoEn: string };
export function crear(entrada: AfectadoCrear): Promise<Afectado>;
export function listarPorNodo(nodoId: string): Promise<Afectado[]>; // ORDER BY creado_en, id

// src/modulos/afectados/service.ts (import "server-only")
export function agregarAfectado(entrada: AfectadoCrear): Promise<Afectado>; // 404 "Nodo no encontrado" vía obtenerNodo
export function listarAfectados(nodoId: string): Promise<Afectado[]>;

// src/app/api/afectados/route.ts
export const POST: (req: Request) => Promise<Response>; // 201 Afectado | 400 | 401 | 403 | 404

// src/modulos/afectados/paneles.ts
export const paneles: Panel[]; // [{ titulo: "Afectados", orden: 40, Componente: PanelAfectados }]

// src/modulos/afectados/ui/PanelAfectados.tsx (Server Component)
export function PanelAfectados(props: { nodoId: string }): Promise<JSX.Element>;

// src/modulos/afectados/ui/FormularioAfectado.tsx ("use client")
export function FormularioAfectado(props: { nodoId: string }): JSX.Element;
// campo: <input name="alias" aria-label/label "Alias">, botón «Agregar afectado», error en role="alert"
```

## Risks / Trade-offs

- [La HU 8 se fusiona después con su propia tabla o módulo] → la HU 8 debe reutilizar `nodo_usuarios` y `src/modulos/afectados/`; queda como decisión por revisar (#2).
- [El técnico no ve el formulario, pero un cliente HTTP puede llamar a la API] → la API exige el rol (403).
- [Alias duplicados en un nodo] → permitido por RN-4.
- [Las pruebas de integración y e2e comparten la base] → cada prueba crea su propio nodo con nombre único y lo borra al terminar (el borrado en cascada elimina sus afectados).

## Migration Plan

Una migración nueva, solo hacia adelante y compatible hacia atrás (tabla nueva). Sin semilla. Reversa: retirar la imagen; la tabla queda sin uso.
