# Proposal

## Why

Hoy las lecturas solo se ven en el tablero (últimas por sensor y gráficas recientes). Un usuario autenticado no puede analizar el comportamiento de un sensor en el tiempo: no hay una consulta paginada ni filtros por nodo, sensor o fechas (issue #26, HU 9). La HU 16 (exportación a CSV) necesita además un esquema de filtros reutilizable.

## What Changes

- Nueva API `GET /api/historico` con filtros opcionales `nodoId`, `sensorId`, `desde`, `hasta` y `pagina`, que devuelve las lecturas de 25 en 25, la más reciente primero (CA-1, CA-2). Solo lee `lecturas` (RN-1).
- Orden determinista `tomada_en DESC, id DESC` (CA-1; Derivado: decisión #2).
- Los extremos del rango de fechas son inclusivos ambos (CA-2; Derivado: decisión #1).
- Un filtro sin coincidencias, o una página más allá de la última, responde 200 con la lista vacía y el total real (CA-3; Derivado: decisión #3).
- Una fecha mal formada o un rango con `desde` posterior a `hasta` responde 400 por la validación de Zod (CA-4).
- Sin sesión, la API responde 401 en JSON (CA-5).
- Nueva página `/historico` con filtros, tabla paginada y estados de carga, error y vacío, y un ítem de menú declarado en `menu.ts` (CA-1 a CA-3).
- El esquema de filtros vive en un archivo propio, sin lógica de servidor, para que la HU 16 lo reutilice.
- Filtros por identificador, no por nombre (RN-3). Tamaño de página fijo de 25 (RN-2).
- Sin migración ni tablas nuevas (RN-1); no hace falta semilla propia porque la historia no agrega datos.

## Capabilities

### New Capabilities

- `historico-lecturas`: consulta paginada de lecturas con filtros por nodo, sensor y rango de fechas, protegida por sesión, con su página y su ruta de API.

### Modified Capabilities

<!-- Ninguna: no cambia el comportamiento de capacidades ya especificadas; `GET /api/lecturas` queda intacto. -->

## Impact

- Código nuevo en `src/modulos/historico/` (`schema.ts`, `repo.ts`, `service.ts`, `menu.ts`, `ui/`, `__tests__/`), `src/app/api/historico/route.ts` y `src/app/(tablero)/historico/page.tsx`.
- `contracts/openapi.yaml`: se agrega `/api/historico` sin tocar las rutas de otras historias.
- Pruebas unitarias, de integración (handler con `Request` y repo con BD) y e2e (`e2e/`).
- Lee las tablas `lecturas` y `sensores` (para filtrar por nodo) y reutiliza `listarNodos` y `listarTodosLosSensores` para los selectores; no modifica nada ajeno.
- Dependencias: HU 3 (sesión) y HU 4 (lecturas), ya presentes en el repositorio.
