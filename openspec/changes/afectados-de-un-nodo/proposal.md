## Why

Antes de aislar un nodo o atender una falla, el administrador y el técnico necesitan saber a quién afecta. Hoy la ficha del nodo (HU 4) muestra sus sensores, el simulador y el aislamiento, pero no quién depende de él. Esta historia (#25, HU 8) agrega la tabla de afectados, su consulta por la API y un panel de solo lectura en la ficha. Un afectado es un alias ficticio asociado a un nodo (RN-3); agregarlos y quitarlos queda para las HU 14 y 15.

## What Changes

- Migración Flyway con la tabla propia `nodo_usuarios(id, nodo_id, alias, creado_en)`, que referencia `nodos` con borrado en cascada (RN-1) y sin unicidad del alias (RN-4). Semilla `db/seed/nodos_afectados.sql` con `Usuario demo 02` en `Subestación Sur`, que se aplica después de `nodos.sql` (Derivado: decisión #2, #4, #5).
- Módulo `src/modulos/afectados/` con `repo.ts`, `service.ts` y `schema.ts`: lista los afectados de un nodo en orden de creación con su total, o 404 si el nodo no existe (CA-1, CA-3; Derivado: decisión #1).
- `GET /api/afectados?nodoId=<uuid>` para administrador y técnico, que responde `{ total, afectados }`; se agrega a `contracts/openapi.yaml` (CA-2, CA-3; Derivado: decisión #3).
- Panel «Afectados» en la ficha del nodo, declarado en `paneles.ts` sin editar la página de la ficha (RN-2): muestra el total y la lista, o un estado vacío con total 0 (CA-1, CA-2).
- Pruebas unitarias, de integración (repo, semilla y handler) y e2e (administrador y técnico).

Fuera de alcance (issue #25): agregar o quitar afectados (HU 14 y 15), notificarlos, calcularlos desde la topología, importarlos, datos personales reales y evitar duplicados. No hay ítem de menú.

## Capabilities

### New Capabilities

- `afectados-de-nodos`: consulta de los afectados de un nodo (API y panel de la ficha): lista y total, roles con acceso y nodo inexistente.

### Modified Capabilities

(ninguna: la ficha ya admite paneles de otros módulos por `extension-modulos`)

## Impact

- **Código nuevo:** `src/modulos/afectados/{schema,service,repo,paneles}.ts` y `ui/PanelAfectados.tsx`; `src/app/api/afectados/route.ts`.
- **Datos:** migración `db/migration/V202611240500__afectados.sql` (tabla propia, sin tocar `nodos`) y semilla `db/seed/nodos_afectados.sql`.
- **Contrato:** `contracts/openapi.yaml` (ruta `/api/afectados`).
- **Sin cambios** en el núcleo, en la página de la ficha ni en el módulo `nodos`; sin dependencias nuevas.
