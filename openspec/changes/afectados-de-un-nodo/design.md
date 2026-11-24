# Design

## Context

La tabla `nodos(id, nombre, ubicacion, estado, creado_en)` y su ficha (`src/app/(tablero)/nodos/[id]/page.tsx`) vienen de la HU 4. La ficha pinta los paneles de `registro.paneles` (`Sensores` orden 10, `Simulador` orden 20, `Aislamiento` orden 30). El núcleo ofrece `sessionFromRequest`, `requireRole`, `ROLES`, `conHttp` y `ErrorHttp`; el módulo `nodos` ofrece `obtenerNodo` (404 `Nodo no encontrado`, también para un id que no es UUID) y `esUuid`. `scripts/seed.mjs` aplica `db/seed/*.sql` en orden alfabético. Ver `proposal.md` para el motivo.

## Goals / Non-Goals

**Goals:**
- Guardar afectados (alias ficticios) por nodo en una tabla propia.
- Consultarlos por la API (administrador y técnico) con su total, y mostrarlos en un panel de la ficha.

**Non-Goals:**
- Crear o quitar afectados (HU 14 y 15), notificarlos, calcularlos desde la topología, importarlos o evitar duplicados.
- Editar el módulo `nodos`, la página de la ficha o el núcleo.

## Decisions

1. **Tabla propia `nodo_usuarios`** (RN-1, RN-3, RN-4; Derivado: decisión #2). `id uuid PK DEFAULT gen_random_uuid()`, `nodo_id uuid NOT NULL REFERENCES nodos (id) ON DELETE CASCADE`, `alias text NOT NULL CHECK (char_length(btrim(alias)) BETWEEN 1 AND 100)`, `creado_en timestamptz NOT NULL DEFAULT now()`, e índice `nodo_usuarios_nodo_idx (nodo_id, creado_en, id)`. Sin unicidad del alias. El borrado en cascada deja que la HU 4 elimine un nodo sin fallar ni dejar huérfanos. No se toca `nodos`.
2. **Orden de creación** (Derivado: decisión #1). `ORDER BY creado_en, id`, igual que `sensores`.
3. **Ruta `GET /api/afectados?nodoId=<uuid>`** (Derivado: decisión #3). Responde `{ total, afectados: [{ id, alias, creadoEn }] }`. Orden en el handler: `requireRole(sesion, ...ROLES)` (401 sin sesión), Zod (400 si falta `nodoId` o no es UUID, como `GET /api/sensores`) y servicio (404). El total lo calcula el servicio con `afectados.length`: una sola consulta y nunca se desalinea de la lista.
4. **Servicio** `listarAfectados(nodoId)`: llama a `obtenerNodo` del servicio de `nodos` (404 si no existe; única lectura entre módulos) y luego a `repo.listarPorNodo`.
5. **Panel por `paneles.ts`** (RN-2). `paneles = [{ titulo: "Afectados", orden: 40, Componente: PanelAfectados }]`. `PanelAfectados` es un Server Component asíncrono que llama a `listarAfectados` (las páginas leen el servicio, no la API) y pinta `ListaAfectados`, un componente síncrono sin datos, renderizable con `react-dom/server` en Vitest. El panel no filtra por rol: la ficha ya exige sesión y ambos roles ven lo mismo (CA-2).
6. **Interfaz.** `ListaAfectados` muestra «Total de afectados» con la cifra en `.cifra` y `data-testid="total-afectados"`, y una lista `<ul aria-label="Afectados del nodo">` con un `<li>` por alias (los repetidos se repiten). Con total 0 muestra la cifra 0 y `EstadoVacio` con título «Sin afectados». Solo tokens del sistema de diseño; sin Zod en el cliente (no es `"use client"`).
7. **Semilla `db/seed/nodos_afectados.sql`** (Derivado: decisión #4, #5). `INSERT INTO nodo_usuarios (id, nodo_id, alias) VALUES ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000000002', 'Usuario demo 02') ON CONFLICT (id) DO NOTHING`. El nombre la ordena después de `nodos.sql`; con `afectados.sql` correría antes y violaría la llave foránea en una BD nueva.
8. **Contrato.** `contracts/openapi.yaml` suma `GET /api/afectados` con `security: sesion`, parámetro `nodoId` (uuid, requerido), esquemas `Afectado` y `AfectadosDeNodo`, y las respuestas compartidas 400, 401 y 404, conservando las demás rutas.

## Interfaces

```ts
// src/modulos/afectados/repo.ts  (import "server-only")
export type Afectado = { id: string; alias: string; creadoEn: string }; // creadoEn en ISO 8601
export function listarPorNodo(nodoId: string): Promise<Afectado[]>;   // ORDER BY creado_en, id

// src/modulos/afectados/schema.ts
export const afectadosConsultaSchema: z.ZodObject<{ nodoId: z.ZodGUID }>; // z.object({ nodoId: z.guid() })

// src/modulos/afectados/service.ts  (import "server-only")
export type AfectadosDeNodo = { total: number; afectados: Afectado[] };
export function listarAfectados(nodoId: string): Promise<AfectadosDeNodo>; // ErrorHttp(404, "Nodo no encontrado") vía obtenerNodo

// src/app/api/afectados/route.ts
export const GET: (req: Request) => Promise<Response>; // 200 AfectadosDeNodo | 400 | 401 | 404

// src/modulos/afectados/ui/ListaAfectados.tsx  (síncrono, sin datos)
export function ListaAfectados(props: AfectadosDeNodo): JSX.Element;
// src/modulos/afectados/ui/PanelAfectados.tsx  (Server Component asíncrono)
export function PanelAfectados(props: { nodoId: string }): Promise<JSX.Element>;

// src/modulos/afectados/paneles.ts
export const paneles: Panel[]; // [{ titulo: "Afectados", orden: 40, Componente: PanelAfectados }]
```

Datos de la semilla: nodo `00000000-0000-4000-8000-000000000002` (`Subestación Sur`) con el afectado `00000000-0000-4000-8000-0000000a0001` alias `Usuario demo 02`; nodo `00000000-0000-4000-8000-000000000001` (`Subestación Norte`) sin afectados.

## Risks / Trade-offs

- [Sin API para crear afectados, las pruebas los insertan por SQL] → las pruebas de integración crean sus nodos y afectados con SQL directo en la BD de prueba y los borran al terminar (el borrado del nodo arrastra sus afectados).
- [La e2e no puede crear afectados por la API] → lee el afectado de la semilla por su alias propio y crea por la API su propio nodo vacío para el caso total 0.
- [El nombre de la semilla no sigue `<modulo>.sql`] → decisión #5, por el orden alfabético de `scripts/seed.mjs`.

## Migration Plan

Migración nueva `db/migration/V202611240500__afectados.sql`, solo hacia adelante y compatible hacia atrás (tabla nueva). Semilla idempotente. Reversa: retirar la imagen; la tabla queda sin uso.
