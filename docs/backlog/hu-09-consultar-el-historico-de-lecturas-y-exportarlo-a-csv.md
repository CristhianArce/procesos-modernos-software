## Historia

Como usuario autenticado quiero consultar el histórico de lecturas con filtros y exportarlo a CSV para analizar el comportamiento de un sensor fuera del tablero.

## Contexto

**HU 9: Consultar el histórico de lecturas y exportarlo a CSV**, fila 9 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#26](https://github.com/CristhianArce/procesos-modernos-software/issues/26); documento canónico: `docs/backlog/hu-09-consultar-el-historico-de-lecturas-y-exportarlo-a-csv.md` ([main fijado](https://github.com/CristhianArce/procesos-modernos-software/blob/6134fcef5867ad08149450e024b5069a3a761843/docs/backlog/hu-09-consultar-el-historico-de-lecturas-y-exportarlo-a-csv.md)).
El proyecto simula una red eléctrica, sin controlar equipos reales. Esta HU requiere las lecturas y relaciones de HU 4, cuyo modelo ya está decidido en #21; no se afirma que sus tablas o el login de HU 3 ya estén implementados.
Se conservan íntegramente el E2E y la dependencia adicional de HU 4 ya publicados en #26, así como sus seis CA; las cuatro preguntas abiertas ya están resueltas en "Decisiones tomadas". El escenario continúa diseñado y no ejecutado.

## Criterios de aceptación

- **CA-1:** Dado un usuario con sesión y lecturas registradas, cuando abre el histórico, entonces ve las lecturas paginadas de 25 en 25 con la más reciente primero.
- **CA-2:** Dado un filtro por nodo, por sensor o por rango de fechas, cuando se aplica, entonces solo aparecen las lecturas que cumplen todas las condiciones.
- **CA-3:** Dado un filtro aplicado, cuando el usuario exporta, entonces descarga un archivo CSV con las lecturas que cumplen ese filtro.
- **CA-4:** Dado un filtro sin resultados, cuando se consulta o se exporta, entonces la lista queda vacía y el CSV trae solo la fila de encabezado.
- **CA-5:** Dada una fecha mal formada o un rango con la fecha inicial posterior a la final, cuando se consulta o se exporta, entonces la API responde 400 por la validación de Zod.
- **CA-6:** Dado un visitante sin sesión, cuando consulta o exporta el histórico por la API, entonces recibe 401 en JSON.

## Reglas de negocio

- **RN-1:** La historia solo lee `lecturas`; no escribe ni modifica ninguna tabla.
- **RN-2:** Un valor del CSV que empiece por `=`, `+`, `-` o `@` se escapa para que una hoja de cálculo no lo ejecute como fórmula.
- **RN-3:** El histórico muestra 25 lecturas por página.
- **RN-4:** El CSV tiene las columnas nodo, sensor, voltaje, corriente, potencia y fecha, en ese orden. La fecha va en ISO 8601 en UTC.
- **RN-5:** La exportación devuelve como máximo las 10 000 lecturas más recientes que cumplen el filtro. El tope acota la consulta; la interfaz no muestra aviso.

## Fuera de alcance

- Exportar a otros formatos (PDF, Excel).
- Gráficas del histórico.
- Borrar o corregir lecturas.
- Aviso al usuario cuando la exportación llega al tope de filas.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/historico/` · página `src/app/(tablero)/historico/` con ítem de menú por `menu.ts`.
- Endpoints sugeridos: `GET /api/historico` con los filtros como parámetros y `GET /api/historico/exportar` con respuesta `text/csv` (se agregan a `contracts/openapi.yaml`).
- Datos: sin tablas nuevas ni migración; semilla `db/seed/historico.sql` solo si hacen falta lecturas adicionales.
- Puntos de extensión: `menu.ts`.

- Cobertura diseñada del recorrido principal: **CA-1, CA-2 y CA-3**. **CA-4** mantiene casos específicos pendientes de lista vacía y CSV solo con encabezado; **CA-5**, fecha mal formada/rango invertido → 400; **CA-6**, consulta/exportación sin sesión → 401 JSON. RN-2 conserva la verificación específica de escape CSV con los tipos reales. Son pruebas diseñadas, no implementadas ni ejecutadas; un E2E no cubre todos los criterios.
- Coordinación pendiente: el responsable de HU 3 aporta identidad, sesión y usuarios de prueba; el de HU 4, modelo de lecturas/nodo/sensor, fecha, valor/unidad y datos estables. Las cuatro preguntas publicadas ya están resueltas ("Decisiones tomadas"). No se fijan por inferencia fechas iguales ni extremos del rango, ni se añade dependencia de HU 5.

### E2E futuro (no ejecutado)

- Preparar navegador, servidor y BD de prueba aislada reales, sin mocks, con una semilla fija: `P+1` lecturas coincidentes y distractores por nodo, sensor y fecha. Usar fechas distintas, estrictamente interiores o exteriores al rango. `P` es 25 (decisión 1); las coincidencias quedan por debajo del tope de 10 000 filas (decisión 3).
- Iniciar sesión, verificar los filtros de nodo y fecha y después añadir sensor. Comprobar el orden más reciente primero, `P` filas en la primera página y una en la segunda; descargar el CSV real desde la segunda.
- Parsear el archivo y comparar encabezados, las `P+1` filas y su orden completo contra una expectativa fija de la semilla. Comparar también las páginas con esa expectativa, sin obtenerla de la pantalla ni reutilizar consultas o el serializador de producción.

## Decisiones de la HU 4 que aplican

La HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)) cerró sus preguntas abiertas el 2026-11-22. Lo que sigue es consecuencia de esas decisiones y no cambia los CA de esta historia.

- **Magnitudes por lectura (decisión 2):** una fila del histórico y del CSV es una lectura con voltaje, corriente y potencia.
- **Borrado en cascada (decisión 5):** al eliminar un nodo o un sensor se eliminan sus lecturas, así que dejan de aparecer en el histórico.
- **Nombres sin unicidad (decisión 8):** los filtros por nodo y por sensor usan el identificador, no el nombre.
- **Simulador (decisiones 4, 7 y 10):** las lecturas de prueba se generan a pedido, por nodo, con valores aleatorios; el E2E necesita una semilla fija y no puede depender de los valores del simulador.

## Dependencias

- HU 4 (#21: lecturas y simulador).
- Modelo de lecturas decidido en la HU 4 (#21, decisiones 1 y 2): cada lectura pertenece a un sensor, cada sensor a un nodo, y la lectura trae voltaje, corriente y potencia con su fecha; no hay una columna "magnitud" ni un "tipo" de sensor. Los nombres y tipos de columna exactos se toman de la migración de la HU 4 cuando exista; se reutiliza ese modelo sin inventar columnas ni crear tablas propias.

## Decisiones tomadas

Resueltas por el equipo el 2026-11-22. Reemplazan a las preguntas abiertas de la versión anterior.

| # | Pregunta | Decisión | Alternativa descartada |
|---|---|---|---|
| 1 | Lecturas por página | 25 | 50 / 100 |
| 2 | Columnas del CSV | Nodo, sensor, voltaje, corriente, potencia y fecha | Solo sensor, las tres magnitudes y fecha |
| 3 | Tope de filas al exportar | Tope fijo de 10 000 filas, sin aviso en la interfaz | Sin tope / tope con aviso al usuario |
| 4 | Zona horaria y formato de fecha del CSV | ISO 8601 en UTC | Hora local del navegador |

## Preguntas abiertas

Ninguna. Decididas en "Decisiones tomadas".

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
