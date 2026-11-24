# Design

## Context

La tabla `nodos(id, nombre, ubicacion, estado, creado_en)` y la ficha `src/app/(tablero)/nodos/[id]/page.tsx` son de la HU 4; la ficha pinta en una `Tarjeta` cada panel de `registro.paneles` (`Sensores` 10, `Simulador` 20, `Aislamiento` 30). El servicio de nodos ofrece `obtenerNodo(id)` (404 `Nodo no encontrado`, también con un id que no es UUID) y `buscarNodo`. El núcleo ofrece `sessionFromRequest`, `requireRole`, `ROLES` y `conHttp`. `scripts/seed.mjs` aplica `db/seed/*.sql` en orden alfabético. Ver `proposal.md` para el motivo.

## Goals / Non-Goals

**Goals:**
- Guardar afectados (alias por nodo) en una tabla propia y consultarlos por la API y en la ficha.
- Que administrador y técnico vean el mismo panel y la misma respuesta.

**Non-Goals:**
- Altas y bajas de afectados (HU 14 y 15), notificaciones, cálculo desde la topología, importación, unicidad del alias.
- Editar la ficha, el módulo `nodos` o el núcleo.

## Decisions

1. **Tabla `nodo_usuarios`** (Derivado: decisión #4, #7). Migración `db/migration/V202611241700__afectados.sql`:
   `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `nodo_id uuid NOT NULL REFERENCES nodos (id) ON DELETE CASCADE`, `alias text NOT NULL CHECK (char_length(btrim(alias)) BETWEEN 1 AND 80)`, `creado_en timestamptz NOT NULL DEFAULT now()` e índice `nodo_usuarios_nodo_idx (nodo_id)`. Sin índice único (RN-4). Solo crea una tabla nueva: compatible hacia atrás.
2. **Semilla `db/seed/nodos_usuarios.sql`** (Derivado: decisión #2, #6). `afectados.sql` correría antes que `nodos.sql` por el orden alfabético y fallaría por la clave foránea; `nodos_usuarios.sql` va después (`_` ordena después de `.`). Inserta `Usuario demo 02` con id fijo `00000000-0000-4000-8000-000000002001` en «Subestación Sur» (`…0002`), con `ON CONFLICT (id) DO NOTHING`. «Subestación Norte» queda sin afectados.
3. **Orden de la lista** (decisión #1). `ORDER BY alias, id` en el SQL; el servicio no reordena.
4. **Servicio** (CA-3). `listarAfectados(nodoId)` llama primero a `obtenerNodo(nodoId)` (404 si no existe) y luego a `repo.listarPorNodo`; `total` es el largo de la lista. Alternativa descartada: un `COUNT(*)` aparte, redundante sin paginación.
5. **Handler** `GET /api/afectados` con `conHttp`: `requireRole(sesion, ...ROLES)` (401 sin sesión), luego `afectadosConsultaSchema` (`{ nodoId: z.guid() }`, 400 con `detalles`: decisión #3) y el servicio (404). Mismo patrón que `GET /api/sensores`.
6. **Panel por `paneles.ts`** (Derivado: decisión #5). `paneles = [{ titulo: "Afectados", orden: 40, Componente: PanelAfectados }]`. `PanelAfectados` (síncrono) envuelve en `<Suspense fallback={<Cargando etiqueta="Cargando afectados…" />}>` un Server Component asíncrono `AfectadosDelNodo` que llama a `listarAfectados` y pinta `ListaAfectados`; si la lectura falla, pinta `EstadoError`. No filtra por rol: la ficha ya exige sesión y ambos roles leen (CA-2).
7. **`ListaAfectados`** (síncrono, sin datos propios, renderizable con `react-dom/server` en Vitest): muestra el total en `.cifra` y la lista `<ul>`; con total 0 muestra `EstadoVacio`.
8. **Contrato.** `contracts/openapi.yaml` suma `GET /api/afectados` con `security: sesion`, parámetro `nodoId` (query, uuid, requerido), respuesta 200 `AfectadosNodo` (esquemas `Afectado` y `AfectadosNodo`) y las respuestas compartidas 400, 401 y 404, conservando las demás rutas.
9. **Interfaz.** Reutiliza de `src/modulos/ui/`: `Cargando` (carga), `EstadoError` (error), `EstadoVacio` (vacío). No agrega componentes reutilizables; los dos nuevos son propios del módulo (`ui/`). Solo tokens y clases del sistema (`text-tenue`, `.cifra`); sin controles interactivos (solo lectura), así que no hay foco ni animación nuevos. No hay estados eléctricos que mostrar.

## Firmas

```ts
// src/modulos/afectados/repo.ts  (import "server-only")
export type Afectado = { id: string; alias: string };
export async function listarPorNodo(nodoId: string): Promise<Afectado[]>; // ORDER BY alias, id

// src/modulos/afectados/schema.ts
export const afectadosConsultaSchema: z.ZodObject<{ nodoId: z.ZodGUID }>; // { nodoId: z.guid() }

// src/modulos/afectados/service.ts  (import "server-only")
export type { Afectado } from "./repo";
export type AfectadosNodo = { total: number; afectados: Afectado[] };
export async function listarAfectados(nodoId: string): Promise<AfectadosNodo>; // ErrorHttp 404 «Nodo no encontrado» vía obtenerNodo

// src/app/api/afectados/route.ts
export const GET: (req: Request, ctx: unknown) => Promise<Response>; // conHttp("/api/afectados", ...)
// 200 { total, afectados: [{ id, alias }] } · 400 { error, detalles } · 401 · 404 { error: "Nodo no encontrado" }

// src/modulos/afectados/paneles.ts
export const paneles: Panel[]; // [{ titulo: "Afectados", orden: 40, Componente: PanelAfectados }]

// src/modulos/afectados/ui/PanelAfectados.tsx
export function PanelAfectados(props: { nodoId: string }): JSX.Element;

// src/modulos/afectados/ui/ListaAfectados.tsx  (sin "use client", síncrono)
export function ListaAfectados(props: { total: number; afectados: { id: string; alias: string }[] }): JSX.Element;
```

Interfaz (selectores de las pruebas):

- `data-testid="afectados-total"`: el número total, en un elemento con clase `cifra` y la etiqueta visible «Total de afectados».
- `data-testid="afectados-lista"`: el `<ul>` de la lista; cada `<li>` lleva `data-testid="afectado"` y el alias como texto.
- Vacío: `EstadoVacio` con título «Este nodo no tiene afectados»; la lista no se pinta.
- Error: `EstadoError` con título «No se pudieron cargar los afectados».
- El panel lo titula la ficha con «Afectados» (título de la `Tarjeta`).

## Risks / Trade-offs

- [Una e2e de la HU 14 deja afectados en «Subestación Sur»] → esa prueba debe limpiarlos (CLAUDE.md §7); esta e2e lo documenta (decisión #6).
- [El orden por `alias` depende de la colación de la base] → se acepta; el desempate por `id` lo hace estable.
- [`Cargando` es un esqueleto de pantalla completa dentro de un panel] → se reutiliza por la regla de interfaz; la carga del panel es breve.

## Migration Plan

Flyway aplica `V202611241700__afectados.sql` (solo crea la tabla) y la semilla se aplica con `npm run seed` y en el CD. Reversa: retirar la imagen; la tabla queda sin uso y no afecta a otras historias.
