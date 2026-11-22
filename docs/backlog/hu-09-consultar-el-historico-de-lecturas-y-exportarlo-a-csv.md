## Historia

Como usuario autenticado quiero consultar el histórico de lecturas con filtros y exportarlo a CSV para analizar el comportamiento de un sensor fuera del tablero.

## Contexto

**HU 9: Consultar el histórico de lecturas y exportarlo a CSV**, fila 9 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#26](https://github.com/CristhianArce/procesos-modernos-software/issues/26); documento canónico: `docs/backlog/hu-09-consultar-el-historico-de-lecturas-y-exportarlo-a-csv.md` ([main fijado](https://github.com/CristhianArce/procesos-modernos-software/blob/6134fcef5867ad08149450e024b5069a3a761843/docs/backlog/hu-09-consultar-el-historico-de-lecturas-y-exportarlo-a-csv.md)).
El proyecto simula una red eléctrica, sin controlar equipos reales. Esta HU requiere las lecturas y relaciones de HU 4, cuyo modelo concreto sigue pendiente de validación; no se afirma que sus tablas o el login de HU 3 ya estén implementados.
Se conservan íntegramente el E2E y la dependencia adicional de HU 4 ya publicados en #26, así como sus seis CA y cuatro preguntas abiertas. El escenario continúa diseñado y no ejecutado.

## Criterios de aceptación

- **CA-1:** Dado un usuario con sesión y lecturas registradas, cuando abre el histórico, entonces ve las lecturas paginadas con la más reciente primero.
- **CA-2:** Dado un filtro por nodo, por sensor o por rango de fechas, cuando se aplica, entonces solo aparecen las lecturas que cumplen todas las condiciones.
- **CA-3:** Dado un filtro aplicado, cuando el usuario exporta, entonces descarga un archivo CSV con las lecturas que cumplen ese filtro.
- **CA-4:** Dado un filtro sin resultados, cuando se consulta o se exporta, entonces la lista queda vacía y el CSV trae solo la fila de encabezado.
- **CA-5:** Dada una fecha mal formada o un rango con la fecha inicial posterior a la final, cuando se consulta o se exporta, entonces la API responde 400 por la validación de Zod.
- **CA-6:** Dado un visitante sin sesión, cuando consulta o exporta el histórico por la API, entonces recibe 401 en JSON.

## Reglas de negocio

- **RN-1:** La historia solo lee `lecturas`; no escribe ni modifica ninguna tabla.
- **RN-2:** Un valor del CSV que empiece por `=`, `+`, `-` o `@` se escapa para que una hoja de cálculo no lo ejecute como fórmula.

## Fuera de alcance

- Exportar a otros formatos (PDF, Excel).
- Gráficas del histórico.
- Borrar o corregir lecturas.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/historico/` · página `src/app/(tablero)/historico/` con ítem de menú por `menu.ts`.
- Endpoints sugeridos: `GET /api/historico` con los filtros como parámetros y `GET /api/historico/exportar` con respuesta `text/csv` (se agregan a `contracts/openapi.yaml`).
- Datos: sin tablas nuevas ni migración; semilla `db/seed/historico.sql` solo si hacen falta lecturas adicionales.
- Puntos de extensión: `menu.ts`.

- Cobertura diseñada del recorrido principal: **CA-1, CA-2 y CA-3**. **CA-4** mantiene casos específicos pendientes de lista vacía y CSV solo con encabezado; **CA-5**, fecha mal formada/rango invertido → 400; **CA-6**, consulta/exportación sin sesión → 401 JSON. RN-2 conserva la verificación específica de escape CSV con los tipos reales. Son pruebas diseñadas, no implementadas ni ejecutadas; un E2E no cubre todos los criterios.
- Coordinación pendiente: el responsable de HU 3 aporta identidad, sesión y usuarios de prueba; el de HU 4, modelo de lecturas/nodo/sensor, fecha, valor/unidad y datos estables. El responsable de HU 9 y el equipo resuelven las cuatro preguntas publicadas sin inventar columnas o contratos. No se fijan por inferencia fechas iguales, extremos o una zona horaria, ni se añade dependencia de HU 5.

### E2E futuro (no ejecutado)

- Preparar navegador, servidor y BD de prueba aislada reales, sin mocks, con una semilla fija: `P+1` lecturas coincidentes y distractores por nodo, sensor y fecha. Usar fechas distintas, estrictamente interiores o exteriores al rango. `P` será el tamaño de página acordado; las coincidencias quedarán por debajo del tope si se acuerda.
- Iniciar sesión, verificar los filtros de nodo y fecha y después añadir sensor. Comprobar el orden más reciente primero, `P` filas en la primera página y una en la segunda; descargar el CSV real desde la segunda.
- Parsear el archivo y comparar encabezados, las `P+1` filas y su orden completo contra una expectativa fija de la semilla. Comparar también las páginas con esa expectativa, sin obtenerla de la pantalla ni reutilizar consultas o el serializador de producción.

## Dependencias

- HU 4 (#21: lecturas y simulador).
- Pendiente confirmar con HU 4 el modelo real de lecturas y sus relaciones con nodo y sensor, incluidos identificadores, fecha, valor y unidad. Se reutilizará ese modelo sin inventar columnas ni crear tablas propias.

## Preguntas abiertas

- ¿Cuántas lecturas por página? — opciones: 25 / 50 / 100.
- ¿Qué columnas lleva el CSV? — opciones: nodo, sensor, magnitud, valor, unidad y fecha / solo sensor, valor y fecha.
- ¿Hay un tope de filas al exportar? — opciones: sin tope / un máximo (por ejemplo 10 000 filas) con aviso al usuario.
- ¿Qué zona horaria y formato de fecha usa el CSV? — opciones: ISO 8601 en UTC / hora local del navegador.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
