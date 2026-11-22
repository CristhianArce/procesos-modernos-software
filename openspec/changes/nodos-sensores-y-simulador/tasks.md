# Tasks

Las pruebas unitarias se verifican con `npx vitest run --project unit <archivo>` y las de integración con `node .claude/skills/build-test/scripts/build-test.mjs 21 --solo test:integration`, que levanta y migra la BD de la corrida.

## 1. Migración

- [x] 1.1 Escribir `src/modulos/nodos/__tests__/tablas.int.test.ts` (un nodo nace `conectado`; se rechazan un estado distinto de `conectado` y `desconectado`, un sensor sin nodo y un umbral menor o igual que 0; eliminar un nodo elimina sus sensores y lecturas) y luego `db/migration/V202611222130__nodos_sensores_lecturas.sql` con las tablas `nodos`, `sensores` y `lecturas`; verificar con la prueba de integración en verde (CA-1, CA-2, CA-6; Derivado: decisión #1, #2, #3, #5)

## 2. Repo

- [x] 2.1 Escribir `src/modulos/nodos/__tests__/repo.int.test.ts` (crear devuelve el nodo con estado `conectado`; listar lo incluye; buscar devuelve `null` si no existe; actualizar cambia solo los campos enviados y conserva el estado; eliminar devuelve si existía) y luego `src/modulos/nodos/repo.ts` con `import "server-only"`; verificar con la prueba de integración (CA-1, CA-4)
- [x] 2.2 Escribir `src/modulos/sensores/__tests__/repo.int.test.ts` (crear asocia el sensor al nodo con sus umbrales; listar por nodo devuelve solo los de ese nodo; buscar, actualizar y eliminar, con `null` o `false` si no existe) y luego `src/modulos/sensores/repo.ts`; verificar con la prueba de integración (CA-2, CA-4; Derivado: decisión #3)
- [x] 2.3 Escribir `src/modulos/lecturas/__tests__/repo.int.test.ts` (insertar varias lecturas en una llamada; la última por sensor es la más reciente; un sensor sin lecturas no aparece) y luego `src/modulos/lecturas/repo.ts`; verificar con la prueba de integración (CA-6; Derivado: decisión #2, #18)

## 3. Schema

- [x] 3.1 Escribir `src/modulos/nodos/__tests__/schema.test.ts` (acepta nombre y ubicación opcional; rechaza nombre vacío, de solo espacios o de más de 80 caracteres y ubicación de más de 120; la edición rechaza un cuerpo sin campos y descarta `estado`) y luego `src/modulos/nodos/schema.ts` con Zod; verificar con la prueba unitaria (CA-3; Derivado: decisión #8, #14)
- [x] 3.2 Escribir `src/modulos/sensores/__tests__/schema.test.ts` (acepta `nodoId`, nombre y umbrales opcionales; rechaza `nodoId` que no es UUID, nombre inválido y umbrales negativos, cero o no numéricos; la edición rechaza un cuerpo sin campos y descarta `nodoId`) y luego `src/modulos/sensores/schema.ts`; verificar con la prueba unitaria (CA-3; Derivado: decisión #3, #14)
- [x] 3.3 Escribir `src/modulos/simulador/__tests__/schema.test.ts` (acepta `nodoId` UUID; rechaza el cuerpo sin `nodoId` o con uno que no es UUID) y luego `src/modulos/simulador/schema.ts`; verificar con la prueba unitaria (CA-3, CA-6; Derivado: decisión #10)

## 4. Service

- [x] 4.1 Escribir `src/modulos/nodos/__tests__/service.test.ts` (sin BD, con el repo simulado: obtener, editar y eliminar lanzan 404 si el repo no encuentra el nodo; un id que no es UUID lanza 404 sin llamar al repo; crear y listar delegan en el repo) y luego `src/modulos/nodos/service.ts`; verificar con la prueba unitaria (CA-1, CA-4; Derivado: decisión #13)
- [x] 4.2 Escribir `src/modulos/lecturas/__tests__/service.test.ts` (sin BD: registrar una lista vacía no llama al repo; las últimas lecturas se devuelven indexadas por sensor) y luego `src/modulos/lecturas/service.ts`; verificar con la prueba unitaria (CA-6; Derivado: decisión #9, #18)
- [x] 4.3 Escribir `src/modulos/sensores/__tests__/service.test.ts` (sin BD: crear o listar para un nodo inexistente lanza 404 y no crea nada; obtener, editar y eliminar lanzan 404 si el sensor no existe o el id no es UUID; cada sensor trae `ultimaLectura` o `null`) y luego `src/modulos/sensores/service.ts`; verificar con la prueba unitaria (CA-2, CA-4, CA-6; Derivado: decisión #13, #18)
- [x] 4.4 Escribir `src/modulos/simulador/__tests__/generador.test.ts` (con el azar inyectado: la lectura normal queda en 110 a 130 V y 0,5 a 20 A con potencia = voltaje × corriente; un sensor con umbrales y azar bajo supera un umbral entre 5 % y 20 %; un sensor sin umbrales nunca sale del rango) y luego `src/modulos/simulador/generador.ts`; verificar con la prueba unitaria (CA-6; Derivado: decisión #4, #15)
- [x] 4.5 Escribir `src/modulos/simulador/__tests__/service.test.ts` (sin BD: registra una lectura por cada sensor del nodo; un nodo sin sensores devuelve cero lecturas; un nodo inexistente lanza 404 y no registra nada) y luego `src/modulos/simulador/service.ts`; verificar con la prueba unitaria (CA-4, CA-6; Derivado: decisión #9, #10)

## 5. Semilla de demostración

- [x] 5.1 Escribir `src/modulos/nodos/__tests__/semilla.int.test.ts` (aplica `db/seed/nodos.sql` y `db/seed/sensores.sql` dos veces sin duplicar nodos, sensores ni lecturas; cada nodo de la semilla tiene sensores y cada sensor una lectura) y luego `db/seed/nodos.sql` y `db/seed/sensores.sql` con identificadores fijos y `ON CONFLICT (id) DO NOTHING`; verificar con la prueba de integración (CA-7; Derivado: decisión #17)

## 6. Handler y contrato

- [x] 6.1 Escribir `src/app/api/__tests__/nodos.int.test.ts` (con `Request` y cookie firmada: el administrador crea con 201 y estado `conectado`, y el nodo aparece en `GET /api/nodos`; 400 con detalle y sin guardar para nombre inválido, cuerpo que no es JSON y edición vacía; 404 en `GET`, `PATCH` y `DELETE` de un id inexistente o mal formado; el técnico recibe 403 al crear, editar y eliminar y 200 al listar y consultar; 401 sin sesión; `DELETE` responde 204 y elimina los sensores del nodo) y luego `src/app/api/nodos/route.ts` y `src/app/api/nodos/[id]/route.ts` con `conHttp`; verificar con la prueba de integración (CA-1, CA-3, CA-4, CA-5; Derivado: decisión #5, #6, #13, #20)
- [x] 6.2 Escribir `src/app/api/__tests__/sensores.int.test.ts` (el administrador agrega un sensor con 201 y aparece en `GET /api/sensores?nodoId=`; 400 para umbral inválido, edición vacía y `GET` sin `nodoId`; 404 para sensor inexistente o mal formado y para un nodo inexistente al crear; el técnico recibe 403 al escribir y 200 al consultar; un sensor nuevo trae `ultimaLectura` en `null`) y luego `src/app/api/sensores/route.ts` y `src/app/api/sensores/[id]/route.ts`; verificar con la prueba de integración (CA-2, CA-3, CA-4, CA-5; Derivado: decisión #13, #18)
- [x] 6.3 Escribir `src/app/api/__tests__/simulador.int.test.ts` (el administrador simula un nodo con dos sensores y recibe 200 con dos lecturas de voltaje, corriente y potencia; tras dos simulaciones `GET /api/sensores` trae en `ultimaLectura` la segunda; un nodo sin sensores responde 200 con cero lecturas; 400 sin `nodoId`; 404 con un nodo inexistente; 403 para el técnico, que sí lee `ultimaLectura`; 401 sin sesión) y luego `src/app/api/simulador/route.ts`; verificar con la prueba de integración (CA-3, CA-4, CA-5, CA-6; Derivado: decisión #9, #10, #11, #18)
- [x] 6.4 Agregar a `contracts/openapi.yaml` las rutas `/api/nodos`, `/api/nodos/{id}`, `/api/sensores`, `/api/sensores/{id}` y `/api/simulador` con sus esquemas, conservando las rutas existentes; verificar con `npx vitest run --project unit src/__tests__/contrato.test.ts`, que exige cada ruta de `src/app/api` en el contrato (CA-1 a CA-6; Derivado: decisión #20)

## 7. Página y UI

- [x] 7.1 Escribir `src/modulos/nodos/__tests__/formulario-nodo.test.ts` (renderiza `FormularioNodo` a HTML con `react-dom/server`: campos `nombre` y `ubicacion` y botón "Crear nodo", sin alerta inicial) y luego `src/modulos/nodos/ui/FormularioNodo.tsx` (Client Component que llama a `POST /api/nodos`, refresca la lista con 201 y muestra el error con 400 o 403) y `src/app/(tablero)/nodos/page.tsx` (lista dinámica que lee del servicio; el formulario solo para el administrador); verificar con la prueba unitaria y, en la tarea 9.1, con Playwright (CA-1, CA-5; Derivado: decisión #12)
- [x] 7.2 Escribir `src/app/(tablero)/nodos/[id]/page.tsx`: datos del nodo y los paneles de `registro.paneles` en orden, con `notFound()` si el nodo no existe y sin importar módulos distintos de `nodos`; es un Server Component asíncrono, así que se verifica con `npm run typecheck` y, en la tarea 9.1, con Playwright (CA-4, CA-7; Derivado: decisión #19)
- [x] 7.3 Escribir `src/modulos/sensores/__tests__/formulario-sensor.test.ts` (renderiza `FormularioSensor` a HTML: campo `nombre`, los tres umbrales y botón "Agregar sensor") y luego `src/modulos/sensores/ui/FormularioSensor.tsx` (llama a `POST /api/sensores` y refresca) y `src/modulos/sensores/ui/PanelSensores.tsx` (lista los sensores del nodo con sus umbrales y su última lectura; el formulario solo para el administrador); verificar con la prueba unitaria y, en la tarea 9.1, con Playwright (CA-2, CA-5, CA-6; Derivado: decisión #12, #18)
- [x] 7.4 Escribir `src/modulos/simulador/__tests__/boton-simular.test.ts` (renderiza `BotonSimular` a HTML: botón "Simular lecturas") y luego `src/modulos/simulador/ui/BotonSimular.tsx` (llama a `POST /api/simulador` con el nodo y refresca) y `src/modulos/simulador/ui/PanelSimulador.tsx` (muestra el botón solo al administrador); verificar con la prueba unitaria y, en la tarea 9.1, con Playwright (CA-5, CA-6; Derivado: decisión #11, #12)

## 8. menu.ts y paneles.ts

- [x] 8.1 Escribir `src/modulos/nodos/__tests__/extensiones.test.ts` (el registro real incluye el ítem "Nodos" con `/nodos` para ambos roles y los paneles "Sensores" y "Simulador" en ese orden; la página de la ficha no contiene `modulos/sensores` ni `modulos/simulador`) y luego `src/modulos/nodos/menu.ts`, `src/modulos/sensores/paneles.ts` y `src/modulos/simulador/paneles.ts`; verificar con la prueba unitaria y con `npx vitest run --project unit src/nav/__tests__/registro.test.ts` (CA-5, CA-7; Derivado: decisión #19)

## 9. Integración y aceptación

- [x] 9.1 Escribir `e2e/nodos.spec.ts` (el administrador crea un nodo desde `/nodos` y lo ve en la lista como "conectado"; abre la ficha de un nodo de la semilla y ve sus datos, sus sensores y los paneles; agrega un sensor y aparece en la ficha; pulsa "Simular lecturas" y cada sensor muestra una lectura nueva; el técnico ve la lista y la ficha sin los formularios ni el botón; una ficha inexistente muestra "no encontrado"); verificar con `npx playwright test --list` (CA-1, CA-2, CA-4, CA-5, CA-6, CA-7)
- [x] 9.2 `node .claude/skills/build-test/scripts/build-test.mjs 21` en verde (`typecheck`, `test:unit` y `test:integration`) y `openspec validate nodos-sensores-y-simulador --strict --type change --no-interactive` en verde (CA-1 a CA-7)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #21` y `Change: nodos-sensores-y-simulador`, y esperar que el CI esté en verde (lint, build y `openspec validate --all`).
- Correr `e2e/nodos.spec.ts` contra la app levantada con la semilla cargada: `BASE_URL=http://localhost:<puerto> npm run e2e`.
- Revisar con el equipo los supuestos del orquestador (decisiones #11 a #20).
- Después del merge, comprobar en la URL pública que el CD migró y sembró la base y que la ficha de un nodo de demostración muestra sus sensores.
- Archivar con `openspec archive nodos-sensores-y-simulador --yes` en un PR propio, después del merge.
