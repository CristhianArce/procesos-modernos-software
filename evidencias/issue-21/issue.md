# Issue #21: HU 4: Administrar nodos y sensores con simulador de lecturas

Estado: OPEN
Etiquetas: historia, linea-base

## Historia

Como administrador quiero crear y mantener nodos y sensores de la red y simular sus lecturas para tener datos con los que probar el tablero sin hardware real.

## Contexto

Es la HU 4 de la propuesta (sección 5). Con el login de la HU 3 ya hay roles; todavía no existen nodos, sensores ni lecturas. Esta historia crea el CRUD de nodos y sensores, la ficha del nodo (donde se enchufan los paneles de las historias de clase), el simulador de lecturas de voltaje, corriente y potencia, y la semilla de datos para probar cualquier historia desde el primer minuto.

## Criterios de aceptación

- **CA-1:** Dado un administrador y un nodo con datos válidos, cuando lo crea, entonces la API responde 201 y el nodo aparece en la lista de nodos con estado "conectado".
- **CA-2:** Dado un nodo existente, cuando el administrador le agrega un sensor con datos válidos, entonces el sensor queda asociado al nodo y aparece en su ficha.
- **CA-3:** Dado un administrador, cuando envía datos inválidos al crear o editar un nodo o un sensor, entonces la API responde 400 con el detalle de la validación y no guarda nada.
- **CA-4:** Dado un identificador de nodo o de sensor que no existe, cuando se consulta, edita o elimina, entonces la API responde 404.
- **CA-5:** Dado un usuario técnico, cuando intenta crear, editar o eliminar un nodo o un sensor, entonces recibe 403, y sí puede consultar la lista y la ficha.
- **CA-6:** Dado un nodo con sensores, cuando se ejecuta el simulador (por la API o por el botón de la interfaz), entonces se registra una lectura nueva de voltaje, corriente y potencia por cada sensor del nodo, y la última lectura queda disponible para consultarse.
- **CA-7:** Dada la semilla cargada, cuando un usuario abre la ficha de un nodo, entonces ve sus datos, sus sensores y los paneles que declaren los módulos.

## Reglas de negocio

- **RN-1:** Las magnitudes simuladas son voltaje, corriente y potencia (propuesta, sección 1).
- **RN-2:** El estado de un nodo es "conectado" o "desconectado"; la columna existe desde esta historia para que la HU 6 solo la cambie.
- **RN-3:** Toda entrada pasa por Zod y el rol se verifica en cada handler.

## Fuera de alcance

- Cambiar el estado del nodo desde la interfaz (HU 6).
- Alertas por umbral y gráficas (HU 5).
- Histórico con filtros y exportación (HU 9).

## Notas técnicas (no vinculantes)

- Módulos: `src/modulos/nodos/`, `sensores/`, `lecturas/` y `simulador/` · páginas `src/app/(tablero)/nodos/` (lista) y `nodos/[id]` (ficha, que lee los paneles registrados en `src/nav/registro.ts`).
- Endpoints sugeridos: `GET|POST /api/nodos`, `GET|PATCH|DELETE /api/nodos/{id}`, `GET|POST /api/sensores`, `GET|PATCH|DELETE /api/sensores/{id}` y `POST /api/simulador` (se agregan a `contracts/openapi.yaml`).
- Datos: tablas `nodos`, `sensores` y `lecturas` con migración Flyway; semillas `db/seed/nodos.sql`, `sensores.sql` y `lecturas.sql`.
- Contador de negocio opcional: `simulador_lecturas_total`.
- Puntos de extensión: `menu.ts` para las entradas del menú y el registro de paneles en la ficha del nodo (la página no se editará después).

## Dependencias

- HU 3 (#20: login con roles).

## Preguntas abiertas

- ¿Qué campos tiene un nodo y un sensor? — la propuesta no los lista. Opciones: nodo con nombre, ubicación y estado; sensor con nombre, tipo y umbrales / otros campos.
- ¿Cada sensor mide una sola magnitud o cada lectura trae las tres? — opciones: un sensor por magnitud / una lectura con voltaje, corriente y potencia. CA-6 asume una lectura con las tres; si se decide otra cosa, se ajusta.
- ¿Dónde se definen los umbrales de la HU 5? — opciones: dos columnas por sensor (mínimo y máximo) / un umbral por magnitud. Debe resolverse aquí porque la HU 5 los lee.
- ¿Qué rango de valores genera el simulador? — la propuesta no lo dice. Opciones: valores aleatorios en un rango razonable por magnitud, con alguna lectura fuera del umbral de vez en cuando para probar alertas / valores fijos configurables.
- ¿Se elimina un nodo con sensores o lecturas? — opciones: se eliminan en cascada / se rechaza con 409.
- ¿El técnico solo consulta? — CA-5 asume que sí; opciones: solo lectura / puede editar nodos pero no eliminarlos.
- ¿El simulador es también un temporizador? — la propuesta lo menciona como opcional. Opciones: solo botón y API / temporizador desactivado por defecto.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.

## Criterios numerados

- CA-1: Dado un administrador y un nodo con datos válidos, cuando lo crea, entonces la API responde 201 y el nodo aparece en la lista de nodos con estado "conectado".
- CA-2: Dado un nodo existente, cuando el administrador le agrega un sensor con datos válidos, entonces el sensor queda asociado al nodo y aparece en su ficha.
- CA-3: Dado un administrador, cuando envía datos inválidos al crear o editar un nodo o un sensor, entonces la API responde 400 con el detalle de la validación y no guarda nada.
- CA-4: Dado un identificador de nodo o de sensor que no existe, cuando se consulta, edita o elimina, entonces la API responde 404.
- CA-5: Dado un usuario técnico, cuando intenta crear, editar o eliminar un nodo o un sensor, entonces recibe 403, y sí puede consultar la lista y la ficha.
- CA-6: Dado un nodo con sensores, cuando se ejecuta el simulador (por la API o por el botón de la interfaz), entonces se registra una lectura nueva de voltaje, corriente y potencia por cada sensor del nodo, y la última lectura queda disponible para consultarse.
- CA-7: Dada la semilla cargada, cuando un usuario abre la ficha de un nodo, entonces ve sus datos, sus sensores y los paneles que declaren los módulos.
