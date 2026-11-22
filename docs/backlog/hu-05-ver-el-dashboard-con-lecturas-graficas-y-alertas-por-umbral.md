## Historia

Como usuario autenticado quiero ver en un dashboard la última lectura, una gráfica por sensor y las alertas por umbral para detectar de un vistazo qué parte de la red tiene problemas.

## Contexto

Es la HU 5 de la propuesta (sección 5) y cierra la línea base. Con los nodos, sensores y lecturas de la HU 4 ya hay datos, pero no se ven en ninguna parte ni se comparan con umbrales. Esta historia crea el dashboard, el módulo `alertas` (que registra una alerta cuando una lectura supera el umbral de su sensor) y el punto de enganche `on-alerta.ts` que usará la HU 7.

## Criterios de aceptación

- **CA-1:** Dado un usuario con sesión y sensores con lecturas, cuando abre el dashboard, entonces ve por cada sensor su última lectura con el valor y la unidad de voltaje, corriente y potencia, y la fecha.
- **CA-2:** Dado un sensor con lecturas, cuando se muestra su gráfica, entonces esta traza sus 50 lecturas más recientes ordenadas por fecha, con un trazo por magnitud (voltaje, corriente y potencia), cada uno con su propia escala.
- **CA-3:** Dado un sensor con umbral máximo en una magnitud (voltaje, corriente o potencia) y una lectura cuyo valor en esa magnitud lo supera, cuando la lectura se registra, entonces se crea una alerta con el sensor, la magnitud, el valor, el umbral y la fecha. Si el valor está dentro del umbral o la magnitud no tiene umbral, no se crea ninguna alerta.
- **CA-4:** Dadas alertas registradas, cuando el usuario abre el dashboard, entonces las ve listadas con la más reciente primero.
- **CA-5:** Dado un módulo suscrito a las alertas, cuando se registra una alerta, entonces el servicio de alertas invoca a ese suscriptor con los datos de la alerta. Si el suscriptor falla, se registra el error y la alerta queda guardada.
- **CA-6:** Dado un visitante sin sesión, cuando consulta las lecturas o las alertas por la API, entonces recibe 401 en JSON.
- **CA-7:** Dados parámetros inválidos en la consulta de lecturas o alertas, cuando se llama a la API, entonces responde 400 por la validación de Zod.

## Reglas de negocio

- **RN-1:** Una lectura genera alerta solo si supera el umbral de su sensor (propuesta, sección 3). Cada sensor tiene un umbral máximo opcional por magnitud y no hay umbral mínimo (decisiones 2 y 3 de la HU 4, #21). La comparación es por magnitud: una lectura que supera el umbral en dos magnitudes genera dos alertas.
- **RN-2:** El servicio de alertas no conoce a sus suscriptores: los descubre por `src/nav/registro.ts`.
- **RN-3:** Hay una sola severidad: toda alerta vale lo mismo.
- **RN-4:** Se crea una alerta por cada lectura que supera el umbral, no solo al cruzarlo. Las alertas no tienen estado: no se marcan como atendidas.
- **RN-5:** La gráfica de un sensor es un panel con tres trazos pequeños, uno por magnitud y cada uno con su propio eje, sin selector ni otra interacción. Muestra las 50 lecturas más recientes.
- **RN-6:** El servicio avisa a los suscriptores después de guardar la alerta y les entrega su identificador, el sensor, la magnitud, el valor, el umbral y la fecha. El fallo de un suscriptor no impide guardar la alerta ni avisar a los demás.

## Fuera de alcance

- Notificar a los técnicos (HU 7).
- Editar los umbrales desde el dashboard (se definen al administrar sensores, HU 4).
- Actualización en tiempo real por WebSocket.
- Niveles de severidad y marcar alertas como atendidas.
- Selector de magnitud u otra interacción en las gráficas.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/alertas/` · dashboard en `src/app/(tablero)/page.tsx` · gráficas con Recharts en componentes `"use client"`.
- Endpoints sugeridos: `GET /api/lecturas` y `GET /api/alertas` (se agregan a `contracts/openapi.yaml`).
- Datos: tabla `alertas` con migración Flyway; semilla `db/seed/alertas.sql`.
- Contador de negocio opcional: `alertas_umbral_total{severidad}`.
- Puntos de extensión: `menu.ts` y el suscriptor `on-alerta.ts` que otros módulos usan.

## Dependencias

- HU 4 (#21: nodos, sensores y simulador). Ya decidió el modelo que lee esta historia: cada lectura trae voltaje, corriente y potencia, y cada sensor tiene tres umbrales máximos opcionales, uno por magnitud. El simulador genera de vez en cuando una lectura por encima del umbral, que sirve para probar las alertas.

## Decisiones tomadas

Resueltas por el equipo el 2026-11-22. Reemplazan a las preguntas abiertas de la versión anterior.

| # | Pregunta | Decisión | Alternativa descartada |
|---|---|---|---|
| 1 | Niveles de severidad | Una sola severidad | Dos niveles (advertencia y crítica) |
| 2 | Cómo muestra la gráfica las tres magnitudes | Tres trazos pequeños por sensor, uno por magnitud y con su propio eje, sin interacción. Evaluada por un agente independiente: las escalas (voltaje 110 a 130, corriente 0,5 a 20, potencia hasta unos 2600) aplastan dos series en un eje común, y un selector oculta dos magnitudes y agrega una interacción que ningún CA pide | Tres series en un mismo eje / una magnitud a la vez con selector |
| 3 | Cuántas lecturas muestra la gráfica | Las últimas 50 | Las de las últimas 24 horas |
| 4 | Cuándo se genera la alerta | Por cada lectura fuera de umbral | Una sola mientras dure la condición |
| 5 | Suscriptor de alertas que falla | Se registra el error y la alerta se guarda igual | Falla todo el registro |
| 6 | Marcar alertas como atendidas | No en esta historia | Sí, con un campo de estado |

## Preguntas abiertas

Ninguna. Decididas en "Decisiones tomadas".

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
