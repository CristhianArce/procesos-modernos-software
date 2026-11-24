# Design

## Context

La HU 9 dejó el módulo `src/modulos/historico/`: `schema.ts` con `filtrosHistoricoSchema` (nodo y sensor UUID, `desde` y `hasta` AAAA-MM-DD, vacíos ignorados, rango con `desde <= hasta`, pensado para reutilizarlo aquí), `repo.ts` con el filtro SQL `ORIGEN` (días en hora de Bogotá, `hasta` incluye el día completo) y el tipo `LecturaHistorico` (con `nodoNombre` y `sensorNombre`), `service.ts`, `ui/TablaHistorico.tsx` (tabla, estado vacío y enlaces de página con `enlacePagina`) y `GET /api/historico`. La semilla `db/seed/historico.sql` trae «Nodo histórico demo» con «Medidor histórico A» (26 lecturas del 2026-01-10 al 2026-01-12, Bogotá) y distractores. Ver `proposal.md` para el motivo.

## Goals / Non-Goals

**Goals:**
- Descargar en CSV las lecturas del filtro aplicado con el mismo significado del filtro que la HU 9.
- Un CSV seguro de abrir en una hoja de cálculo (RN-2).

**Non-Goals:**
- Cambiar la consulta paginada, los filtros o la página de la HU 9.
- Otros formatos, gráficas, aviso de tope, transmisión por partes (*streaming*) del archivo.

## Decisions

1. **Ruta propia** (decisión #3). `GET /api/historico/exportar` valida con `filtrosHistoricoSchema` (sin `pagina`, que Zod descarta por no estar en el esquema), exige `requireRole(sesion, ...ROLES)` (administrador y técnico) y responde con `new Response(csv, { headers })`: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="historico.csv"` y `Cache-Control: no-store` (datos de un usuario, CLAUDE.md §4). `conHttp` traduce el `ZodError` a 400 y el `ErrorHttp(401)` a JSON (CA-3, CA-4).
2. **Consulta con tope** (decisión #7). `repo.listarParaExportar(filtros, tope)` reutiliza `ORIGEN` y `parametros` del mismo archivo con `ORDER BY l.tomada_en DESC, l.id DESC LIMIT $5`. El tope (`TOPE_EXPORTACION = 10_000`, RN-4) lo pasa el servicio. Diez mil filas caben en memoria sin problema; no hace falta transmitir por partes.
3. **Serializador propio y puro** (decisiones #1, #2, #4, #5). `csv.ts` no importa nada de servidor: `celdaCsv` escapa una celda y `aCsv` arma el archivo. Orden de escape en cada celda: (1) si empieza por `=`, `+`, `-` o `@`, se antepone `'` (RN-2, también a números negativos, literal); (2) si contiene `,`, `"`, `\r` o `\n`, se envuelve en comillas dobles duplicando las internas (RFC 4180). Números con `String(n)` (punto decimal); fecha con el ISO que ya trae `LecturaHistorico.tomadaEn` (`toISOString()`, UTC). Cada línea termina en `\r\n`, incluida la última; sin BOM. Un filtro sin resultados produce solo `ENCABEZADO_CSV + "\r\n"` (CA-2).
4. **Servicio fino.** `exportarHistorico(filtros)` llama a `repo.listarParaExportar(filtros, TOPE_EXPORTACION)` y devuelve `aCsv(lecturas)`.
5. **Enlace sin JavaScript** (decisión #6). `exportar.ts` define `TOPE_EXPORTACION` y `enlaceExportar(filtros)`, que arma `/api/historico/exportar` con los filtros presentes (mismas claves y orden que `enlacePagina`, sin `pagina`; sin `?` si no hay filtros). `TablaHistorico` muestra el enlace `<a download>` arriba de la tabla y también en el estado vacío; la sesión viaja en la cookie y la respuesta `attachment` hace que el navegador descargue. No se edita la página de la HU 9 (CLAUDE.md §4).
6. **Contrato.** `contracts/openapi.yaml` suma `GET /api/historico/exportar` con los parámetros `nodoId`, `sensorId`, `desde` y `hasta` de `/api/historico`, respuesta 200 `text/csv` (cadena) y las respuestas compartidas 400 y 401.

## Firmas

```ts
// src/modulos/historico/repo.ts (nueva función)
export async function listarParaExportar(filtros: FiltrosHistorico, tope: number): Promise<LecturaHistorico[]>;

// src/modulos/historico/csv.ts (sin "server-only": puro)
export const ENCABEZADO_CSV = "nodo,sensor,voltaje,corriente,potencia,fecha";
export function celdaCsv(valor: string | number): string;
export function aCsv(lecturas: LecturaHistorico[]): string; // líneas con "\r\n"; vacío → ENCABEZADO_CSV + "\r\n"

// src/modulos/historico/exportar.ts (puro)
export const TOPE_EXPORTACION = 10_000;
export function enlaceExportar(filtros: FiltrosHistorico): string; // "/api/historico/exportar" o "/api/historico/exportar?nodoId=…&sensorId=…&desde=…&hasta=…"

// src/modulos/historico/service.ts (nueva función)
export async function exportarHistorico(filtros: FiltrosHistorico): Promise<string>;

// src/app/api/historico/exportar/route.ts
export const GET: (req: Request, ctx: unknown) => Promise<Response>; // envuelto en conHttp("/api/historico/exportar", …)

// src/modulos/historico/ui/TablaHistorico.tsx (mismas props: { resultado: HistoricoPagina; filtros: FiltrosHistorico })
// <a data-testid="exportar-csv" href={enlaceExportar(filtros)} download className="enlace text-sm">Exportar CSV</a>
```

## Textos visibles

- Enlace: «Exportar CSV» (`data-testid="exportar-csv"`), en la tabla y en el estado vacío del histórico.
- Archivo descargado: `historico.csv`.
- Encabezado del CSV: `nodo,sensor,voltaje,corriente,potencia,fecha`.
- Fila de ejemplo (semilla de la HU 9): `Nodo histórico demo,Medidor histórico A,122.6,5,600,2026-01-12T15:00:00.000Z` (la más reciente: 2026-01-12 10:00 en Bogotá).
- Errores de la API: los de `conHttp` (`Datos inválidos` con `detalles` en 400; `No autenticado` en 401).

## Risks / Trade-offs

- [Un número negativo se exporta como texto `'-5`] → RN-2 lo pide literal; las lecturas simuladas no son negativas (decisión #4).
- [Excel en español abre un CSV con comas en una sola columna y puede mostrar mal las tildes sin BOM] → decisión de la persona (coma, decisión #2) y RFC 4180; se puede importar con «Datos > Desde texto» (decisión #5).
- [El tope corta en silencio] → RN-4 lo pide sin aviso; queda fuera de alcance avisar.
- [El enlace exporta los filtros aplicados, no los que el usuario cambió en el formulario sin pulsar «Filtrar»] → es lo que CA-1 llama «filtro aplicado» (decisión #6).

## Migration Plan

Sin migración ni semilla. Se despliega con la imagen; para revertir, se retira la imagen (la ruta nueva solo lee).
