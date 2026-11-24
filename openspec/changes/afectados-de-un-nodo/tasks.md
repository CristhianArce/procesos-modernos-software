# Tasks

## 1. Migración y semilla

- [x] 1.1 Escribir `db/migration/V202611240500__afectados.sql` con la tabla `nodo_usuarios` (llave foránea a `nodos` con `ON DELETE CASCADE`, alias obligatorio de 1 a 100 caracteres, sin unicidad) y su índice; se verifica con la tarea 2.1 y con `docker compose run --rm flyway migrate info` en el CI (CA-1, CA-3; Derivado: decisión #2)
- [x] 1.2 Escribir `src/modulos/afectados/__tests__/semilla.int.test.ts` (se aplica después de `nodos.sql`; aplicarla dos veces no duplica; `Subestación Sur` tiene `Usuario demo 02` y `Subestación Norte` ningún afectado de la semilla) y luego `db/seed/nodos_afectados.sql`; verificar con `npm run test:integration -- afectados/__tests__/semilla` en el CI (CA-1, CA-3; Derivado: decisión #4, #5)

## 2. Repo

- [x] 2.1 Escribir `src/modulos/afectados/__tests__/repo.int.test.ts` (con nodos propios de la prueba e inserciones SQL: `listarPorNodo` devuelve `{ id, alias, creadoEn }` en orden de creación; incluye alias repetidos; no trae afectados de otro nodo; devuelve `[]` para un nodo sin afectados; borrar el nodo borra sus afectados) y luego `src/modulos/afectados/repo.ts` con `import "server-only"`; verificar con `npm run test:integration -- afectados/__tests__/repo` en el CI (CA-1, CA-3; Derivado: decisión #1)

## 3. Schema

- [x] 3.1 Escribir `src/modulos/afectados/__tests__/schema.test.ts` (acepta un UUID; rechaza `nodoId` ausente, vacío y que no es UUID) y luego `src/modulos/afectados/schema.ts` con Zod; verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/schema.test.ts` (CA-3; Derivado: decisión #3)

## 4. Service

- [x] 4.1 Escribir `src/modulos/afectados/__tests__/service.test.ts` (sin BD, con el repo y `obtenerNodo` simulados: `listarAfectados` devuelve `{ total, afectados }` con el total igual al largo de la lista; total 0 y lista vacía para un nodo sin afectados; propaga el 404 de `obtenerNodo` sin llamar al repo) y luego `src/modulos/afectados/service.ts`; verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/service.test.ts` (CA-1, CA-3; Derivado: decisión #3)

## 5. Handler y contrato

- [x] 5.1 Escribir `src/app/api/__tests__/afectados.int.test.ts` (con `Request`, nodos y afectados propios de la prueba: el administrador y el técnico reciben 200 con el mismo total y la misma lista en orden de creación; un nodo sin afectados responde total 0 y lista vacía; un UUID inexistente responde 404 `Nodo no encontrado`; sin `nodoId` o con uno que no es UUID responde 400; sin sesión 401) y luego `src/app/api/afectados/route.ts` con `GET` envuelto en `conHttp`; verificar con `npm run test:integration -- afectados` en el CI (CA-1, CA-2, CA-3; Derivado: decisión #3)
- [x] 5.2 Agregar `GET /api/afectados` a `contracts/openapi.yaml` conservando las rutas existentes (esquemas `Afectado` y `AfectadosDeNodo`; respuestas 200, 400, 401 y 404); verificar con `npx vitest run --project unit src/__tests__/contrato.test.ts` (CA-2, CA-3; Derivado: decisión #3)

## 6. Página y UI

- [x] 6.1 Escribir `src/modulos/afectados/__tests__/lista-afectados.test.ts` (con `createElement` y `react-dom/server`: con dos afectados muestra el total 2 en `data-testid="total-afectados"` y los dos alias en orden; con alias repetidos muestra ambos; con total 0 muestra 0 y «Sin afectados») y luego `src/modulos/afectados/ui/ListaAfectados.tsx`; verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/lista-afectados.test.ts` (CA-1, CA-3; Derivado: decisión #1)
- [x] 6.2 Escribir `src/modulos/afectados/__tests__/extensiones.test.ts` (el registro incluye el panel «Afectados» con orden 40 después de «Aislamiento», y la página de la ficha no nombra al módulo `afectados`) y luego `src/modulos/afectados/paneles.ts` y `src/modulos/afectados/ui/PanelAfectados.tsx` (Server Component que llama a `listarAfectados` y pinta `ListaAfectados`); verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/extensiones.test.ts` y, el panel por rol, con Playwright en la tarea 7.1 (CA-1, CA-2)

## 7. Integración y aceptación

- [x] 7.1 Escribir `e2e/afectados.spec.ts` (el administrador abre la ficha de `Subestación Sur` y el panel muestra `Usuario demo 02`; el técnico abre la misma ficha y ve el mismo alias y el mismo total; el técnico abre la ficha de un nodo creado por la API en la prueba, con nombre único, y ve total 0 y «Sin afectados»; el nodo se borra en `afterEach`); verificar con `npx playwright test --list` (CA-1, CA-2, CA-3)
- [x] 7.2 `node .claude/skills/build-test/scripts/build-test.mjs 25` en verde (`typecheck` y `test:unit`) y `openspec validate afectados-de-un-nodo --strict --type change --no-interactive` en verde (CA-1 a CA-3)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #25` y `Change: afectados-de-un-nodo`, y esperar que el CI esté en verde (lint, pruebas de integración, build, migraciones y `openspec validate --all`).
- Correr `e2e/afectados.spec.ts` contra la app levantada con la semilla cargada: `BASE_URL=http://localhost:<puerto> npm run e2e`.
- Revisar con el equipo los supuestos del orquestador (decisiones #2 a #5).
- Archivar con `openspec archive afectados-de-un-nodo --yes` en un PR propio, después del merge.
