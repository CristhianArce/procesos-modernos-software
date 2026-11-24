# Tasks

## 1. Migración y semilla

- [x] 1.1 Crear `db/migration/V202611241700__afectados.sql` con la tabla `nodo_usuarios` (id, nodo_id con `ON DELETE CASCADE`, alias con CHECK de 1 a 80 caracteres, creado_en) y el índice por `nodo_id`; se verifica con las pruebas de integración de la tarea 2.1, que corre el CI (CA-1, CA-3; Derivado: decisión #4, #7)
- [x] 1.2 Escribir `src/modulos/afectados/__tests__/semilla.test.ts` (la semilla `nodos_usuarios.sql` ordena después de `nodos.sql`, usa `ON CONFLICT (id) DO NOTHING` e inserta `Usuario demo 02` en el nodo `…0002`) y luego `db/seed/nodos_usuarios.sql`; verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/semilla.test.ts` (CA-1, CA-3; Derivado: decisión #2, #6)

## 2. Repo

- [x] 2.1 Escribir `src/modulos/afectados/__tests__/repo.int.test.ts` (con nodos propios de la prueba: `listarPorNodo` devuelve `{ id, alias }` ordenados por alias y, entre alias repetidos, por id; no incluye afectados de otro nodo; devuelve `[]` para un nodo sin afectados; eliminar el nodo elimina sus afectados; un alias vacío viola el CHECK) y luego `src/modulos/afectados/repo.ts` con `import "server-only"`; verificar con `npm run test:integration -- afectados/__tests__/repo` en el CI (CA-1, CA-3; Derivado: decisión #1, #4, #7)

## 3. Schema

- [x] 3.1 Escribir `src/modulos/afectados/__tests__/schema.test.ts` (acepta un UUID; rechaza un texto que no es UUID, un valor vacío y la ausencia de `nodoId`) y luego `src/modulos/afectados/schema.ts` con Zod; verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/schema.test.ts` (CA-3; Derivado: decisión #3)

## 4. Service

- [x] 4.1 Escribir `src/modulos/afectados/__tests__/service.test.ts` (sin BD, con el repo y `obtenerNodo` simulados: `listarAfectados` devuelve `{ total, afectados }` con el total igual al largo de la lista y en el orden del repo; con un nodo sin afectados devuelve `{ total: 0, afectados: [] }`; si `obtenerNodo` lanza 404 propaga el 404 sin llamar al repo) y luego `src/modulos/afectados/service.ts`; verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/service.test.ts` (CA-1, CA-3; Derivado: decisión #4)

## 5. Handler y contrato

- [x] 5.1 Escribir `src/app/api/__tests__/afectados.int.test.ts` (con `Request`, un nodo propio con afectados insertados por SQL y otro sin afectados: el administrador y el técnico reciben 200 con el mismo `{ total, afectados }` ordenado por alias; el nodo sin afectados responde `{ total: 0, afectados: [] }`; un UUID inexistente responde 404 `Nodo no encontrado`; un `nodoId` mal formado y sin `nodoId` responden 400 con `detalles`; sin sesión 401) y luego `src/app/api/afectados/route.ts` con `GET` envuelto en `conHttp`; verificar con `npm run test:integration -- afectados` en el CI (CA-2, CA-3; Derivado: decisión #3, #4)
- [x] 5.2 Agregar `GET /api/afectados` a `contracts/openapi.yaml` conservando las rutas existentes (esquemas `Afectado` y `AfectadosNodo`; respuestas 200, 400, 401 y 404); verificar con `npx vitest run --project unit src/__tests__/contrato.test.ts`, que exige cada ruta de `src/app/api` en el contrato (CA-2, CA-3; Derivado: decisión #4)

## 6. Página y UI

- [x] 6.1 Escribir `src/modulos/afectados/__tests__/lista-afectados.test.ts` (con `createElement` y `react-dom/server`: con afectados muestra `afectados-total` con el total y clase `cifra`, la etiqueta «Total de afectados» y un `afectado` por alias en el orden recibido, incluidos alias repetidos; con total 0 muestra «Este nodo no tiene afectados» y no pinta `afectados-lista`) y luego `src/modulos/afectados/ui/ListaAfectados.tsx` reutilizando `EstadoVacio` y solo clases con tokens `--sc-*` (`text-tenue`, `.cifra`); el vacío se verifica por su texto y el panel no tiene controles interactivos; verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/lista-afectados.test.ts` (CA-1, CA-3; Derivado: decisión #1, #5)
- [x] 6.2 Escribir `src/modulos/afectados/__tests__/extensiones.test.ts` (el registro incluye el panel «Afectados» con orden 40 después de «Aislamiento», y la página de la ficha no nombra al módulo `afectados`) y luego `src/modulos/afectados/paneles.ts` y `src/modulos/afectados/ui/PanelAfectados.tsx` (carga con `Suspense` y `Cargando`, error con `EstadoError` «No se pudieron cargar los afectados», datos con `ListaAfectados`); verificar con `npx vitest run --project unit src/modulos/afectados/__tests__/extensiones.test.ts` y, el panel con datos reales por rol, con Playwright en la tarea 7.1 (CA-1, CA-2; Derivado: decisión #5)

## 7. Integración y aceptación

- [x] 7.1 Escribir `e2e/afectados.spec.ts` (el administrador abre la ficha de «Subestación Sur» y el panel muestra total 1 y `Usuario demo 02`; el técnico abre la misma ficha y ve la misma lista y el mismo total; el técnico abre la ficha de un nodo que crea la prueba y ve total 0 y el estado vacío, y el nodo se elimina en `afterEach`; selectores por `data-testid`); verificar con `npx playwright test --list` (CA-1, CA-2, CA-3; Derivado: decisión #6)
- [x] 7.2 `node .claude/skills/build-test/scripts/build-test.mjs 25` en verde (`typecheck` y `test:unit`) y `openspec validate ver-afectados-de-un-nodo --strict --type change --no-interactive` en verde (CA-1, CA-2, CA-3)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #25` y `Change: ver-afectados-de-un-nodo`, y esperar que el CI esté en verde (lint, pruebas de integración, build, e2e y `openspec validate --all`).
- Correr `e2e/afectados.spec.ts` contra la app levantada con la semilla cargada: `BASE_URL=http://localhost:<puerto> npm run e2e` (lo verifica el CI).
- Revisar con el equipo los supuestos del orquestador (decisiones #2, #3, #4 y #6).
- Archivar con `openspec archive ver-afectados-de-un-nodo --yes` como último commit del mismo PR, con el CI en verde y la revisión terminada, antes del merge.
