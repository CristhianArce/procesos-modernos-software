## Historia

Como usuario autenticado quiero ver en un dashboard la última lectura, una gráfica por sensor y las alertas por umbral para detectar de un vistazo qué parte de la red tiene problemas.

## Contexto

Es la HU 5 de la propuesta (sección 5) y cierra la línea base. Con los nodos, sensores y lecturas de la HU 4 ya hay datos, pero no se ven en ninguna parte ni se comparan con umbrales. Esta historia crea el dashboard, el módulo `alertas` (que registra una alerta cuando una lectura supera el umbral de su sensor) y el punto de enganche `on-alerta.ts` que usará la HU 7.

## Criterios de aceptación

- **CA-1:** Dado un usuario con sesión y sensores con lecturas, cuando abre el dashboard, entonces ve por cada sensor su última lectura con valor, unidad y fecha.
- **CA-2:** Dado un sensor con lecturas, cuando se muestra su gráfica, entonces esta traza sus lecturas más recientes ordenadas por fecha.
- **CA-3:** Dado un sensor con umbral y una lectura que lo supera, cuando la lectura se registra, entonces se crea una alerta con el sensor, el valor, el umbral y la fecha. Si la lectura está dentro del umbral, no se crea ninguna alerta.
- **CA-4:** Dadas alertas registradas, cuando el usuario abre el dashboard, entonces las ve listadas con la más reciente primero.
- **CA-5:** Dado un módulo suscrito a las alertas, cuando se registra una alerta, entonces el servicio de alertas invoca a ese suscriptor con los datos de la alerta.
- **CA-6:** Dado un visitante sin sesión, cuando consulta las lecturas o las alertas por la API, entonces recibe 401 en JSON.
- **CA-7:** Dados parámetros inválidos en la consulta de lecturas o alertas, cuando se llama a la API, entonces responde 400 por la validación de Zod.

## Reglas de negocio

- **RN-1:** Una lectura genera alerta solo si supera el umbral de su sensor (propuesta, sección 3).
- **RN-2:** El servicio de alertas no conoce a sus suscriptores: los descubre por `src/nav/registro.ts`.

## Fuera de alcance

- Notificar a los técnicos (HU 7).
- Editar los umbrales desde el dashboard (se definen al administrar sensores, HU 4).
- Actualización en tiempo real por WebSocket.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/alertas/` · dashboard en `src/app/(tablero)/page.tsx` · gráficas con Recharts en componentes `"use client"`.
- Endpoints sugeridos: `GET /api/lecturas` y `GET /api/alertas` (se agregan a `contracts/openapi.yaml`).
- Datos: tabla `alertas` con migración Flyway; semilla `db/seed/alertas.sql`.
- Contador de negocio opcional: `alertas_umbral_total{severidad}`.
- Puntos de extensión: `menu.ts` y el suscriptor `on-alerta.ts` que otros módulos usan.

## Dependencias

- HU 4 (#21: nodos, sensores y simulador).

## Preguntas abiertas

- ¿Hay niveles de severidad? — la propuesta menciona una etiqueta `severidad` en la métrica. Opciones: una sola severidad / dos niveles (por ejemplo advertencia y crítica) según qué tan lejos del umbral. Si hay niveles, se agrega un CA.
- ¿Cuántas lecturas muestra la gráfica? — opciones: las últimas 50 / las de las últimas 24 horas / otro valor.
- ¿Una alerta se genera por cada lectura fuera de umbral o solo al cruzarlo? — opciones: por cada lectura / una sola mientras dure la condición. CA-3 asume por cada lectura.
- ¿Qué pasa si un suscriptor de alertas falla? — opciones: se registra el error y la alerta se guarda igual / falla todo el registro. Recomendado: la alerta se guarda igual.
- ¿Las alertas se pueden marcar como atendidas? — opciones: no en esta historia / sí, con un campo de estado.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
