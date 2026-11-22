## Historia

Como usuario autenticado quiero consultar el histórico de lecturas con filtros y exportarlo a CSV para analizar el comportamiento de un sensor fuera del tablero.

## Contexto

Es la HU 9 de la propuesta (sección 5), historia de clase. Las lecturas existen desde la HU 4 y el dashboard (HU 5) solo muestra las más recientes. Esta historia agrega una página de histórico que lee únicamente la tabla `lecturas`, con filtros y una exportación a CSV. No cambia datos ni tablas ajenas.

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

## Dependencias

- HU 4 (#21: lecturas y simulador).

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
