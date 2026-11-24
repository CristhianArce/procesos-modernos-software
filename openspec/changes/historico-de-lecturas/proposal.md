## Why

Hoy las lecturas solo se ven como las 50 más recientes de cada sensor en el dashboard (#22). Quien quiere analizar el comportamiento de un sensor en un periodo no tiene dónde hacerlo. Esta historia (#26, HU 9) agrega el histórico de lecturas: una consulta paginada de 25 en 25, con la más reciente primero y filtros por nodo, sensor y rango de fechas. La exportación a CSV es la HU 16 (#56) y depende de esta.

## What Changes

- Módulo nuevo `src/modulos/historico/` que solo lee `lecturas` (con `sensores` y `nodos` para los nombres): repo con una consulta paginada y su conteo, servicio que arma la página de resultados y `schema.ts` con los filtros validados con Zod, en un archivo reutilizable por la HU 16. Cubre CA-1, CA-2 y CA-3 (Derivado: decisión #4, #5, #6).
- `GET /api/historico` con sesión de administrador o técnico (401 en JSON sin sesión) y los parámetros `nodoId`, `sensorId`, `desde`, `hasta` (ISO 8601 en UTC) y `pagina`; 400 con el detalle de Zod si una fecha está mal formada o `desde` es posterior a `hasta`. Cubre CA-4 y CA-5 (Derivado: decisión #1, #2, #8).
- Orden de la consulta: fecha descendente y, a igual fecha, identificador descendente; los extremos del rango son inclusivos. Cubre CA-1 y CA-2 (Derivado: decisión #1, #3).
- Página `/historico` (Server Component dinámico) con formulario de filtros, tabla de lecturas y paginador, con estados de carga, error y vacío. Cubre CA-1, CA-2 y CA-3 (Derivado: decisión #7).
- Entrada "Histórico" en el menú por `menu.ts` (Derivado: decisión #10).
- Semilla `db/seed/historico.sql` con lecturas de marzo de 2026 para la prueba e2e (Derivado: decisión #9), y la ruta nueva en `contracts/openapi.yaml`, conservando las existentes.

Fuera de alcance (issue #26): exportar a CSV (HU 16), gráficas del histórico y borrar o corregir lecturas. No se crean tablas ni migraciones y no se toca el núcleo.

## Capabilities

### New Capabilities

- `historico-de-lecturas`: consulta paginada de las lecturas con filtros por nodo, sensor y rango de fechas, por la API y por la página `/historico`.

### Modified Capabilities

(ninguna: `acceso-tablero` y `extension-modulos` ya cubren la sesión y el menú; esta historia los usa sin cambiarlos)

## Impact

- **Datos:** sin migración. Semilla `db/seed/historico.sql` (nodos, sensores y lecturas de demostración propios; no modifica filas ajenas).
- **Código nuevo:** `src/modulos/historico/`, `src/app/api/historico/route.ts`, `src/app/(tablero)/historico/{page,loading}.tsx` y `e2e/historico.spec.ts`.
- **Contrato:** `contracts/openapi.yaml` (ruta `/api/historico` y los esquemas `LecturaHistorico` y `PaginaHistorico`).
- **Puntos de extensión:** `menu.ts` de `historico`.
- **Sin cambios** en el núcleo (`proxy.ts`, `src/lib/`, layout del tablero, `src/nav/`, `src/shell/`), en los módulos de otras historias ni dependencias nuevas.
