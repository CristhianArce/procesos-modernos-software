## Why

La ficha del nodo (HU 4) muestra sus datos, sensores y paneles, pero no dice quién responde por él. Un administrador necesita asignar un técnico a cada nodo para saber a quién acudir cuando falla, y la HU 11 (#43) necesita esa asignación para que solo el técnico asignado registre mantenimientos. Esta historia (#27, HU 10) agrega la asignación: un técnico por nodo, que reemplaza al anterior al reasignar.

## What Changes

- Tabla propia `nodo_tecnicos` (migración Flyway nueva) con un técnico como máximo por nodo; referencia `nodos` y `usuarios` sin modificarlas y se borra en cascada con el nodo (Derivado: decisión #2). Semilla `db/seed/nodos_tecnicos.sql` (Derivado: decisión #4). Cubre CA-1.
- Módulo `src/modulos/mantenimiento/` con `repo.ts`, `service.ts` y `schema.ts` (Zod). Cubre CA-1 a CA-3.
- `PUT /api/mantenimiento/nodos/{id}/tecnico` con cuerpo `{ "tecnicoId": "<uuid>" }`: solo administradores (CA-4), 400 si el usuario no es técnico y 404 si no existe (CA-2), 404 si el nodo no existe (CA-3), y 200 con la asignación resultante (CA-1). Se agrega a `contracts/openapi.yaml` (Derivado: decisión #1, #3).
- Panel «Técnico asignado» en la ficha del nodo, declarado en `paneles.ts` sin editar la página de la ficha (RN-2): ambos roles ven el técnico asignado; solo el administrador ve el selector de técnicos y el botón «Asignar» (CA-1, CA-4; Derivado: decisión #5).
- Pruebas: unitarias de esquema, servicio, semilla, componentes y registro; de integración del repo y del handler; y e2e del flujo del administrador y del técnico.

Fuera de alcance (issue #27): registrar mantenimientos y su historial (HU 11), notificar al técnico de su asignación, varios técnicos por nodo, quitar la asignación sin reemplazarla y el historial de asignaciones. No se agrega ítem de menú.

## Capabilities

### New Capabilities

- `asignacion-de-tecnicos`: asignar un técnico a un nodo desde su ficha o por la API, con un técnico como máximo por nodo, validación del usuario asignado, nodo inexistente y permisos por rol.

### Modified Capabilities

(ninguna: la ficha ya admite paneles de otros módulos por `extension-modulos`, y `nodos-y-sensores` e `inicio-de-sesion` no cambian)

## Impact

- **Código nuevo:** `src/modulos/mantenimiento/{schema,service,repo,paneles}.ts` y `ui/{PanelTecnico,TecnicoAsignado,AsignarTecnico}.tsx`; `src/app/api/mantenimiento/nodos/[id]/tecnico/route.ts`.
- **Datos:** migración `db/migration/V202611242330__nodo_tecnicos.sql` y semilla `db/seed/nodos_tecnicos.sql`. Solo se leen `nodos` (con el servicio de `nodos`) y `usuarios`.
- **Contrato:** `contracts/openapi.yaml` (ruta `/api/mantenimiento/nodos/{id}/tecnico`).
- **Sin cambios** en el núcleo, en la página de la ficha ni en los módulos `nodos` y `auth`; sin dependencias nuevas.
