# Design

## Context

La HU 3 dejó `usuarios(id, nombre_usuario, contrasena_hash, rol, creado_en)` con `rol` en `administrador` o `tecnico`, y la semilla `db/seed/auth.sql` con las cuentas `admin` y `tecnico`. La HU 4 dejó `nodos(id, nombre, ubicacion, estado, creado_en)`, el servicio `nodos/service.ts` (`obtenerNodo`, que lanza 404 `Nodo no encontrado` también con un id que no es UUID) y la ficha `/nodos/{id}`, que pinta los paneles de `registro.paneles` (`Sensores` 10, `Simulador` 20, `Aislamiento` 30, `Afectados` 40). El núcleo ofrece `sessionFromRequest`, `requireRole`, `sesionActual` y `conHttp`. Ver `proposal.md` para el motivo.

## Goals / Non-Goals

**Goals:**
- Que un administrador asigne o reasigne el técnico de un nodo desde su ficha y que la ficha lo muestre sin recargar.
- Que la API rechace usuarios que no son técnicos o no existen, nodos inexistentes y a quien no es administrador, sin cambiar la asignación.
- Dejar el módulo `mantenimiento` listo para que la HU 11 lo extienda.

**Non-Goals:**
- Registrar mantenimientos (HU 11), notificar la asignación, varios técnicos por nodo, quitar una asignación sin reemplazarla, historial de asignaciones.
- Editar `nodos`, `auth`, la página de la ficha o el núcleo.

## Decisions

1. **Ruta y cuerpo** (decisión #1). `PUT /api/mantenimiento/nodos/{id}/tecnico` con `{ "tecnicoId": "<uuid>" }`, validado con Zod (`tecnicoId: z.guid()`). `PUT` porque el recurso «técnico del nodo» es único y asignar de nuevo lo reemplaza. Responde 200 con `{ nodoId, tecnico: { id, nombreUsuario } }`. No hay `GET`: el panel lee con el servicio (CLAUDE.md §4).
2. **Tabla `nodo_tecnicos` con `nodo_id` como clave primaria** (decisión #2). `nodo_id uuid PRIMARY KEY REFERENCES nodos (id) ON DELETE CASCADE`, `tecnico_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE`, `asignado_en timestamptz NOT NULL DEFAULT now()`. La clave primaria impone un técnico por nodo (RN-3) y `INSERT … ON CONFLICT (nodo_id) DO UPDATE SET tecnico_id = EXCLUDED.tecnico_id, asignado_en = now()` reemplaza al anterior en una sola sentencia atómica. El rol técnico (RN-1) lo verifica el servicio, no la base: un `CHECK` no puede leer otra tabla y un trigger sería más complejo que la regla.
3. **Orden de los controles** (decisión #3). En el handler: `requireRole(sesion, "administrador")` (401 sin sesión, 403 al técnico aunque el cuerpo sea inválido: CA-4), luego Zod (400; el cuerpo se lee con `req.json().catch(() => undefined)` para que uno que no es JSON sea 400). En el servicio: `obtenerNodo(nodoId)` del módulo `nodos` (404 `Nodo no encontrado`, CA-3), luego `repo.buscarUsuario(tecnicoId)` (404 `Usuario no encontrado`, CA-2) y luego el rol (400 `El usuario no es técnico`, CA-2). Solo si pasa todo se escribe, así que ningún rechazo cambia la asignación.
4. **Lecturas de tablas ajenas solo en el repo propio.** `repo.ts` lee `usuarios` (`buscarUsuario`, `listarTecnicos`) y une `nodo_tecnicos` con `usuarios` (`tecnicoDeNodo`); no edita `auth/repo.ts`. El nodo se lee con el servicio de `nodos`, como hace el panel de aislamiento.
5. **Panel por `paneles.ts`** (decisión #5, RN-2). `paneles = [{ titulo: "Técnico asignado", orden: 50, Componente: PanelTecnico }]`. `PanelTecnico` (Server Component) envuelve en `Suspense` con `Cargando` un componente asíncrono que lee `sesionActual()`, `tecnicoAsignado(nodoId)` y, solo si el rol es administrador, `tecnicosDisponibles()`; si la lectura falla registra el error con `logger` y pinta `EstadoError`. Pinta `TecnicoAsignado` (síncrono, sin datos propios) y, para el administrador, `AsignarTecnico`. Ocultar el selector al técnico es cosmético: la API exige el rol.
6. **Asignar sin confirmación** (decisión #5). `AsignarTecnico` (Client Component) es un formulario con un `<select>` y el botón «Asignar»: reasignar no es destructivo y se deshace asignando otra vez. Envía el `PUT` con su propio `fetch`; con 200 llama a `router.refresh()` dentro de una transición (la ficha vuelve a leer el panel), y con error muestra el mensaje de la API en `role="alert"`. Mientras envía o refresca, el botón queda desactivado. Sin técnicos registrados muestra un texto en lugar del selector.
7. **Semilla después de `nodos.sql`** (decisión #4). `scripts/seed.mjs` aplica las semillas en orden alfabético; `db/seed/nodos_tecnicos.sql` queda después de `auth.sql` y `nodos.sql`. Asigna `tecnico` a «Subestación Norte» (`00000000-0000-4000-8000-000000000001`) con `INSERT … SELECT … FROM usuarios WHERE nombre_usuario = 'tecnico' ON CONFLICT (nodo_id) DO NOTHING`, idempotente y sin pisar una asignación hecha después.
8. **Interfaz.** Solo tokens y clases del sistema de diseño (`.campo`, `.etiqueta-campo`, `.boton-primario`, `text-tenue`, `text-critico`); el cliente no importa Zod ni código de servidor (`import type` del tipo `Tecnico`). El `<select>` tiene `<label>` visible, el botón tiene texto y el foco es visible por las clases existentes. Sin animaciones.
9. **Contrato.** `contracts/openapi.yaml` suma `PUT /api/mantenimiento/nodos/{id}/tecnico` con `security: sesion`, cuerpo `TecnicoAsignar`, respuesta 200 `TecnicoDeNodo` y las respuestas compartidas 400, 401, 403 y 404 (`components.responses`), conservando las demás rutas.
10. **Pruebas con datos propios.** Las de integración y e2e crean sus nodos (y, en integración, sus usuarios) con un prefijo o `Date.now()` y los borran al terminar; borrar el nodo borra su asignación en cascada.

## Firmas

```ts
// src/modulos/mantenimiento/repo.ts  (import "server-only")
export type Tecnico = { id: string; nombreUsuario: string };
export type UsuarioRol = { id: string; nombreUsuario: string; rol: Rol }; // Rol de @/lib/session
export async function tecnicoDeNodo(nodoId: string): Promise<Tecnico | null>; // JOIN usuarios
export async function listarTecnicos(): Promise<Tecnico[]>; // WHERE rol = 'tecnico' ORDER BY nombre_usuario
export async function buscarUsuario(id: string): Promise<UsuarioRol | null>;
export async function asignar(nodoId: string, tecnicoId: string): Promise<void>; // upsert por nodo_id

// src/modulos/mantenimiento/schema.ts
export const asignarTecnicoSchema: z.ZodObject<{ tecnicoId: z.ZodGUID }>; // z.object({ tecnicoId: z.guid() })
export type AsignarTecnico = z.infer<typeof asignarTecnicoSchema>;

// src/modulos/mantenimiento/service.ts  (import "server-only")
export type { Tecnico } from "./repo";
export type Asignacion = { nodoId: string; tecnico: Tecnico };
export async function asignarTecnico(nodoId: string, tecnicoId: string): Promise<Asignacion>;
//   404 «Nodo no encontrado» (obtenerNodo) · 404 «Usuario no encontrado» · 400 «El usuario no es técnico» (ErrorHttp)
export async function tecnicoAsignado(nodoId: string): Promise<Tecnico | null>;
export async function tecnicosDisponibles(): Promise<Tecnico[]>;

// src/app/api/mantenimiento/nodos/[id]/tecnico/route.ts
export const PUT: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
//   conHttp("/api/mantenimiento/nodos/[id]/tecnico", ...)
//   200 { nodoId, tecnico: { id, nombreUsuario } } · 400 { error, detalles } | { error: "El usuario no es técnico" }
//   401 { error: "No autenticado" } · 403 { error: "Sin permiso" } · 404 { error: "Nodo no encontrado" | "Usuario no encontrado" }

// src/modulos/mantenimiento/paneles.ts
export const paneles: Panel[]; // [{ titulo: "Técnico asignado", orden: 50, Componente: PanelTecnico }]

// src/modulos/mantenimiento/ui/PanelTecnico.tsx  (Server Component)
export function PanelTecnico(props: { nodoId: string }): JSX.Element;

// src/modulos/mantenimiento/ui/TecnicoAsignado.tsx  (sin "use client", síncrono)
export function TecnicoAsignado(props: { tecnico: { id: string; nombreUsuario: string } | null }): JSX.Element;

// src/modulos/mantenimiento/ui/AsignarTecnico.tsx  ("use client")
export function AsignarTecnico(props: {
  nodoId: string;
  tecnicos: { id: string; nombreUsuario: string }[];
  asignadoId: string | null; // opción preseleccionada
}): JSX.Element;
```

Interfaz (selectores de las pruebas):

- `data-testid="tecnico-asignado"`: elemento con el nombre de usuario del técnico asignado (solo cuando hay uno).
- Vacío: `EstadoVacio` con título «Sin técnico asignado».
- `<select>` con `<label>` «Técnico» (`getByLabel("Técnico")`), `data-testid="selector-tecnico"`; una opción por técnico con `value` = id y texto = nombre de usuario, y una primera opción vacía «Elige un técnico».
- Botón «Asignar» (`getByRole("button", { name: "Asignar", exact: true })`), desactivado sin opción elegida o mientras envía.
- Error de la API: `<p role="alert">` con el mensaje.

Componentes de `src/modulos/ui/` que se reutilizan: `Cargando`, `EstadoError`, `EstadoVacio` (y `Tarjeta`, que pone la ficha). Componentes nuevos, propios del módulo: `PanelTecnico` (carga con `Cargando`, error con `EstadoError`), `TecnicoAsignado` (vacío con `EstadoVacio`) y `AsignarTecnico` (error en `role="alert"`; sin técnicos, un texto en lugar del selector).

## Textos visibles

- Título del panel (lo pone la `Tarjeta` de la ficha): «Técnico asignado».
- Con técnico: etiqueta «Responsable» y el nombre de usuario, p. ej. «tecnico».
- Sin técnico: «Sin técnico asignado».
- Cargando: «Cargando técnico asignado…».
- Error al cargar: «No se pudo cargar el técnico asignado».
- Selector (solo administrador): etiqueta «Técnico», primera opción «Elige un técnico», botón «Asignar».
- Sin técnicos registrados (solo administrador): «No hay técnicos registrados.».
- Error al asignar: el mensaje de la API (`El usuario no es técnico`, `Usuario no encontrado`, `Nodo no encontrado`, `Sin permiso`) o, sin mensaje, «No se pudo asignar el técnico.»; si falla la red, «No se pudo conectar con el servidor.».
- No hay cifras ni fechas visibles.

## Risks / Trade-offs

- [Un usuario cambia de rol después de asignado] → la HU 3 no permite cambiar roles; si llegara a pasar, la asignación queda hasta que se reasigne. Se acepta.
- [Dos administradores asignan a la vez] → gana la última escritura (upsert atómico); ambas respuestas son 200.
- [El técnico ve el panel pero un cliente HTTP puede llamar a la API] → la API exige el rol (403).
- [`router.refresh()` vuelve a leer toda la ficha] → página pequeña y dinámica; se acepta por simplicidad, igual que en la HU 6.
- [La semilla asigna `tecnico` a «Subestación Norte»] → las pruebas e2e usan nodos propios y no cuentan asignaciones globales.

## Migration Plan

Migración nueva `db/migration/V202611242330__nodo_tecnicos.sql`, solo hacia adelante: crea la tabla y no toca `nodos` ni `usuarios`, así que es compatible con la versión anterior de la app. La semilla es idempotente. Reversa: retirar la imagen; la tabla queda sin uso.
