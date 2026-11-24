## Why

Antes de aislar un nodo o atender una falla, el administrador o el técnico necesita saber a quién afecta. Hoy la ficha del nodo (HU 4) no dice qué usuarios o dispositivos dependen de él. Esta historia (#25, HU 8) agrega la tabla de afectados, su consulta por la API y un panel de solo lectura en la ficha. Agregar afectados (HU 14) y quitarlos (HU 15) quedan fuera.

## What Changes

- Tabla propia `nodo_usuarios(id, nodo_id, alias, creado_en)` con migración Flyway: cada afectado es un alias ficticio de un solo nodo (RN-1, RN-3), sin unicidad (RN-4), borrado en cascada con el nodo (Derivado: decisión #7) y alias de 1 a 80 caracteres (Derivado: decisión #4). Cubre CA-1 y CA-3.
- Semilla `db/seed/nodos_usuarios.sql`: «Subestación Sur» con `Usuario demo 02` y «Subestación Norte» sin afectados (Derivado: decisión #2, #6). Cubre CA-1 y CA-3.
- Módulo `src/modulos/afectados/` con `repo.ts` (SQL, lista ordenada por alias y luego por id: decisión #1), `service.ts` (404 si el nodo no existe) y `schema.ts` (Zod). Cubre CA-1 y CA-3.
- `GET /api/afectados?nodoId=<uuid>`: administrador y técnico; 200 con `{ total, afectados: [{ id, alias }] }`, 404 si el nodo no existe, lista vacía y total 0 si no tiene afectados, 400 con un `nodoId` mal formado (Derivado: decisión #3). Se agrega a `contracts/openapi.yaml`. Cubre CA-2 y CA-3.
- Panel «Afectados» en la ficha del nodo declarado en `paneles.ts` (RN-2, sin editar la página de la HU 4), con el total y la lista y sus estados de carga, error y vacío (Derivado: decisión #5). Cubre CA-1 y CA-2.
- Pruebas unitarias (esquema, servicio, lista, semilla y extensiones), de integración (repo y handler) y e2e (administrador y técnico).

Fuera de alcance (issue #25): agregar o quitar afectados (HU 14 y 15), notificarlos, calcularlos desde la topología, importarlos de un archivo, datos personales reales y evitar duplicados.

## Capabilities

### New Capabilities

- `afectados-de-nodos`: consulta de los afectados de un nodo por la API y panel de solo lectura en su ficha, con el total y la lista.

### Modified Capabilities

(ninguna: la ficha ya admite paneles por `extension-modulos` y la tabla `nodos` no cambia)

## Impact

- **Código nuevo:** `src/modulos/afectados/{schema,service,repo,paneles}.ts` y `ui/{PanelAfectados,ListaAfectados}.tsx`; `src/app/api/afectados/route.ts`.
- **Datos:** migración `db/migration/V202611241700__afectados.sql` (tabla nueva) y semilla `db/seed/nodos_usuarios.sql`. Solo se lee `nodos` (por el servicio de nodos) sin modificarla.
- **Contrato:** `contracts/openapi.yaml` (ruta `/api/afectados`).
- **Sin cambios** en el núcleo, en la página de la ficha ni en el módulo `nodos`; sin dependencias nuevas.
