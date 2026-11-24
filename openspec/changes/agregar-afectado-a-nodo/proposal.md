## Why

Antes de actuar sobre un nodo con falla o con corte, un administrador necesita registrar a quién afecta. Esta historia (#54, HU 14) agrega el alta de un afectado (un alias ficticio) a un nodo desde su ficha. Sale de dividir la HU 8 (#25), que todavía no está fusionada: por eso esta historia crea lo mínimo que necesita (tabla, módulo y panel con lista y total), y la HU 8 lo reutilizará (Derivado: decisión #2).

## What Changes

- Migración `nodo_usuarios` (id, nodo_id con borrado en cascada, alias, creado_en), sin unicidad del alias (RN-4) y sin semilla (Derivado: decisión #2, #4). Cubre CA-1.
- Módulo `src/modulos/afectados/` con `repo.ts`, `service.ts` y `schema.ts` (Zod: alias obligatorio, recortado, de 1 a 100 caracteres; `nodoId` UUID). Cubre CA-1, CA-2 y CA-3 (Derivado: decisión #1).
- `POST /api/afectados` con `{ nodoId, alias }`: solo administradores (CA-4), 400 por Zod (CA-2), 404 si el nodo no existe (CA-3), 201 con el afectado creado (CA-1). Se agrega a `contracts/openapi.yaml` (Derivado: decisión #3).
- Panel «Afectados» en la ficha del nodo, declarado en `paneles.ts` (RN-2): lista de alias, total y, solo para el administrador, el formulario «Agregar afectado». Cubre CA-1 y CA-4.
- Pruebas: unitarias de esquema, servicio, formulario y extensión; de integración del repo y del handler; y e2e del alta y del técnico.

Fuera de alcance (issue #54): quitar afectados (HU 15), notificar, calcular afectados por topología, importar desde archivo, evitar duplicados y un `GET` en la API (la consulta por API es de la HU 8).

## Capabilities

### New Capabilities

- `afectados-de-nodo`: alta de un afectado (alias ficticio) en un nodo por la API y desde el panel de la ficha, con su validación, el nodo inexistente y el permiso por rol.

### Modified Capabilities

(ninguna: la ficha ya admite paneles de otros módulos por `extension-modulos`)

## Impact

- **Código nuevo:** `src/modulos/afectados/{schema,service,repo,paneles}.ts` y `ui/{PanelAfectados,FormularioAfectado}.tsx`; `src/app/api/afectados/route.ts`.
- **Datos:** `db/migration/V202611240600__nodo_usuarios.sql` (tabla propia nueva; no modifica tablas ajenas). Sin semilla.
- **Contrato:** `contracts/openapi.yaml` (ruta `/api/afectados`).
- **Sin cambios** en el núcleo, en la página de la ficha ni en el módulo `nodos`; sin dependencias nuevas.
