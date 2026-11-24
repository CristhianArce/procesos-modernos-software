# Tasks

Las pruebas unitarias se verifican con `npx vitest run --project unit <archivo>` y las de integración con `node .claude/skills/build-test/scripts/build-test.mjs 22 --solo test:integration`, que levanta y migra la BD de la corrida.

## 1. Migración

- [x] 1.1 Escribir `src/modulos/alertas/__tests__/tabla.int.test.ts` (una alerta guarda sensor, magnitud, valor, umbral y `creada_en` por defecto; se rechaza una magnitud distinta de `voltaje`, `corriente` y `potencia` y una alerta sin sensor; eliminar el sensor elimina sus alertas) y luego `db/migration/V202611222300__alertas.sql`; verificar con la prueba de integración en verde (CA-3; Derivado: decisión #9)

## 2. Repo

- [x] 2.1 Escribir `src/modulos/alertas/__tests__/repo.int.test.ts` (insertar varias alertas en una llamada y devolverlas con `id` y `creadaEn`; `recientes` las devuelve de la más reciente a la más antigua, respeta `limite` y filtra por `sensorId`) y luego `src/modulos/alertas/repo.ts` con `import "server-only"`; verificar con la prueba de integración (CA-3, CA-4; Derivado: decisión #8)
- [x] 2.2 Ampliar `src/modulos/lecturas/__tests__/repo.int.test.ts` (`recientes` devuelve de la más reciente a la más antigua, respeta `limite` y filtra por `sensorId`; `recientesPorSensor` devuelve como mucho `limite` lecturas por sensor, las más recientes, en orden ascendente) y luego las dos funciones en `src/modulos/lecturas/repo.ts`; verificar con la prueba de integración (CA-2, CA-6; Derivado: decisión #8, #12)
- [x] 2.3 Ampliar `src/modulos/sensores/__tests__/repo.int.test.ts` (`listarTodos` incluye sensores de nodos distintos) y luego `listarTodos` en `src/modulos/sensores/repo.ts`; verificar con la prueba de integración (CA-1; Derivado: decisión #12)

## 3. Schema

- [x] 3.1 Escribir `src/modulos/lecturas/__tests__/schema.test.ts` y `src/modulos/alertas/__tests__/schema.test.ts` (aceptan sin parámetros con `limite` 50 y 20 por defecto, `sensorId` UUID y `limite` de texto entre 1 y 100; rechazan `sensorId` que no es UUID y `limite` 0, 101, decimal o no numérico) y luego `src/modulos/lecturas/schema.ts` (`consultaRecientesSchema`) y `src/modulos/alertas/schema.ts`; verificar con la prueba unitaria (CA-7; Derivado: decisión #1, #2, #8)

## 4. Service

- [x] 4.1 Escribir `src/modulos/alertas/__tests__/service.test.ts` (sin BD, con el repo, el registro y el logger simulados: `excesos` crea una alerta por magnitud con valor mayor que su umbral, ninguna si es igual o menor o si no hay umbral, y dos si supera dos umbrales; `registrarAlertas` sin excesos no llama al repo; avisa a cada suscriptor con la alerta guardada; si un suscriptor lanza, registra el error, devuelve la alerta y avisa al siguiente) y luego `src/modulos/alertas/service.ts`; verificar con la prueba unitaria (CA-3, CA-5)
- [x] 4.2 Ampliar `src/modulos/lecturas/__tests__/service.test.ts` (`listarLecturas` delega en `recientes`; `lecturasRecientesPorSensor` indexa por sensor y no consulta con una lista vacía) y `src/modulos/sensores/__tests__/service.test.ts` (`listarTodosLosSensores` delega en el repo), y luego las funciones en sus servicios; verificar con las pruebas unitarias (CA-1, CA-2, CA-6; Derivado: decisión #12)
- [x] 4.3 Ampliar `src/modulos/simulador/__tests__/service.test.ts` (llama a `registrarAlertas` con las lecturas registradas y los sensores del nodo) y luego la llamada en `src/modulos/simulador/service.ts`; verificar con la prueba unitaria (CA-3; Derivado: decisión #5)

## 5. Handler y contrato

- [x] 5.1 Escribir `src/app/api/__tests__/alertas.int.test.ts` (con `Request` y cookie firmada: 401 en JSON sin sesión; 400 con detalle para `sensorId` inválido y `limite` 0, 101 o no numérico; el técnico recibe 200 con las alertas de un sensor, la más reciente primero; `POST /api/simulador` sobre un sensor con umbral de voltaje 1 deja una alerta de voltaje consultable) y luego `src/app/api/alertas/route.ts` con `conHttp`; verificar con la prueba de integración (CA-3, CA-4, CA-6, CA-7)
- [x] 5.2 Escribir `src/app/api/__tests__/lecturas.int.test.ts` (401 en JSON sin sesión; 400 con detalle para parámetros inválidos; el técnico recibe 200 con las dos lecturas más recientes de un sensor con `limite=2`) y luego `src/app/api/lecturas/route.ts`; verificar con la prueba de integración (CA-6, CA-7; Derivado: decisión #8)
- [x] 5.3 Agregar a `contracts/openapi.yaml` el esquema `Alerta` y las rutas `/api/lecturas` y `/api/alertas` con sus parámetros y respuestas 200, 400 y 401, conservando las rutas existentes; verificar con `npx vitest run --project unit src/__tests__/contrato.test.ts` (CA-6, CA-7)

## 6. Página y UI

- [x] 6.1 Escribir `src/modulos/dashboard/__tests__/formato.test.ts` (la fecha sale en es-CO y zona `America/Bogota`; las unidades son V, A y W) y luego `src/modulos/dashboard/formato.ts`; verificar con la prueba unitaria (CA-1; Derivado: decisión #3, #7)
- [x] 6.2 Escribir `src/modulos/dashboard/__tests__/tarjeta-sensor.test.ts` (renderiza `TarjetaSensor` a HTML con `react-dom/server`: nombre, última lectura con V, A, W y fecha, y los títulos "Voltaje (V)", "Corriente (A)" y "Potencia (W)" de la gráfica; sin lecturas muestra "Sin lecturas" y no hay gráfica) y luego `src/modulos/dashboard/ui/TarjetaSensor.tsx` y `src/modulos/dashboard/ui/GraficaSensor.tsx` (`"use client"`, tres `LineChart` con su propio `YAxis`); verificar con la prueba unitaria (CA-1, CA-2; Derivado: decisión #11)
- [x] 6.3 Escribir `src/modulos/dashboard/__tests__/lista-alertas.test.ts` (renderiza `ListaAlertas` a HTML: las filas salen en el orden recibido con fecha, sensor, magnitud, valor y umbral con unidad; sin alertas muestra "Sin alertas") y luego `src/modulos/dashboard/ui/ListaAlertas.tsx`; verificar con la prueba unitaria (CA-4; Derivado: decisión #11)
- [x] 6.4 Escribir `src/app/(tablero)/dashboard/page.tsx` (Server Component dinámico que lee de los servicios de sensores, lecturas y alertas, con 50 lecturas por sensor y 20 alertas); se verifica con `npm run typecheck` y, en la tarea 8.1, con Playwright (CA-1, CA-2, CA-4; Derivado: decisión #1, #4, #12)

## 7. menu.ts

- [x] 7.1 Escribir `src/modulos/dashboard/__tests__/menu.test.ts` (el registro real incluye "Dashboard" con `/dashboard` para ambos roles) y luego `src/modulos/dashboard/menu.ts`; verificar con la prueba unitaria (CA-1; Derivado: decisión #4)

## 8. Integración y aceptación

- [x] 8.1 Escribir `e2e/dashboard.spec.ts` (un técnico abre "Dashboard" y ve por cada sensor de la semilla su última lectura con V, A, W y fecha y las tres gráficas; el administrador crea un sensor con umbral de voltaje 1, simula su nodo y el dashboard muestra primero la alerta de ese sensor; sin sesión, `GET /api/lecturas` y `GET /api/alertas` responden 401); verificar con `npx playwright test --list` (CA-1, CA-2, CA-4, CA-6)
- [x] 8.2 `node .claude/skills/build-test/scripts/build-test.mjs 22` en verde (`typecheck`, `test:unit` y `test:integration`) y `openspec validate dashboard-lecturas-y-alertas --strict --type change --no-interactive` en verde (CA-1 a CA-7)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #22` y `Change: dashboard-lecturas-y-alertas`, y esperar que el CI esté en verde (lint, build y `openspec validate --all`).
- Correr `e2e/dashboard.spec.ts` contra la app levantada con la semilla cargada: `BASE_URL=http://localhost:<puerto> npm run e2e`.
- Revisar con el equipo los supuestos del orquestador (decisiones #4 a #9 y #11).
- Archivar con `openspec archive dashboard-lecturas-y-alertas --yes` en un PR propio, después del merge.
