## Why

Con el login de la HU 3 ya hay roles, pero el tablero no tiene nada que mostrar: no existen nodos, sensores ni lecturas. Esta historia (#21, HU 4) crea esos datos, su API, la ficha del nodo donde las demás historias enchufan sus paneles y un simulador de lecturas, para probar el tablero sin hardware real.

## What Changes

- Tablas `nodos`, `sensores` y `lecturas` con su migración Flyway, y semillas `db/seed/nodos.sql` y `db/seed/sensores.sql` (esta última incluye las lecturas de demostración). Cubre CA-1, CA-2, CA-6 y CA-7 (Derivado: decisión #1, #2, #3, #5, #17).
- Módulo `src/modulos/nodos/`: crear, listar, consultar, editar y eliminar nodos. Un nodo nuevo nace `conectado`. Rutas `GET|POST /api/nodos` y `GET|PATCH|DELETE /api/nodos/{id}`. Cubre CA-1, CA-3, CA-4 y CA-5.
- Módulo `src/modulos/sensores/`: lo mismo para los sensores de un nodo, con un umbral máximo opcional por magnitud. Rutas `GET|POST /api/sensores` y `GET|PATCH|DELETE /api/sensores/{id}`. Cada sensor trae su última lectura. Cubre CA-2 a CA-6 (Derivado: decisión #3, #18).
- Módulos `src/modulos/lecturas/` y `src/modulos/simulador/`: `POST /api/simulador` registra una lectura de voltaje, corriente y potencia por cada sensor del nodo indicado. Cubre CA-6 (Derivado: decisión #2, #4, #7, #9, #10, #11, #15).
- Permisos: el técnico consulta (lista, ficha, sensores y última lectura); crear, editar, eliminar y simular exigen el rol administrador. Cubre CA-5 (Derivado: decisión #6, #11).
- Páginas `/nodos` (lista y formulario de creación) y `/nodos/{id}` (ficha con los datos del nodo y los paneles registrados). Los sensores y el botón del simulador son paneles declarados por sus módulos. Entrada "Nodos" en el menú. Cubre CA-1, CA-2, CA-6 y CA-7 (Derivado: decisión #12, #19).
- Las nueve operaciones se agregan a `contracts/openapi.yaml`, conservando las rutas existentes.

Fuera de alcance (issue #21): cambiar el estado del nodo desde la interfaz (HU 6), alertas por umbral y gráficas (HU 5), histórico con filtros y exportación (HU 9). Tampoco se agregan el temporizador del simulador (decisión #7), el contador opcional `simulador_lecturas_total` (decisión #16) ni formularios de edición o eliminación en la interfaz (decisión #12).

## Capabilities

### New Capabilities

- `nodos-y-sensores`: administración de nodos y sensores por la API y la interfaz, validación, identificadores inexistentes, permisos por rol y ficha del nodo con paneles.
- `simulador-de-lecturas`: generación de lecturas simuladas por nodo y consulta de la última lectura de cada sensor.

### Modified Capabilities

(ninguna: `inicio-de-sesion` no cambia; esta historia usa su sesión y sus roles)

## Impact

- **Datos:** migración `V202611222130__nodos_sensores_lecturas.sql` (tres tablas nuevas, sin tocar `usuarios`) y semillas `db/seed/nodos.sql` y `db/seed/sensores.sql`.
- **Código nuevo:** `src/modulos/{nodos,sensores,lecturas,simulador}/`, `src/app/api/{nodos,sensores,simulador}/`, `src/app/(tablero)/nodos/` y `e2e/nodos.spec.ts`.
- **Contrato:** `contracts/openapi.yaml` (cinco rutas nuevas).
- **Puntos de extensión:** `menu.ts` de `nodos` y `paneles.ts` de `sensores` y `simulador`. Primera página que muestra `registro.paneles`.
- **Sin cambios** en el núcleo (`proxy.ts`, `src/lib/`, layout del tablero, `src/nav/`) ni dependencias nuevas.
