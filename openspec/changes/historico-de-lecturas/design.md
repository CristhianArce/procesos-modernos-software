## Context

La HU 4 (#21) dejó las tablas `nodos`, `sensores` y `lecturas` (`id, sensor_id, voltaje, corriente, potencia, tomada_en`) y el módulo `lecturas`; la HU 5 (#22) agregó `GET /api/lecturas` (las N más recientes, sin paginar ni filtrar por fecha). Esta historia no cambia el esquema: agrega un módulo `historico` que solo lee. El esquema de filtros debe poder reutilizarlo la HU 16 (CSV).

## Goals / Non-Goals

**Goals:**
- Consulta paginada (25) con filtros por nodo, sensor y rango de fechas, por la API y por la página (CA-1 a CA-5).
- Esquema de filtros en un archivo reutilizable por la HU 16.

**Non-Goals:**
- Exportar a CSV, gráficas, borrar o corregir lecturas, tablas o migraciones nuevas.
- Modificar `GET /api/lecturas` ni el módulo `lecturas` (de otra historia).

## Decisions

### Consulta
`src/modulos/historico/repo.ts` (`import "server-only"`) arma una sola cláusula `WHERE` con parámetros posicionales sobre `lecturas l JOIN sensores s ON s.id = l.sensor_id JOIN nodos n ON n.id = s.nodo_id`:

```sql
WHERE ($1::uuid IS NULL OR n.id = $1) AND ($2::uuid IS NULL OR s.id = $2)
  AND ($3::timestamptz IS NULL OR l.tomada_en >= $3) AND ($4::timestamptz IS NULL OR l.tomada_en <= $4)
ORDER BY l.tomada_en DESC, l.id DESC LIMIT 25 OFFSET $5
```

Ambos extremos son inclusivos (decisión #1) y el desempate es por `id` (decisión #3). El total sale de un `SELECT count(*)` con el mismo `WHERE`; las dos consultas corren en paralelo. Los filtros usan el identificador (RN-3) y se combinan con AND, así que un sensor de otro nodo da lista vacía (decisión #6). Los índices existentes de `lecturas` bastan para la red de demostración (KISS).

### Validación (reutilizable por la HU 16)
`src/modulos/historico/schema.ts` exporta `filtrosBase` (objeto con `nodoId`, `sensorId` como `z.guid().optional()` y `desde`, `hasta` como `z.iso.datetime().optional()`, que acepta fecha y hora en UTC con `Z`; decisión #2), la regla `rangoValido` (`desde <= hasta`, error en `hasta`), `filtrosHistoricoSchema` (`filtrosBase` con la regla; lo usará la HU 16) y `consultaHistoricoSchema` (`filtrosBase` más `pagina`, `z.coerce.number().int().min(1).default(1)`, con la misma regla). El `ZodError` lo traduce `conHttp` a 400. `schema.ts` importa Zod, así que ningún componente `"use client"` lo importa (la página es de servidor, decisión #7).

### Servicio y handler
`service.ts#consultarHistorico` pide al repo la página y el total y devuelve `{ items, pagina, porPagina, total }` (decisión #4). El handler `GET /api/historico` usa `conHttp`, `requireRole(await sessionFromRequest(req), ...ROLES)` (decisión #8), parsea `Object.fromEntries(searchParams)` con `consultaHistoricoSchema` y responde `Response.json(...)`; `dynamic = "force-dynamic"`. El rol se exige antes de validar, así que sin sesión siempre es 401.

### Página
`src/app/(tablero)/historico/page.tsx` (Server Component dinámico, sin `fetch` a la API) lee `searchParams`, los limpia con `filtrosDeBusqueda` (descarta los vacíos del formulario), los valida con `consultaHistoricoSchema.safeParse` y llama a `consultarHistorico`, `listarNodos` y `listarTodosLosSensores`. Si la validación falla muestra `EstadoError` con el mensaje de Zod y no consulta (CA-4, decisión #7). `loading.tsx` usa `Cargando`; un fallo de la BD lo recoge el `error.tsx` del tablero. Los filtros van en un `<form method="get">` y la paginación son enlaces que conservan los filtros (`enlacePagina`), sin JavaScript de cliente.

### Datos de demostración
`db/seed/historico.sql` (idempotente, `ON CONFLICT (id) DO NOTHING`): nodos `…0301` y `…0302`, sensores `…0311` y `…0312` (nodo 1) y `…0321` (nodo 2), y lecturas de marzo de 2026 con identificadores fijos: 24 del sensor `…0311` y 2 del `…0312` dentro de `2026-03-01T00:00:00Z` a `2026-03-31T23:59:59Z` (26 coincidentes del nodo 1), una del `…0311` el `2026-02-28T23:59:00Z` y otra el `2026-04-01T00:01:00Z` (fuera del rango) y 3 del `…0321` dentro del rango (otro nodo). El simulador continuo escribe con la fecha actual, así que un rango de marzo de 2026 no recibe lecturas nuevas. No modifica filas de otras semillas.

## Firmas

Repo (`src/modulos/historico/repo.ts`):
- `type LecturaHistorico = { id: string; sensorId: string; sensorNombre: string; nodoId: string; nodoNombre: string; voltaje: number; corriente: number; potencia: number; tomadaEn: string }` (`tomadaEn` en ISO 8601 UTC).
- `listar(consulta: ConsultaHistorico): Promise<LecturaHistorico[]>`: la página pedida, como máximo 25 filas, con el orden y los filtros de arriba.
- `contar(filtros: FiltrosHistorico): Promise<number>`: cuántas lecturas cumplen los filtros.

Servicio (`src/modulos/historico/service.ts`):
- `type PaginaHistorico = { items: LecturaHistorico[]; pagina: number; porPagina: number; total: number }`.
- `consultarHistorico(consulta: ConsultaHistorico): Promise<PaginaHistorico>`; `porPagina` es siempre 25 (`POR_PAGINA`).

Schema (`src/modulos/historico/schema.ts`):
- `POR_PAGINA = 25`, `filtrosBase`, `filtrosHistoricoSchema`, `consultaHistoricoSchema`, `type FiltrosHistorico`, `type ConsultaHistorico` (`FiltrosHistorico & { pagina: number }`).

URL (`src/modulos/historico/url.ts`, sin Zod):
- `filtrosDeBusqueda(params: Record<string, string | string[] | undefined>): Record<string, string>`: toma el primer valor de cada parámetro y descarta los vacíos.
- `enlacePagina(filtros: Record<string, string>, pagina: number): string`: devuelve `/historico?...` con los filtros y `pagina`.

API (`GET /api/historico`): 200 `{ items: LecturaHistorico[], pagina, porPagina, total }`; 400 con el detalle de Zod; 401 JSON `{ error }`.

Interfaz (`src/modulos/historico/ui/`):
- `FiltrosHistorico` (props `{ nodos: { id: string; nombre: string }[]; sensores: { id: string; nombre: string; nodoNombre: string }[]; valores: Record<string, string> }`): formulario `GET` con las etiquetas "Nodo", "Sensor", "Desde (UTC)" y "Hasta (UTC)", el botón "Aplicar filtros" y el enlace "Limpiar filtros"; las opciones de sensor se muestran como "Sensor · Nodo" y la inicial de cada select es "Todos"; los campos de fecha llevan el ejemplo `2026-03-01T00:00:00Z` como marcador.
- `TablaHistorico` (props `{ items: LecturaHistorico[] }`): tabla `.tabla` con las columnas "Fecha", "Nodo", "Sensor", "Voltaje", "Corriente" y "Potencia" (`formatoTension`, `formatoCorriente`, `formatoPotencia` y `.cifra`); cada fila lleva `data-testid="fila-lectura"`; sin filas muestra `EstadoVacio` con el título "Sin lecturas".
- `PaginadorHistorico` (props `{ pagina: number; total: number; porPagina: number; filtros: Record<string, string> }`): `<nav aria-label="Paginación del histórico">` con el texto `Página X de Y` (`data-testid="pagina-actual"`), el total `N lecturas` (`data-testid="total-historico"`) y los enlaces "Anterior" y "Siguiente" (deshabilitados como texto en los extremos).
- `menu.ts`: `{ etiqueta: "Histórico", href: "/historico", roles: ["administrador", "tecnico"], orden: 30 }`.

Interfaz reutilizada de `src/modulos/ui/`: `Tarjeta`, `EstadoVacio`, `EstadoError`, `Cargando` y `formato.ts` (`formatoTension`, `formatoCorriente`, `formatoPotencia`); la fecha usa `formatearFecha` de `src/modulos/dashboard/formato.ts` (solo se importa, no se edita). No se agrega ningún componente a `src/modulos/ui/`. Los estados: cargando con `Cargando` (`loading.tsx`), error con `EstadoError` (filtro inválido en la página, fallo de servidor en el `error.tsx` del tablero) y vacío con `EstadoVacio`. No hay estados de sensor que mostrar, así que no se usa `IndicadorEstado`.

## Risks / Trade-offs

- [`OFFSET` crece con las páginas profundas] → Se acepta: la red de demostración es pequeña y la paginación por cursor sería más de lo que piden los CA (YAGNI).
- [Una lectura nueva del simulador desplaza las páginas mientras se navega] → Se acepta: es un histórico, no una vista congelada; el desempate por `id` evita duplicados entre páginas con fechas iguales.
- [Escribir fechas ISO a mano es incómodo] → El formulario muestra un ejemplo y la API devuelve el detalle del error; un selector de fecha queda fuera de los CA.

## Migration Plan

Sin migración. La semilla `historico.sql` es idempotente y la aplica `npm run seed`. Revertir es desplegar la versión anterior: el módulo desaparece y las filas de demostración quedan sin uso.

## Open Questions

Ninguna: las dudas de negocio quedaron en las decisiones #1 a #3 y los supuestos en #4 a #10.
