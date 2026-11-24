# Design

## Context

Las tablas son de la HU 4: `nodos(id, nombre, …)`, `sensores(id, nodo_id, nombre, …)` y `lecturas(id, sensor_id, voltaje, corriente, potencia, tomada_en)`, con el índice `lecturas_sensor_tomada_idx (sensor_id, tomada_en DESC)`. El módulo `lecturas` solo ofrece consultas de lo más reciente (`GET /api/lecturas`, máximo 100, sin fechas ni páginas). El tablero formatea fechas con `formatearFecha` (es-CO, `America/Bogota`) de `src/modulos/dashboard/formato.ts` y cifras con `formato.ts` de `src/modulos/ui/`. `listarNodos` (nodos) y `listarTodosLosSensores` (sensores) dan las opciones de los filtros. `scripts/seed.mjs` aplica las semillas en orden alfabético. Ver `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Consulta paginada (25) y filtrada por nodo, sensor y días, por la API y en la página.
- Un esquema de filtros que la HU 16 pueda reutilizar.

**Non-Goals:**
- CSV (HU 16), gráficas, editar o borrar lecturas; migraciones o tablas nuevas.

## Decisions

1. **Módulo `historico` con SQL propio de solo lectura** (RN-1). `repo.ts` consulta `lecturas` unida a `sensores` y `nodos` para filtrar por nodo y devolver los nombres. Alternativa descartada: ampliar `lecturas/repo.ts`, que es de la HU 4 y no se edita.
2. **Filtros en SQL con parámetros opcionales.** Una sola cláusula `WHERE` compartida por la cuenta y la página: `($1::uuid IS NULL OR n.id = $1) AND ($2::uuid IS NULL OR s.id = $2) AND ($3::date IS NULL OR l.tomada_en >= ($3::date)::timestamp AT TIME ZONE 'America/Bogota') AND ($4::date IS NULL OR l.tomada_en < (($4::date + 1)::timestamp AT TIME ZONE 'America/Bogota'))`. Así el día se interpreta en Bogotá y `hasta` incluye el día completo (decisiones #1, #2, #3). Un sensor que no es del nodo da cero filas (decisión #4).
3. **Orden y página.** `ORDER BY l.tomada_en DESC, l.id DESC LIMIT 25 OFFSET (pagina - 1) * 25`; el desempate por `id` hace estable la página. `contar` usa `count(*)` con el mismo `WHERE`; el servicio las corre en paralelo. Alternativa descartada: `count(*) OVER ()`, que no da el total en una página vacía.
4. **Esquemas Zod** (decisiones #5, #10). `filtrosHistoricoSchema`: `nodoId` y `sensorId` UUID opcionales, `desde` y `hasta` `z.iso.date()` opcionales y un `refine` que exige `desde <= hasta` (comparación de texto `AAAA-MM-DD`). Un valor vacío (`""`, lo que envía el formulario `GET` con «Todos») se convierte en ausente antes de validar. `consultaHistoricoSchema` = filtros + `pagina` (`z.coerce.number().int().min(1).default(1)`).
5. **Servicio.** `consultarHistorico(consulta)` devuelve `{ pagina, porPagina: 25, total, totalPaginas: ceil(total / 25), lecturas }`. `POR_PAGINA = 25` vive en `schema.ts` (sin `server-only`) para que la UI lo use.
6. **Handler** `GET /api/historico` con `conHttp`: `requireRole(sesion, ...ROLES)` (401 sin sesión: CA-5), luego Zod sobre `Object.fromEntries(searchParams)` (400 con `detalles`: CA-4) y el servicio. Mismo patrón que `GET /api/lecturas`.
7. **Página sin componente cliente** (decisión #8). `page.tsx` (Server Component, dinámica) lee `searchParams`, valida con `consultaHistoricoSchema.safeParse` y, en paralelo, `listarNodos`, `listarTodosLosSensores` y, si es válida, `consultarHistorico`. Pinta `FiltrosHistorico` (formulario `GET` a `/historico`) y `TablaHistorico`. Con filtros inválidos pinta `EstadoError` con el texto de validación y no consulta. Los enlaces de página salen de `enlacePagina(filtros, pagina)` (`paginacion.ts`, función pura) y conservan los filtros. `loading.tsx` usa `Cargando`; un fallo del servidor lo cubre `(tablero)/error.tsx`.
8. **Semilla `db/seed/historico.sql`** (decisión #6). Crea «Nodo histórico demo» (`b15e0000-0000-4000-8000-000000000901`, ubicación «Laboratorio de datos») y los sensores «Medidor histórico A» (`…000000000911`) y «Medidor histórico B» (`…000000000912`), con `ON CONFLICT (id) DO NOTHING`. Lecturas con ids fijos `b15e0000-0000-4000-8000-0000000090NN`. Usa un prefijo propio porque las pruebas de las semillas de la HU 4 y de la topología cuentan sus filas por prefijo (decisión #11):
   - 26 del sensor A, cada 2 horas desde `2026-01-10 08:00-05` (la última, `2026-01-12 10:00-05`), con voltaje `120 + n/10`, corriente `5`, potencia `600`;
   - 2 del sensor B en el mismo rango (`2026-01-11 09:00-05` y `10:00-05`);
   - 2 del sensor A fuera del rango: `2026-01-09 23:30-05` (ya es 10 de enero en UTC) y `2026-01-13 00:30-05`.
   Con el filtro nodo 901 + sensor A + `2026-01-10` a `2026-01-12` hay exactamente 26 lecturas: 25 en la página 1 y 1 en la 2. Como la semilla crea su nodo, ordenar antes que `nodos.sql` no rompe la clave foránea.
9. **Menú** (decisión #9). `menu = { etiqueta: "Histórico", href: "/historico", roles: ["administrador", "tecnico"], orden: 15 }`, con el icono genérico.
10. **Contrato.** `GET /api/historico` con `security: sesion`, los cinco parámetros de consulta, respuesta 200 `HistoricoPagina` (esquemas `LecturaHistorico` y `HistoricoPagina`) y las respuestas compartidas 400 y 401, conservando las demás rutas.
11. **Interfaz.** Reutiliza de `src/modulos/ui/`: `Tarjeta`, `EstadoVacio` (vacío), `EstadoError` (filtros inválidos), `Cargando` (carga) y `formatoTension`, `formatoCorriente`, `formatoPotencia` con la clase `.cifra`; fechas con `formatearFecha`. Clases del sistema: `.tabla`, `.campo`, `.boton-primario`, `.enlace`, `text-tenue`. Sin colores sueltos. Los controles son nativos (`select`, `input type="date"`, enlaces) con `<label>` visible, así que el teclado y el foco funcionan sin JavaScript. No hay animaciones nuevas.

## Firmas

```ts
// src/modulos/historico/schema.ts  (sin server-only; sin uso en componentes cliente)
export const POR_PAGINA = 25;
export const filtrosHistoricoSchema: z.ZodType<FiltrosHistorico>;   // { nodoId?, sensorId?, desde?, hasta? }
export const consultaHistoricoSchema: z.ZodType<ConsultaHistorico>; // filtros + { pagina: number } (default 1)
export type FiltrosHistorico = { nodoId?: string; sensorId?: string; desde?: string; hasta?: string };
export type ConsultaHistorico = FiltrosHistorico & { pagina: number };

// src/modulos/historico/repo.ts  (import "server-only")
export type LecturaHistorico = {
  id: string; nodoId: string; nodoNombre: string; sensorId: string; sensorNombre: string;
  voltaje: number; corriente: number; potencia: number; tomadaEn: string; // ISO 8601
};
export async function contar(filtros: FiltrosHistorico): Promise<number>;
export async function listarPagina(filtros: FiltrosHistorico, pagina: number): Promise<LecturaHistorico[]>; // 25 por página

// src/modulos/historico/service.ts  (import "server-only")
export type { LecturaHistorico } from "./repo";
export type HistoricoPagina = { pagina: number; porPagina: number; total: number; totalPaginas: number; lecturas: LecturaHistorico[] };
export async function consultarHistorico(consulta: ConsultaHistorico): Promise<HistoricoPagina>;

// src/modulos/historico/paginacion.ts  (función pura)
export function enlacePagina(filtros: FiltrosHistorico, pagina: number): string; // "/historico?nodoId=…&pagina=2", omite los filtros ausentes

// src/app/api/historico/route.ts
export const GET: (req: Request, ctx: unknown) => Promise<Response>; // conHttp("/api/historico", ...)
// 200 HistoricoPagina · 400 { error, detalles } · 401

// src/modulos/historico/menu.ts
export const menu: ItemMenu; // { etiqueta: "Histórico", href: "/historico", roles: ["administrador", "tecnico"], orden: 15 }

// src/modulos/historico/ui/FiltrosHistorico.tsx  (sin "use client", síncrono)
export function FiltrosHistorico(props: {
  nodos: { id: string; nombre: string }[];
  sensores: { id: string; nodoId: string; nombre: string }[];
  valores: FiltrosHistorico;
}): JSX.Element;

// src/modulos/historico/ui/TablaHistorico.tsx  (sin "use client", síncrono)
export function TablaHistorico(props: { resultado: HistoricoPagina; filtros: FiltrosHistorico }): JSX.Element;
```

Selectores (`data-testid`):

- `filtros-historico`: el `<form>`; dentro, controles con etiqueta visible (ver textos).
- `tabla-historico`: la `<table>`; cada fila del cuerpo lleva `data-testid="lectura-historico"`.
- `historico-total`: el total de lecturas, con clase `cifra`.
- `historico-pagina`: el texto «Página X de Y».
- `pagina-anterior` y `pagina-siguiente`: los enlaces; se omiten en la primera y en la última página.

## Textos visibles

- Título de la página: «Histórico de lecturas»; subtítulo: «Lecturas de la red, la más reciente primero. Filtra por nodo, sensor y días (hora de Bogotá).»
- Etiquetas del formulario: «Nodo», «Sensor», «Desde», «Hasta»; opción por defecto de los selectores: «Todos»; cada sensor se lista como «<nodo> · <sensor>»; botón «Filtrar»; enlace «Limpiar filtros» a `/historico`.
- Encabezados de la tabla: «Fecha», «Nodo», «Sensor», «Voltaje», «Corriente», «Potencia».
- Fecha: `formatearFecha(tomadaEn)` (es-CO, hora de Bogotá, p. ej. «12/01/26, 10:00:00 a. m.»). Cifras: `formatoTension`, `formatoCorriente`, `formatoPotencia` (p. ej. «122,5 V», «5 A», «600 W»).
- Total: «<n> lecturas» (`historico-total` contiene solo el número); paginación: «Página <x> de <y>», «Anterior», «Siguiente».
- Vacío: `EstadoVacio` con título «No hay lecturas con estos filtros» y texto «Cambia los filtros o el rango de días.»
- Filtros inválidos: `EstadoError` con título «Filtros inválidos» y detalle «Revisa las fechas: deben tener el formato AAAA-MM-DD y "Desde" no puede ser posterior a "Hasta".»
- Carga: `Cargando` con la etiqueta «Cargando histórico…».
- Menú: «Histórico».

## Risks / Trade-offs

- [`OFFSET` crece con la página] → con 25 por página y los volúmenes de la demo es suficiente; la HU 16 tiene su propio tope de 10 000 filas.
- [El filtro por nodo sin sensor no usa el índice por sensor] → se acepta; la tabla de la demo es pequeña y el simulador continuo la poda.
- [El simulador continuo (si `SIM_AUTO_MS` está activo) poda las lecturas de más de 60 minutos salvo la última de cada sensor, incluidas las de la semilla] → en el CI no está activo; en la instancia pública, cada despliegue vuelve a sembrar las filas borradas (mismos ids, `ON CONFLICT DO NOTHING`). La prueba e2e corre en el CI.
- [El nodo de la semilla aparece en la lista de nodos y en el dashboard] → es un dato de demostración con nombre propio; las demás pruebas no cuentan nodos globales (CLAUDE.md §7).

## Migration Plan

Sin migración. La semilla se aplica con `npm run seed` y en el CD. Reversa: retirar la imagen; la semilla deja un nodo de demostración que se puede borrar desde la interfaz (borra sus sensores y lecturas en cascada).
