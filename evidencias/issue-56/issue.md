# Issue #56: HU 16: Exportar el histórico de lecturas a CSV

Estado: OPEN
Etiquetas: historia, clase

## Historia

Como usuario autenticado quiero exportar a CSV las lecturas del histórico que cumplen mi filtro para analizarlas fuera del tablero.

## Contexto

**HU 16: Exportar el histórico de lecturas a CSV**, fila 16 de [la propuesta](../propuesta.md), §5.
Esta historia sale de dividir la HU 9 ([#26](https://github.com/CristhianArce/procesos-modernos-software/issues/26), "Consultar el histórico de lecturas y exportarlo a CSV") en dos: la HU 9 conserva la consulta paginada con filtros y aquí queda la exportación. CA-1 es el CA-3 de #26; CA-2 es la mitad de exportar del CA-4; CA-3 es la mitad de exportar del CA-5 y CA-4 es la mitad de exportar del CA-6.
El proyecto simula una red eléctrica, sin controlar equipos reales. Reutiliza los filtros y la consulta de la HU 9 y las lecturas de la HU 4.

## Criterios de aceptación

- **CA-1:** Dado un filtro aplicado en el histórico, cuando el usuario exporta, entonces descarga un archivo CSV con las lecturas que cumplen ese filtro.
- **CA-2:** Dado un filtro sin resultados, cuando se exporta, entonces el CSV trae solo la fila de encabezado.
- **CA-3:** Dada una fecha mal formada o un rango con la fecha inicial posterior a la final, cuando se exporta, entonces la API responde 400 por la validación de Zod.
- **CA-4:** Dado un visitante sin sesión, cuando exporta el histórico por la API, entonces recibe 401 en JSON.

## Reglas de negocio

- **RN-1:** La historia solo lee `lecturas`; no escribe ni modifica ninguna tabla.
- **RN-2:** Un valor del CSV que empiece por `=`, `+`, `-` o `@` se escapa para que una hoja de cálculo no lo ejecute como fórmula.
- **RN-3:** El CSV tiene las columnas nodo, sensor, voltaje, corriente, potencia y fecha, en ese orden. La fecha va en ISO 8601 en UTC.
- **RN-4:** La exportación devuelve como máximo las 10 000 lecturas más recientes que cumplen el filtro. El tope acota la consulta; la interfaz no muestra aviso.
- **RN-5:** El filtro (nodo, sensor y rango de fechas) tiene el mismo significado que en la HU 9.

## Fuera de alcance

- La consulta paginada y los filtros (los cubre la HU 9).
- Exportar a otros formatos (PDF, Excel).
- Gráficas del histórico.
- Aviso al usuario cuando la exportación llega al tope de filas.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/historico/` (el de la HU 9). Esta historia agrega el botón "Exportar CSV" a la página del histórico y la ruta de exportación.
- Endpoint sugerido: `GET /api/historico/exportar` con los mismos filtros como parámetros y respuesta `text/csv` (se agrega a `contracts/openapi.yaml`). Reutiliza el esquema de filtros de la HU 9.
- Datos: sin tablas nuevas ni migración; sin semilla propia. SQL solo en `repo.ts`.
- Puntos de extensión: ninguno.
- La prueba del escape de RN-2 y la de las columnas de RN-3 se hacen con los tipos reales, sin reutilizar el serializador de producción como oráculo.

### E2E futuro (no ejecutado)

Preparación: navegador, servidor y BD de prueba aislada reales, con la semilla de la HU 9: `26` lecturas coincidentes y distractores por nodo, sensor y fecha, con fechas distintas y estrictamente interiores o exteriores al rango.

1. Iniciar sesión, aplicar los filtros de nodo, fecha y sensor y exportar.
2. Parsear el CSV descargado y comparar encabezados, las 26 filas y su orden completo (más reciente primero) contra una expectativa fija de la semilla, no contra la pantalla.

Cobertura del recorrido: **CA-1**. **CA-2**, **CA-3** y **CA-4** se cubren con pruebas de integración del handler; RN-2, con una prueba específica de escape.

## Decisiones de la HU 4 que aplican

- **Magnitudes por lectura (decisión 2):** una fila del CSV es una lectura con voltaje, corriente y potencia.
- **Borrado en cascada (decisión 5):** al eliminar un nodo o un sensor se eliminan sus lecturas, así que dejan de aparecer en la exportación.
- **Nombres sin unicidad (decisión 8):** los filtros usan el identificador, no el nombre.

## Dependencias

- HU 9 ([#26](https://github.com/CristhianArce/procesos-modernos-software/issues/26)): consulta paginada, filtros y página del histórico.
- HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)): lecturas, sensores y nodos.
- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20)): sesión.

## Preguntas abiertas

Ninguna. Se heredan las decisiones de la HU 9 (columnas, tope de 10 000 filas, ISO 8601 en UTC).

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.

## Criterios numerados

- CA-1: Dado un filtro aplicado en el histórico, cuando el usuario exporta, entonces descarga un archivo CSV con las lecturas que cumplen ese filtro.
- CA-2: Dado un filtro sin resultados, cuando se exporta, entonces el CSV trae solo la fila de encabezado.
- CA-3: Dada una fecha mal formada o un rango con la fecha inicial posterior a la final, cuando se exporta, entonces la API responde 400 por la validación de Zod.
- CA-4: Dado un visitante sin sesión, cuando exporta el histórico por la API, entonces recibe 401 en JSON.
