# Design

## Context

Ver `proposal.md` (Why). Existen las tablas `lecturas` (`id, sensor_id, voltaje, corriente, potencia, tomada_en`) y `sensores` (`id, nodo_id, ...`), con el índice `lecturas_sensor_tomada_idx (sensor_id, tomada_en DESC)`. `GET /api/lecturas` ya devuelve lo más reciente sin paginar ni filtrar por fechas y no se toca. El patrón del proyecto es `conHttp` + `sessionFromRequest` + `requireRole` en el handler, SQL solo en `repo.ts` y páginas que leen por servicio. Los nodos y sensores para los selectores salen de `listarNodos` (`nodos/service`) y `listarTodosLosSensores` (`sensores/service`).

## Goals / Non-Goals

**Goals:**
- Consulta paginada y filtrada, solo lectura (CA-1 a CA-5, RN-1).
- Un esquema de filtros sin dependencias de servidor, reutilizable por la HU 16.

**Non-Goals:**
- Exportar, gráficas, borrar o corregir lecturas (fuera de alcance del issue).
- Cambiar `GET /api/lecturas` o el módulo `lecturas`.

## Decisions

1. **Módulo nuevo `src/modulos/historico/`** con `schema.ts`, `repo.ts`, `service.ts`, `menu.ts`, `ui/` y `__tests__/`. Alternativa descartada: ampliar `lecturas`, porque mezcla una consulta de análisis con el simulador y obliga a editar el módulo de otra historia.
2. **Esquema `historicoFiltrosSchema`** en `schema.ts`: `nodoId` y `sensorId` (`z.guid().optional()`), `desde` y `hasta` (`z.iso.datetime({ offset: true }).optional()`) y `pagina` (`z.coerce.number().int().min(1).default(1)`), con un `refine` que exige `desde <= hasta` (CA-4; Derivado: decisión #6). El tamaño de página es la constante `TAMANO_PAGINA = 25` (RN-2). Un parámetro vacío en la URL se trata como ausente para que el formulario no mande `desde=`.
3. **Respuesta** `{ lecturas: Lectura[], total, pagina, tamano }` (Derivado: decisión #5). El total permite pintar los controles de página y distinguir el vacío (CA-3). Alternativa descartada: solo el arreglo, que no deja saber cuántas páginas hay.
4. **SQL** en `repo.ts`, una consulta parametrizada con `LIMIT 25 OFFSET (pagina-1)*25` y `ORDER BY l.tomada_en DESC, l.id DESC` (CA-1; Derivado: decisión #2), más un `count(*)` con el mismo `WHERE`. Cada filtro es `($n::tipo IS NULL OR condición)`. El filtro por nodo hace `JOIN sensores s ON s.id = l.sensor_id` y compara `s.nodo_id`; la fila trae `nodo_id`, nombre del nodo y nombre del sensor para la tabla. Extremos con `>=` y `<=` (Derivado: decisión #1). Una página fuera de rango da cero filas sin error (Derivado: decisión #3).
5. **Handler** `src/app/api/historico/route.ts` con `conHttp("/api/historico", ...)`: primero `requireRole(await sessionFromRequest(req), ...ROLES)` (401 antes de validar, CA-5; Derivado: decisión #4), después `historicoFiltrosSchema.parse` (400, CA-4) y `consultarHistorico`.
6. **Contrato:** `contracts/openapi.yaml` agrega `/api/historico` (GET, parámetros, 200, 400, 401) y el esquema `PaginaHistorico`; reutiliza `Lectura`, `DatosInvalidos` y `NoAutenticado` y conserva las rutas de las demás historias.
7. **Página** `src/app/(tablero)/historico/page.tsx` (Server Component, dinámica): lee con los servicios `listarNodos` y `listarTodosLosSensores` y entrega los selectores al componente cliente `ui/ConsultaHistorico.tsx`, que llama a `GET /api/historico` (capas de CLAUDE.md §4) y convierte las fechas elegidas a ISO con zona antes de enviarlas. No importa Zod: las constantes compartidas (`TAMANO_PAGINA`, tipos) van en `historico/tipos.ts`, sin Zod.
8. **Menú:** `menu.ts` con `{ etiqueta: "Histórico", href: "/historico", roles: ["administrador", "tecnico"], orden: 20 }` y el icono genérico.
9. **Sin migración ni semilla** (RN-1; Derivado: decisión #8): el índice existente cubre el filtro por sensor y la ordenación por fecha. La semilla fija del e2e la crea la propia prueba con la API y la elimina en `afterEach`.

### Interfaz (reglas de CLAUDE.md §4)

| Componente | Origen | Estados |
|---|---|---|
| `Tarjeta` | `src/modulos/ui/` (reutiliza) | contenedor de filtros y de la tabla |
| `Cargando` | `src/modulos/ui/` (reutiliza) | mientras llega la página |
| `EstadoError` | `src/modulos/ui/` (reutiliza) | falla la API, con `onReintentar` |
| `EstadoVacio` | `src/modulos/ui/` (reutiliza) | filtro sin resultados (CA-3) |
| `formato.ts` y `.cifra` | `src/modulos/ui/` (reutiliza) | voltaje, corriente y potencia |
| `ConsultaHistorico` | nuevo, `historico/ui/` | filtros (`.campo`), tabla (`.tabla`), paginación con botones de teclado |

Los controles tienen nombre accesible y foco visible; solo se usan tokens `--sc-*` y las clases existentes. No hay estados de nodo en la tabla, así que no se usa `IndicadorEstado`.

## Risks / Trade-offs

- [`OFFSET` crece con las páginas profundas] → el histórico es de una red simulada y la poda limita las lecturas; se acepta por KISS.
- [`count(*)` por consulta] → el mismo `WHERE` e índice; aceptable para el tamaño esperado.
- [Fechas con zona obligatoria rechazan "2026-11-24"] → la interfaz siempre envía ISO completo; documentado en el contrato.
