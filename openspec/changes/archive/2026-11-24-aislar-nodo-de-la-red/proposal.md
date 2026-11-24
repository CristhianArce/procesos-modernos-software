## Why

La ficha del nodo (HU 4) muestra si un nodo está conectado o desconectado, pero nadie puede cambiar ese estado: el esquema de edición de nodos lo excluye a propósito («lo cambia la HU 6»). Un administrador necesita cortar el suministro de un tramo con falla y volver a conectarlo sin tocar el resto de la red. Esta historia (#23, HU 6) agrega esas dos transiciones, simuladas: solo cambian el estado guardado del tablero, sin órdenes a equipos reales.

## What Changes

- Módulo `src/modulos/aislamiento/` con `repo.ts` (actualiza únicamente la columna `nodos.estado`, la excepción acotada de RN-5 y de la decisión 4 del issue), `service.ts` y `schema.ts` (Zod). Cubre CA-1, CA-2 y CA-4.
- `PATCH /api/aislamiento/nodos/{id}` con cuerpo `{ "estado": "conectado" | "desconectado" }`: solo administradores (CA-3), 404 si el nodo no existe sin tocar a los demás (CA-4) y 200 idempotente si el nodo ya está en el destino pedido (Derivado: decisión #1). Se agrega a `contracts/openapi.yaml`. Cubre CA-1 a CA-4.
- Panel «Aislamiento» en la ficha del nodo, declarado en `paneles.ts` (sin editar la página de la ficha): el administrador ve «Aislar nodo» o «Reconectar nodo» según el estado, un paso de confirmación y la ficha se actualiza sin recargar; el técnico no ve botones. Cubre CA-1, CA-2 y CA-3.
- Pruebas: unitarias de servicio, esquema y control; de integración del repo y del handler; y e2e del flujo completo (administrador y técnico).

Fuera de alcance (issue #23): aislar varios nodos a la vez, notificar a los técnicos, operar equipos reales, que el simulador omita los nodos desconectados y registrar quién o cuándo cambió el estado (RN-3, RN-4). No hay migración ni semilla nueva ni ítem de menú.

## Capabilities

### New Capabilities

- `aislamiento-de-nodos`: comportamiento observable de aislar y reconectar un nodo (API y ficha): transiciones de estado con confirmación, permisos por rol y nodo inexistente.

### Modified Capabilities

(ninguna: la ficha ya admite paneles de otros módulos por `extension-modulos` y la edición de nodos de HU 4 no cambia)

## Impact

- **Código nuevo:** `src/modulos/aislamiento/{schema,service,repo,paneles}.ts` y `ui/{PanelAislamiento,ControlAislamiento}.tsx`; `src/app/api/aislamiento/nodos/[id]/route.ts`.
- **Datos:** ninguna migración ni semilla; el `repo.ts` solo ejecuta `UPDATE nodos SET estado` sobre una tabla de HU 4 (excepción documentada).
- **Contrato:** `contracts/openapi.yaml` (ruta `/api/aislamiento/nodos/{id}`).
- **Sin cambios** en el núcleo, en la página de la ficha, en el módulo `nodos` ni en el simulador; sin dependencias nuevas.
