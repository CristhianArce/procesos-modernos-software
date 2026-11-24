# Issue #26: HU 9: Consultar el histórico de lecturas

Estado: OPEN
Etiquetas: historia, clase

## Historia

Como usuario autenticado quiero consultar el histórico de lecturas con filtros para analizar el comportamiento de un sensor fuera del tablero.

## Contexto

**HU 9: Consultar el histórico de lecturas**, fila 9 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#26](https://github.com/CristhianArce/procesos-modernos-software/issues/26).
Esta historia sale de dividir la HU 9 original ("Consultar el histórico de lecturas y exportarlo a CSV") en dos: aquí queda la consulta paginada con filtros y en la HU 16 ([#56](https://github.com/CristhianArce/procesos-modernos-software/issues/56)) la exportación a CSV. CA-1 y CA-2 son los publicados; CA-3 es la mitad de consulta del CA-4, CA-4 la del CA-5 y CA-5 la del CA-6.
El proyecto simula una red eléctrica, sin controlar equipos reales. Esta HU requiere las lecturas y relaciones de la HU 4, cuyo modelo ya está decidido en #21; no se afirma que sus tablas o el login de la HU 3 ya estén implementados.

## Criterios de aceptación

- **CA-1:** Dado un usuario con sesión y lecturas registradas, cuando abre el histórico, entonces ve las lecturas paginadas de 25 en 25 con la más reciente primero.
- **CA-2:** Dado un filtro por nodo, por sensor o por rango de fechas, cuando se aplica, entonces solo aparecen las lecturas que cumplen todas las condiciones.
- **CA-3:** Dado un filtro sin resultados, cuando se consulta, entonces la lista queda vacía.
- **CA-4:** Dada una fecha mal formada o un rango con la fecha inicial posterior a la final, cuando se consulta, entonces la API responde 400 por la validación de Zod.
- **CA-5:** Dado un visitante sin sesión, cuando consulta el histórico por la API, entonces recibe 401 en JSON.

## Reglas de negocio

- **RN-1:** La historia solo lee `lecturas`; no escribe ni modifica ninguna tabla.
- **RN-2:** El histórico muestra 25 lecturas por página.
- **RN-3:** Los filtros por nodo y por sensor usan el identificador, no el nombre.

## Fuera de alcance

- Exportar a CSV u otros formatos (lo cubre la HU 16 para CSV).
- Gráficas del histórico.
- Borrar o corregir lecturas.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/historico/` · página `src/app/(tablero)/historico/` con ítem de menú por `menu.ts`.
- Endpoint sugerido: `GET /api/historico` con los filtros como parámetros (se agrega a `contracts/openapi.yaml`). El esquema de filtros queda en un archivo reutilizable por la HU 16.
- Datos: sin tablas nuevas ni migración; semilla `db/seed/historico.sql` solo si hacen falta lecturas adicionales.
- Puntos de extensión: `menu.ts`.
- Cobertura diseñada del recorrido principal: **CA-1 y CA-2**. **CA-3**, lista vacía; **CA-4**, fecha mal formada o rango invertido → 400; **CA-5**, consulta sin sesión → 401 JSON. Un E2E no cubre todos los criterios.
- Coordinación pendiente: el responsable de la HU 3 aporta identidad, sesión y usuarios de prueba; el de la HU 4, modelo de lecturas, nodo y sensor, fecha, valor y datos estables. No se fijan por inferencia fechas iguales ni extremos del rango, ni se añade dependencia de la HU 5.

### E2E futuro (no ejecutado)

Preparación: navegador, servidor y BD de prueba aislada reales, sin mocks, con una semilla fija: `26` lecturas coincidentes y distractores por nodo, sensor y fecha, con fechas distintas y estrictamente interiores o exteriores al rango.

1. Iniciar sesión, verificar los filtros de nodo y fecha y después añadir sensor.
2. Comprobar el orden más reciente primero, 25 filas en la primera página y una en la segunda, contra una expectativa fija de la semilla, sin reutilizar consultas de producción.

## Decisiones de la HU 4 que aplican

La HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)) cerró sus preguntas abiertas el 2026-11-22. Lo que sigue es consecuencia de esas decisiones y no cambia los CA de esta historia.

- **Magnitudes por lectura (decisión 2):** una fila del histórico es una lectura con voltaje, corriente y potencia.
- **Borrado en cascada (decisión 5):** al eliminar un nodo o un sensor se eliminan sus lecturas, así que dejan de aparecer en el histórico.
- **Nombres sin unicidad (decisión 8):** los filtros por nodo y por sensor usan el identificador, no el nombre.
- **Simulador (decisiones 4, 7 y 10):** las lecturas de prueba se generan a pedido, por nodo, con valores aleatorios; el E2E necesita una semilla fija y no puede depender de los valores del simulador.

## Dependencias

- HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21): lecturas y simulador).
- Modelo de lecturas decidido en la HU 4 (decisiones 1 y 2): cada lectura pertenece a un sensor, cada sensor a un nodo, y la lectura trae voltaje, corriente y potencia con su fecha; no hay una columna "magnitud" ni un "tipo" de sensor. Los nombres y tipos de columna exactos se toman de la migración de la HU 4 cuando exista; no se inventan columnas ni se crean tablas propias.
- La HU 16 depende de esta.

## Decisiones tomadas

Resueltas por el equipo el 2026-11-22. Reemplazan a las preguntas abiertas de la versión anterior.

| # | Pregunta | Decisión | Alternativa descartada |
|---|---|---|---|
| 1 | Lecturas por página | 25 | 50 / 100 |
| 2 | Columnas del CSV, tope de filas y formato de fecha | Pasan a la HU 16 sin cambios (nodo, sensor, voltaje, corriente, potencia y fecha; 10 000 filas; ISO 8601 en UTC) | — |

## Preguntas abiertas

Ninguna. Decididas en "Decisiones tomadas".

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.

## Criterios numerados

- CA-1: Dado un usuario con sesión y lecturas registradas, cuando abre el histórico, entonces ve las lecturas paginadas de 25 en 25 con la más reciente primero.
- CA-2: Dado un filtro por nodo, por sensor o por rango de fechas, cuando se aplica, entonces solo aparecen las lecturas que cumplen todas las condiciones.
- CA-3: Dado un filtro sin resultados, cuando se consulta, entonces la lista queda vacía.
- CA-4: Dada una fecha mal formada o un rango con la fecha inicial posterior a la final, cuando se consulta, entonces la API responde 400 por la validación de Zod.
- CA-5: Dado un visitante sin sesión, cuando consulta el histórico por la API, entonces recibe 401 en JSON.
