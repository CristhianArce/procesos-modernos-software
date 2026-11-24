# Proposal

## Why

Hoy solo se ven las últimas lecturas de cada sensor (tablero y `GET /api/lecturas`, tope de 100). Un usuario no puede revisar el comportamiento de un sensor en el tiempo ni acotarlo por nodo o fechas. La HU 9 (#26) agrega una consulta paginada con filtros; la exportación a CSV queda para la HU 16, que reutilizará el esquema de filtros.

## What Changes

- Nueva API `GET /api/historico` con filtros opcionales por nodo, sensor y rango de fechas, paginada de 25 en 25, de la lectura más reciente a la más antigua (CA-1, CA-2).
- Rango de fechas con inicio inclusivo y fin exclusivo (CA-2; Derivado: decisión #1).
- Fechas en ISO 8601 con hora en UTC; una fecha mal formada o un rango con inicio posterior al fin responde 400 por Zod (CA-4; Derivado: decisión #2).
- Lecturas con la misma fecha se desempatan por identificador descendente (CA-1; Derivado: decisión #3).
- Un filtro sin coincidencias devuelve la lista vacía, no un error (CA-3).
- Sin sesión, la API responde 401 en JSON (CA-5).
- Nueva página `/historico` con formulario de filtros, tabla paginada y estados de carga, error y vacío, y un ítem de menú por `menu.ts` (CA-1, CA-2, CA-3).
- Solo lectura sobre `lecturas`, `sensores` y `nodos`: sin migración (RN-1).

## Capabilities

### New Capabilities

- `historico-lecturas`: consulta paginada y filtrada del histórico de lecturas, por API y por página.

### Modified Capabilities

<!-- Ninguna: `acceso-tablero` e `extension-modulos` se usan tal cual, sin cambiar sus requisitos. -->

## Impact

- Código nuevo: `src/modulos/historico/{schema,service,repo,menu}.ts` y `ui/`, `src/app/api/historico/route.ts`, `src/app/(tablero)/historico/page.tsx`.
- Contrato: se agrega `/api/historico` (GET) a `contracts/openapi.yaml`, conservando las demás rutas.
- Datos: sin migración, sin tablas nuevas y sin semilla (las pruebas e2e crean sus propias lecturas).
- Dependencias: ninguna librería nueva. Lee `lecturas`, `sensores` y `nodos` (HU 4) y la sesión (HU 3).
- No toca el módulo `lecturas` ni el núcleo.
