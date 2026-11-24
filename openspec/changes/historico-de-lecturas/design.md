# Design

## Context

La historia es solo de lectura sobre `lecturas` (`id, sensor_id, voltaje, corriente, potencia, tomada_en`), `sensores` (`id, nodo_id, nombre, …`) y `nodos` (`id, nombre, …`). Ya existen `GET /api/lecturas` (últimas N, hasta 100, sin paginar) y el módulo `lecturas`, que no se tocan (RN-1; otra historia). Cambia el contrato (`contracts/openapi.yaml`), por eso este design es obligatorio. Motivación: ver proposal.md. Requisitos: ver specs.

## Goals / Non-Goals

**Goals:**
- Un módulo nuevo `src/modulos/historico/` con el esquema de filtros en `schema.ts`, sin Zod en el cliente, reutilizable por la HU 16.
- La página lee con el servicio (no con `fetch`) y la API reutiliza el mismo servicio.

**Non-Goals:**
- Exportar a CSV, gráficas, borrar o corregir lecturas, migraciones.
- Modificar `src/modulos/lecturas/` o el contrato existente de `/api/lecturas`.

## Decisions

1. **Módulo propio `historico`, no ampliar `lecturas`.** `lecturas` sirve a otra historia (últimas lecturas); el histórico necesita un JOIN con nombres de sensor y nodo y paginación. Alternativa descartada: añadir paginación a `GET /api/lecturas` (rompería su contrato).
2. **Paginación por `OFFSET`/`LIMIT` y el `total` con una segunda consulta `count(*)` con los mismos filtros.** `pagina` entero ≥ 1 (por defecto 1), tamaño fijo 25 (RN-2; decisión del issue). Simple (KISS) y suficiente para el volumen; keyset descartado por exigir cursor y no permitir ir a la página 2 directa (CA-1).
3. **Orden `ORDER BY l.tomada_en DESC, l.id DESC`** (CA-1; Derivado: decisión #3).
4. **Rango `tomada_en >= desde AND tomada_en < hasta`** (CA-2; Derivado: decisión #1).
5. **Fechas con `z.iso.datetime()`** (solo UTC con `Z`; CA-4; Derivado: decisión #2). La regla `desde <= hasta` va en un `.refine`; `desde == hasta` es válido y da lista vacía (el CA solo rechaza «posterior»).
6. **Filtros por identificador (RN-3)**: `nodoId` y `sensorId` con `z.guid()` (igual que el módulo `lecturas`). Un identificador inexistente no es error: lista vacía (CA-3).
7. **Página como Server Component con formulario `GET`** (sin JS de cliente): los filtros viajan en la URL, la paginación son enlaces. Para el formulario lista nodos y sensores con `listarNodos()` de `@/modulos/nodos/service` y `listarTodosLosSensores()` de `@/modulos/sensores/service`. Si los parámetros de la URL no pasan el esquema, la página muestra `EstadoError` en lugar de lanzar. Sin componentes `"use client"`.
8. **Autorización**: el handler llama `requireRole(await sessionFromRequest(req), ...ROLES)` (CA-5); la página la protege el layout del tablero. Ambos roles.
9. **Sin semilla.** El simulador continuo poda las lecturas viejas (conserva la última de cada sensor), así que una semilla con fechas fijas no sobreviviría. El e2e crea su propio nodo y sensor, genera al menos 26 lecturas con `POST /api/simulador`, acota por su sensor y los elimina al terminar; no afirma totales exactos (el simulador continuo puede añadir lecturas) sino 25 filas en la página 1, al menos 1 en la 2 y orden descendente de fechas.

## Firmas

**Esquema** (`src/modulos/historico/schema.ts`):
- `TAMANO_PAGINA = 25` (constante).
- `historicoFiltrosSchema`: `z.object({ nodoId?: guid, sensorId?: guid, desde?: iso.datetime (UTC), hasta?: iso.datetime (UTC), pagina: coerce int ≥ 1, default 1 })` con `.refine` (`desde <= hasta`); el mensaje del refine apunta a `hasta`.
- `type HistoricoFiltros = z.infer<typeof historicoFiltrosSchema>`.

**Repo** (`src/modulos/historico/repo.ts`, `import "server-only"`):
- `type FilaHistorico = { id: string; sensorId: string; sensorNombre: string; nodoId: string; nodoNombre: string; voltaje: number; corriente: number; potencia: number; tomadaEn: string }` (`tomadaEn` ISO UTC).
- `consultar(filtros: HistoricoFiltros): Promise<FilaHistorico[]>` — hasta 25 filas de la página pedida.
- `contar(filtros: HistoricoFiltros): Promise<number>` — total con los mismos filtros.

**Servicio** (`src/modulos/historico/service.ts`, `import "server-only"`):
- `type PaginaHistorico = { items: FilaHistorico[]; pagina: number; tamano: number; total: number }`.
- `consultarHistorico(filtros: HistoricoFiltros): Promise<PaginaHistorico>` — llama a `repo.consultar` y `repo.contar` en paralelo; `tamano` siempre 25.

**Handler** (`src/app/api/historico/route.ts`): `GET` envuelto con `conHttp("/api/historico", …)`; parsea `Object.fromEntries(new URL(req.url).searchParams)` con `historicoFiltrosSchema.parse`; responde `Response.json(PaginaHistorico)`. 400 por `ZodError` (lo traduce `conHttp`), 401 sin sesión.

**Respuesta de la API** (`200`): `{ "items": [{ "id": uuid, "sensorId": uuid, "sensorNombre": string, "nodoId": uuid, "nodoNombre": string, "voltaje": number, "corriente": number, "potencia": number, "tomadaEn": date-time }], "pagina": 1, "tamano": 25, "total": 0 }`.

**Menú** (`src/modulos/historico/menu.ts`): `menu: ItemMenu = { etiqueta: "Histórico", href: "/historico", roles: ["administrador", "tecnico"], orden: 40 }`.

**Página** (`src/app/(tablero)/historico/page.tsx`): `export default async function PaginaHistorico({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> })`, `dynamic = "force-dynamic"`.

**Componentes** (`src/modulos/historico/ui/`, todos síncronos y sin datos propios, props por parámetro):
- `FiltrosHistorico({ nodos: { id: string; nombre: string }[]; sensores: { id: string; nombre: string; nodoId: string }[]; valores: { nodoId?: string; sensorId?: string; desde?: string; hasta?: string } })` — `<form method="get" aria-label="Filtros del histórico">`; campos con etiqueta «Nodo» (`<select name="nodoId">`), «Sensor» (`<select name="sensorId">`), «Desde» y «Hasta» (`<input type="text" name="desde" | "hasta">` con ayuda «AAAA-MM-DDTHH:mm:ssZ»); botón «Aplicar filtros» y enlace «Limpiar filtros» a `/historico`.
- `TablaHistorico({ items: FilaHistorico[] })` — `<table className="tabla">` con `data-testid="tabla-historico"`; columnas Fecha, Nodo, Sensor, Tensión, Corriente, Potencia; cifras con `formatoTension`, `formatoCorriente`, `formatoPotencia` y `.cifra`; una fila por lectura con `data-testid="fila-historico"`.
- `PaginacionHistorico({ pagina: number; total: number; tamano: number; parametros: URLSearchParams })` — `<nav aria-label="Paginación del histórico">` con enlaces «Anterior» y «Siguiente» (deshabilitados como texto en los extremos) y el texto `data-testid="resumen-pagina"` «Página X de Y · N lecturas».

**Estados de la página**: cargando con `Cargando` (el `loading.tsx` existente del grupo `(tablero)`), error de parámetros o de consulta con `EstadoError`, sin coincidencias con `EstadoVacio` (texto «No hay lecturas con estos filtros»).

**Componentes reutilizados** de `src/modulos/ui/`: `Tarjeta`, `Cargando`, `EstadoError`, `EstadoVacio`, `formato.ts`. Nuevos: solo los tres de `historico/ui/`. Colores y estilos con los tokens `--sc-*` y las clases `.campo`, `.tabla`, `.cifra`, `.boton-primario`, `.enlace`.

## Risks / Trade-offs

- [Un campo `datetime-local` enviaría hora local sin zona y la API exige ISO UTC] → los campos son de texto con la ayuda del formato; así no hay conversión de zona horaria en el cliente.
- [`OFFSET` crece con la página] → aceptable para el volumen de demostración; la tabla tiene el índice `(sensor_id, tomada_en DESC)`.
- [El simulador continuo agrega lecturas mientras se consulta] → la paginación puede desplazarse entre páginas; no afecta a las pruebas porque el e2e acota por su propio sensor y no afirma totales exactos.
