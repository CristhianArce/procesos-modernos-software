## Historia

Como administrador quiero crear y mantener nodos y sensores de la red y simular sus lecturas para tener datos con los que probar el tablero sin hardware real.

## Contexto

Es la HU 4 de la propuesta (sección 5). Con el login de la HU 3 ya hay roles; todavía no existen nodos, sensores ni lecturas. Esta historia crea el CRUD de nodos y sensores, la ficha del nodo (donde se enchufan los paneles de las historias de clase), el simulador de lecturas de voltaje, corriente y potencia, y la semilla de datos para probar cualquier historia desde el primer minuto.

Las preguntas abiertas de la versión anterior ya están resueltas; el resultado está en los criterios, en las reglas de negocio y en la sección "Decisiones tomadas".

## Criterios de aceptación

- **CA-1:** Dado un administrador y un nodo con datos válidos (nombre obligatorio y ubicación opcional), cuando lo crea, entonces la API responde 201 y el nodo aparece en la lista de nodos con estado "conectado".
- **CA-2:** Dado un nodo existente, cuando el administrador le agrega un sensor con datos válidos (nombre obligatorio y, de forma opcional, un umbral máximo de voltaje, de corriente y de potencia), entonces el sensor queda asociado al nodo y aparece en su ficha.
- **CA-3:** Dado un administrador, cuando envía datos inválidos al crear o editar un nodo o un sensor (nombre vacío, nombre que supera la longitud máxima o un umbral que no es un número), entonces la API responde 400 con el detalle de la validación y no guarda nada. Un nombre repetido no es un dato inválido.
- **CA-4:** Dado un identificador de nodo o de sensor que no existe, cuando se consulta, edita o elimina, entonces la API responde 404.
- **CA-5:** Dado un usuario técnico, cuando intenta crear, editar o eliminar un nodo o un sensor, entonces recibe 403, y sí puede consultar la lista y la ficha.
- **CA-6:** Dado un nodo con sensores, cuando se ejecuta el simulador sobre ese nodo (por la API, con el identificador del nodo en el cuerpo, o por el botón de la interfaz), entonces se registra una lectura nueva con voltaje, corriente y potencia por cada sensor del nodo, y la última lectura queda disponible para consultarse. Si el nodo no tiene sensores, la API responde 200 con cero lecturas registradas.
- **CA-7:** Dada la semilla cargada, cuando un usuario abre la ficha de un nodo, entonces ve sus datos, sus sensores y los paneles que declaren los módulos.

## Reglas de negocio

- **RN-1:** Las magnitudes simuladas son voltaje, corriente y potencia (propuesta, sección 1). Cada lectura trae las tres; un sensor no tiene "tipo".
- **RN-2:** El estado de un nodo es "conectado" o "desconectado"; la columna existe desde esta historia para que la HU 6 solo la cambie.
- **RN-3:** Toda entrada pasa por Zod y el rol se verifica en cada handler.
- **RN-4:** Un nodo tiene nombre, ubicación y estado. El nombre es obligatorio y tiene una longitud máxima; la ubicación es opcional. Los nombres de nodos y de sensores no son únicos.
- **RN-5:** Un sensor tiene nombre y tres umbrales máximos opcionales, uno por magnitud (voltaje, corriente y potencia). No hay umbral mínimo. Una magnitud sin umbral no genera alertas en la HU 5.
- **RN-6:** Al eliminar un nodo se eliminan en cascada sus sensores y las lecturas de estos; al eliminar un sensor se eliminan sus lecturas.
- **RN-7:** El técnico solo consulta: no crea, edita ni elimina nodos o sensores.
- **RN-8:** El simulador genera valores aleatorios dentro de un rango razonable por magnitud y, de vez en cuando, una lectura por encima del umbral del sensor para poder probar las alertas.
- **RN-9:** El simulador solo se ejecuta a pedido, por el botón o por la API; no hay temporizador.
- **RN-10:** El simulador actúa sobre un solo nodo, el que se indica en el cuerpo de la petición. El identificador es obligatorio: sin él la API responde 400 (CA-3) y con uno que no existe responde 404 (CA-4).

## Fuera de alcance

- Cambiar el estado del nodo desde la interfaz (HU 6).
- Alertas por umbral y gráficas (HU 5).
- Histórico con filtros y exportación (HU 9).
- Temporizador del simulador y simulación de todos los nodos en una sola llamada.
- Umbral mínimo por magnitud y unicidad de nombres.

## Notas técnicas (no vinculantes)

- Módulos: `src/modulos/nodos/`, `sensores/`, `lecturas/` y `simulador/` · páginas `src/app/(tablero)/nodos/` (lista) y `nodos/[id]` (ficha, que lee los paneles registrados en `src/nav/registro.ts`).
- Endpoints sugeridos: `GET|POST /api/nodos`, `GET|PATCH|DELETE /api/nodos/{id}`, `GET|POST /api/sensores`, `GET|PATCH|DELETE /api/sensores/{id}` y `POST /api/simulador` con el identificador del nodo en el cuerpo (se agregan a `contracts/openapi.yaml`).
- Datos: tablas `nodos` (nombre, ubicación, estado), `sensores` (nodo, nombre y tres columnas de umbral máximo que aceptan nulo) y `lecturas` (sensor, voltaje, corriente, potencia y fecha) con migración Flyway; borrado en cascada de nodo a sensores y de sensor a lecturas; semillas `db/seed/nodos.sql`, `sensores.sql` y `lecturas.sql`.
- La longitud máxima del nombre y el rango de valores de cada magnitud son detalles que fija el `design.md` del change y quedan registrados como decisiones.
- Contador de negocio opcional: `simulador_lecturas_total`.
- Puntos de extensión: `menu.ts` para las entradas del menú y el registro de paneles en la ficha del nodo (la página no se editará después).

## Dependencias

- HU 3 (#20: login con roles).

## Decisiones tomadas

Resueltas por el equipo el 2026-11-22. Reemplazan a las preguntas abiertas de la versión anterior.

| # | Pregunta | Decisión | Alternativa descartada |
|---|---|---|---|
| 1 | Campos de nodo y sensor | Nodo: nombre, ubicación y estado. Sensor: nombre y umbrales, sin "tipo" | Otros campos |
| 2 | Magnitudes por lectura (CA-6) | Cada lectura trae voltaje, corriente y potencia | Un sensor por magnitud |
| 3 | Umbrales que leerá la HU 5 | Un umbral máximo por magnitud en el sensor (tres columnas opcionales) | Dos columnas por sensor (mínimo y máximo) |
| 4 | Valores del simulador | Aleatorios en un rango razonable por magnitud, con alguna lectura fuera del umbral de vez en cuando | Valores fijos configurables |
| 5 | Eliminar un nodo con sensores o lecturas | Se eliminan en cascada | Rechazar con 409 |
| 6 | Permisos del técnico (CA-5) | Solo consulta | Puede editar nodos, pero no eliminarlos |
| 7 | Temporizador del simulador | Solo botón y API | Temporizador desactivado por defecto |
| 8 | Qué es un dato inválido (CA-3) | Nombre obligatorio con longitud máxima; ubicación opcional; sin unicidad | Además nombre único (409 al duplicar) |
| 9 | Simulador sobre un nodo sin sensores (CA-6) | 200 con cero lecturas | 409 o 422 con mensaje |
| 10 | Alcance del simulador (CA-6) | Actúa sobre el nodo indicado en el cuerpo (obligatorio) | Sin id, simula todos los nodos |

## Preguntas abiertas

Ninguna. Decididas en "Decisiones tomadas".

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
