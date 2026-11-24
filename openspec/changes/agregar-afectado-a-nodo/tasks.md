# Tasks

## 1. Migración

- [x] 1.1 Escribir `db/migration/V202611240600__nodo_usuarios.sql` con la tabla `nodo_usuarios` (id, nodo_id con `ON DELETE CASCADE`, alias con `CHECK` de 1 a 100 caracteres, creado_en) y su índice por `nodo_id`, sin índice único; verificar en el CI con `docker compose run --rm flyway migrate info` y con la prueba de la tarea 2.1 (CA-1; Derivado: decisión #2)

## 2. Repo

- [x] 2.1 Escribir `src/modulos/afectados/__tests__/repo.int.test.ts` (con nodos propios de la prueba: `crear` devuelve `{ id, nodoId, alias, creadoEn }`; `listarPorNodo` devuelve los afectados del nodo en orden de alta y no los de otro nodo; un alias repetido se guarda dos veces; borrar el nodo borra sus afectados) y luego `src/modulos/afectados/repo.ts` con `import "server-only"`; verificar con `npm run test:integration -- afectados/__tests__/repo` (CA-1; Derivado: decisión #2)

## 3. Schema

- [x] 3.1 Escribir `src/modulos/afectados/__tests__/schema.test.ts` (acepta un alias válido y un UUID; recorta los espacios; rechaza alias vacío, de solo espacios, de 101 caracteres o ausente, y un `nodoId` ausente o que no es UUID) y luego `src/modulos/afectados/schema.ts` con Zod; verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/schema.test.ts` (CA-2; Derivado: decisión #1)

## 4. Service

- [x] 4.1 Escribir `src/modulos/afectados/__tests__/service.test.ts` (sin BD, con el repo y `obtenerNodo` simulados: `agregarAfectado` devuelve lo que crea el repo; si `obtenerNodo` lanza 404 no llama a `repo.crear`; `listarAfectados` devuelve la lista del repo) y luego `src/modulos/afectados/service.ts`; verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/service.test.ts` (CA-1, CA-3)

## 5. Handler y contrato

- [x] 5.1 Escribir `src/app/api/__tests__/afectados.int.test.ts` (con `Request` y nodos propios: el administrador agrega un afectado con 201 y el nodo tiene uno más; un alias repetido responde 201; otro nodo no cambia; alias vacío, de solo espacios, de 101 caracteres, sin alias, `nodoId` mal formado y cuerpo que no es JSON responden 400 y no se guarda nada; un UUID sin nodo responde 404 y no se guarda nada; el técnico recibe 403 con cuerpo válido e inválido y no se guarda nada; sin sesión 401) y luego `src/app/api/afectados/route.ts` con `POST` envuelto en `conHttp`; verificar con `npm run test:integration -- afectados` (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #3)
- [x] 5.2 Agregar `POST /api/afectados` a `contracts/openapi.yaml` conservando las rutas existentes (esquemas `AfectadoCrear` y `Afectado`; respuestas 201, 400, 401, 403 y 404); verificar con `npx vitest run --project unit src/__tests__/contrato.test.ts` (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #3)

## 6. Página y UI

- [x] 6.1 Escribir `src/modulos/afectados/__tests__/formulario-afectado.test.ts` (con `createElement` y `react-dom/server` y `next/navigation` simulado: muestra el campo «Alias» con `maxLength` 100 y el botón «Agregar afectado»; en reposo no muestra `role="alert"`) y luego `src/modulos/afectados/ui/FormularioAfectado.tsx`; verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/formulario-afectado.test.ts` y, el alta, con Playwright en la tarea 7.1 (CA-1, CA-2)
- [x] 6.2 Escribir `src/modulos/afectados/__tests__/extensiones.test.ts` (el registro incluye el panel «Afectados» con orden 40, y la página de la ficha no nombra al módulo `afectados`) y luego `src/modulos/afectados/paneles.ts` y `src/modulos/afectados/ui/PanelAfectados.tsx` (Server Component: total, lista o `EstadoVacio` y el formulario solo para el administrador); verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/extensiones.test.ts` y, el panel por rol, con Playwright en la tarea 7.1 (CA-1, CA-4)

## 7. Integración y aceptación

- [x] 7.1 Escribir `e2e/afectados.spec.ts` (el administrador crea un nodo propio por la API, abre su ficha, ve total 0, agrega un alias único y ve el alias en la lista y total 1; recarga y sigue igual; un técnico abre la ficha, ve la lista y no ve el botón «Agregar afectado», y su `POST` responde 403 sin cambiar el total; el nodo se borra en `afterEach`); verificar con `npx playwright test --list` (CA-1, CA-4)
- [x] 7.2 `node .claude/skills/build-test/scripts/build-test.mjs 54` en verde (`typecheck` y `test:unit`) y `openspec validate agregar-afectado-a-nodo --strict --type change --no-interactive` en verde (CA-1 a CA-4)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #54` y `Change: agregar-afectado-a-nodo`, y esperar que el CI esté en verde (lint, migraciones, pruebas de integración, build y `openspec validate --all`).
- Correr `e2e/afectados.spec.ts` contra la app levantada: `BASE_URL=http://localhost:<puerto> npm run e2e`.
- Revisar con el equipo las decisiones #2 y #3 (la HU 8 debe reutilizar la tabla y el módulo).
- Archivar con `openspec archive agregar-afectado-a-nodo --yes` en un PR propio, después del merge.
