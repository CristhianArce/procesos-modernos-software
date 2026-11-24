# Tasks

## 1. Repo

- [x] 1.1 Escribir `src/modulos/aislamiento/__tests__/repo.int.test.ts` (con nodos propios de la prueba: `cambiarEstado` pone `desconectado` y luego `conectado` y devuelve `{ id, estado }`; repetir el destino devuelve el mismo estado; devuelve `null` si el nodo no existe; el nombre y la ubicación del nodo y el estado de otro nodo no cambian) y luego `src/modulos/aislamiento/repo.ts` con `import "server-only"` y un `UPDATE nodos SET estado … RETURNING id, estado`; verificar con `npm run test:integration -- aislamiento/__tests__/repo` (CA-1, CA-2, CA-4; Derivado: decisión #1, #4)

## 2. Schema

- [x] 2.1 Escribir `src/modulos/aislamiento/__tests__/schema.test.ts` (acepta `conectado` y `desconectado`; rechaza otro valor, un valor vacío, sin `estado` y un número) y luego `src/modulos/aislamiento/schema.ts` con Zod; verificar con `npm run test:unit -- aislamiento/__tests__/schema` (CA-1, CA-2; Derivado: decisión #3)

## 3. Service

- [x] 3.1 Escribir `src/modulos/aislamiento/__tests__/service.test.ts` (sin BD, con el repo simulado: `cambiarEstadoNodo` devuelve lo que devuelve el repo y lo llama con el id y el destino; lanza 404 `Nodo no encontrado` si el repo devuelve `null`; con un id que no es UUID lanza 404 sin llamar al repo) y luego `src/modulos/aislamiento/service.ts`; verificar con `npm run test:unit -- aislamiento/__tests__/service` (CA-1, CA-2, CA-4; Derivado: decisión #1, #3)

## 4. Handler y contrato

- [x] 4.1 Escribir `src/app/api/__tests__/aislamiento.int.test.ts` (con `Request` y nodos propios de la prueba: el administrador aísla un nodo conectado con 200 `{ id, estado: "desconectado" }` y `GET /api/nodos/{id}` lo confirma; lo reconecta con 200; repetir el destino responde 200 sin cambio; el nombre y la ubicación del nodo y el estado de otro nodo no cambian; un estado inválido, sin `estado` y un cuerpo que no es JSON responden 400 con `detalles` y el nodo no cambia; el técnico recibe 403 con cuerpo válido e inválido y el nodo no cambia; sin sesión 401; un UUID inexistente y un id mal formado responden 404 `Nodo no encontrado` y otro nodo conserva su estado; tras aislar un nodo con un sensor, `POST /api/simulador` sobre ese nodo responde 200 con lecturas) y luego `src/app/api/aislamiento/nodos/[id]/route.ts` con `PATCH` envuelto en `conHttp` (`requireRole("administrador")`, Zod y servicio); verificar con `npm run test:integration -- aislamiento` (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #1, #3)
- [x] 4.2 Agregar `PATCH /api/aislamiento/nodos/{id}` a `contracts/openapi.yaml` conservando las rutas existentes (esquemas `EstadoNodoCambiar` y `EstadoNodoActual`; respuestas 200, 400, 401, 403 y 404); verificar con `npm run test:unit -- contrato`, que exige cada ruta de `src/app/api` en el contrato (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #3)

## 5. Página y UI

- [x] 5.1 Escribir `src/modulos/aislamiento/__tests__/control-aislamiento.test.ts` (usa `createElement` y `react-dom/server`, con `next/navigation` simulado: para un nodo conectado muestra el botón «Aislar nodo» y no «Reconectar nodo»; para uno desconectado muestra «Reconectar nodo» y no «Aislar nodo»; en reposo no muestra «Confirmar» ni «Cancelar» ni `role="alert"`) y luego `src/modulos/aislamiento/ui/ControlAislamiento.tsx` (Client Component: reposo, confirmando con «Confirmar» y «Cancelar», `fetch` `PATCH` a `/api/aislamiento/nodos/{id}`, `router.refresh()` en una transición y mensaje de error en `role="alert"`); verificar con `npm run test:unit -- control-aislamiento` y, en la tarea 6.1, con Playwright (CA-1, CA-2; Derivado: decisión #2, #6, #7)
- [x] 5.2 Escribir `src/modulos/aislamiento/__tests__/extensiones.test.ts` (el registro incluye el panel «Aislamiento» con orden 30 después de «Simulador», y la página de la ficha no nombra al módulo `aislamiento`) y luego `src/modulos/aislamiento/paneles.ts` y `src/modulos/aislamiento/ui/PanelAislamiento.tsx` (Server Component: texto sin botones si el rol no es administrador; si lo es, lee el nodo con `buscarNodo` y pinta `ControlAislamiento`); verificar con `npm run test:unit -- aislamiento/__tests__/extensiones` y, el panel por rol, con Playwright en la tarea 6.1 (CA-3; Derivado: decisión #5)

## 6. Integración y aceptación

- [x] 6.1 Escribir `e2e/aislamiento.spec.ts` (el administrador crea un nodo por la API, abre su ficha, pulsa «Aislar nodo», confirma y la ficha muestra «Desconectado» sin recargar la página; recarga y sigue desconectado; pulsa «Reconectar nodo», confirma y vuelve «Conectado»; cancelar la confirmación no cambia el estado; un técnico abre la ficha y no ve los botones y su `PATCH` a la API responde 403; un `PATCH` del administrador a un nodo inexistente responde 404); verificar con `npx playwright test --list` (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #8)
- [x] 6.2 `node .claude/skills/build-test/scripts/build-test.mjs 23` en verde (`typecheck` y `test:unit`) y `openspec validate aislar-nodo-de-la-red --strict --type change --no-interactive` en verde (CA-1 a CA-4)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #23` y `Change: aislar-nodo-de-la-red`, y esperar que el CI esté en verde (lint, pruebas de integración, build y `openspec validate --all`).
- Correr `e2e/aislamiento.spec.ts` contra la app levantada con la semilla cargada: `BASE_URL=http://localhost:<puerto> npm run e2e`.
- Revisar con el equipo los supuestos del orquestador (decisiones #2 y #5).
- Archivar con `openspec archive aislar-nodo-de-la-red --yes` en un PR propio, después del merge.
