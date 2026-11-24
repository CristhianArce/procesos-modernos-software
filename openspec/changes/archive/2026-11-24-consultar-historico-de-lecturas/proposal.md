## Why

El dashboard (HU 5) muestra solo lo más reciente de cada sensor. Para analizar cómo se comportó un sensor en un periodo, un usuario con sesión necesita consultar el histórico de lecturas con filtros por nodo, sensor y fechas. Esta historia (#26, HU 9) agrega esa consulta paginada, por la API y en una página del tablero. La exportación a CSV queda en la HU 16, que reutilizará el esquema de filtros.

## What Changes

- Módulo `src/modulos/historico/` con `repo.ts` (solo lectura sobre `lecturas`, `sensores` y `nodos`: RN-1), `service.ts`, `schema.ts` (Zod: filtros reutilizables por la HU 16 y página, decisión #10) y `menu.ts`. Cubre CA-1 a CA-4.
- `GET /api/historico?nodoId&sensorId&desde&hasta&pagina`: cualquier usuario con sesión (401 sin ella: CA-5); 25 lecturas por página, la más reciente primero (CA-1, RN-2); filtros combinados con «y» (CA-2, RN-3); lista vacía si no hay resultados (CA-3, decisión #4); 400 con una fecha mal formada o `desde` posterior a `hasta` (CA-4). Los días se interpretan en la hora de Bogotá e incluyen ambos extremos (decisiones #1, #2, #3). Se agrega a `contracts/openapi.yaml`.
- Página `/historico` con un formulario de filtros `GET`, la tabla paginada y enlaces de página que conservan los filtros, sin componente cliente (decisión #8); estados de carga, error, vacío y validación. Ítem de menú «Histórico» (decisión #9). Cubre CA-1 a CA-4.
- Semilla `db/seed/historico.sql` autocontenida con un nodo, dos sensores y lecturas de fechas fijas para las pruebas e2e (decisión #6).
- Pruebas: unitarias (esquema, servicio, paginación, componentes y menú), de integración (repo y handler) y e2e (recorrido de filtros y páginas).

Fuera de alcance (issue #26): exportar a CSV (HU 16), gráficas del histórico y borrar o corregir lecturas. No hay migración: no se crean ni modifican tablas.

## Capabilities

### New Capabilities

- `historico-de-lecturas`: consulta paginada y filtrada del histórico de lecturas, por la API y en la página del tablero.

### Modified Capabilities

(ninguna: `dashboard-de-lecturas` y `simulador-de-lecturas` no cambian; el menú admite el ítem nuevo por `extension-modulos`)

## Impact

- **Código nuevo:** `src/modulos/historico/{schema,service,repo,menu,paginacion}.ts`, `ui/{FiltrosHistorico,TablaHistorico}.tsx`; `src/app/api/historico/route.ts`; `src/app/(tablero)/historico/{page,loading}.tsx`.
- **Datos:** sin migración. Semilla nueva `db/seed/historico.sql` (inserta su propio nodo, sensores y lecturas con ids fijos).
- **Contrato:** `contracts/openapi.yaml` (ruta `/api/historico`).
- **Lee sin modificar:** `listarNodos` y `listarTodosLosSensores` (opciones de los filtros) y las tablas `lecturas`, `sensores` y `nodos`.
- **Sin cambios** en el núcleo, en el módulo `lecturas` ni en otras páginas; sin dependencias nuevas.
