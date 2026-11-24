## Why

El histórico de lecturas (HU 9) se consulta en páginas de 25 dentro del tablero, pero no se puede sacar para analizarlo en una hoja de cálculo. Esta historia (#56, HU 16) sale de dividir la HU 9: agrega la exportación a CSV de las lecturas que cumplen el filtro aplicado.

## What Changes

- Serializador CSV propio (`src/modulos/historico/csv.ts`, sin librerías): encabezado `nodo,sensor,voltaje,corriente,potencia,fecha` separado por comas, una fila por lectura con el nombre del nodo y del sensor, fecha ISO 8601 en UTC y escape de fórmulas. Cubre CA-1 y CA-2 (Derivado: decisión #1, #2, #4, #5).
- Consulta de exportación en `repo.ts` de `historico` con el mismo filtro y orden que la HU 9 y un tope de 10 000 lecturas (RN-4, RN-5). Cubre CA-1 y CA-2 (Derivado: decisión #7).
- `GET /api/historico/exportar` con los filtros de la HU 9: responde `text/csv` como descarga, 400 por Zod con una fecha mal formada o un rango invertido y 401 en JSON sin sesión. Se agrega a `contracts/openapi.yaml`. Cubre CA-1 a CA-4 (Derivado: decisión #3).
- Enlace «Exportar CSV» en la tabla del histórico, con los filtros aplicados. Cubre CA-1 (Derivado: decisión #6).

Fuera de alcance (issue #56): la consulta paginada y los filtros (HU 9), otros formatos, gráficas y avisar al llegar al tope. Sin migración, sin semilla nueva (la e2e usa `db/seed/historico.sql` de la HU 9) y sin puntos de extensión.

## Capabilities

### New Capabilities

- `exportacion-de-historico`: comportamiento observable de la exportación a CSV del histórico de lecturas (contenido y formato del archivo, filtro, tope, validación y acceso).

### Modified Capabilities

(ninguna: `historico-de-lecturas` conserva su consulta paginada; esta historia solo reutiliza su filtro)

## Impact

- **Código nuevo:** `src/modulos/historico/{csv,exportar}.ts`, función `listarParaExportar` en `repo.ts`, función `exportarHistorico` en `service.ts`, `src/app/api/historico/exportar/route.ts`.
- **Código modificado:** `src/modulos/historico/ui/TablaHistorico.tsx` (enlace de exportación); la página de la HU 9 no se edita.
- **Contrato:** `contracts/openapi.yaml` (ruta `/api/historico/exportar`).
- **Datos:** solo lectura de `lecturas`, `sensores` y `nodos` (RN-1); sin migración ni semilla.
