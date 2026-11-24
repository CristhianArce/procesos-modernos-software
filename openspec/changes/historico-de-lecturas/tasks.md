# Tasks

Las pruebas se nombran `#26 CA-n: …`. En cada tarea la prueba se escribe antes que el código.

## 1. Esquema de filtros (`src/modulos/historico/schema.ts`)

- [x] 1.1 `historicoFiltrosSchema` y `TAMANO_PAGINA = 25`: nodo y sensor como UUID, fechas ISO UTC, página entera ≥ 1 (por defecto 1), rechazo de `desde` posterior a `hasta` (CA-2, CA-4; Derivado: decisión #2). Verifica: `npx vitest run --project unit src/modulos/historico/__tests__/schema.test.ts` con `#26 CA-4` para fecha mal formada, rango invertido, UUID inválido y página 0, y `#26 CA-2` para filtros válidos y `desde == hasta`.

## 2. Repo (`src/modulos/historico/repo.ts`)

- [x] 2.1 `consultar(filtros)` con JOIN `lecturas → sensores → nodos`, filtros por `nodo_id`, `sensor_id` y `tomada_en >= desde AND tomada_en < hasta`, `ORDER BY l.tomada_en DESC, l.id DESC`, `LIMIT 25 OFFSET` (CA-1, CA-2; Derivado: decisiones #1 y #3). Verifica: `src/modulos/historico/__tests__/repo.int.test.ts` (integración, la corre el CI) con `#26 CA-1` (orden y desempate por id, 25 en la página 1 y 1 en la 2), `#26 CA-2` (nodo, sensor, combinados y extremos: `desde` incluido, `hasta` excluido) y `#26 CA-3` (sensor sin lecturas devuelve vacío).
- [x] 2.2 `contar(filtros)` con los mismos filtros (CA-1, CA-3). Verifica: mismo archivo, `#26 CA-1` (total 26 con 26 lecturas) y `#26 CA-3` (total 0).

## 3. Servicio (`src/modulos/historico/service.ts`)

- [x] 3.1 `consultarHistorico(filtros)` arma `{ items, pagina, tamano: 25, total }` con el repo mockeado, sin BD (CA-1, CA-3). Verifica: `npx vitest run --project unit src/modulos/historico/__tests__/service.test.ts` con `#26 CA-1` (forma y tamaño 25) y `#26 CA-3` (lista vacía con total 0).

## 4. Handler y contrato

- [x] 4.1 `src/app/api/historico/route.ts`: `GET` con `conHttp`, sesión y rol, parseo con el esquema y llamada al servicio (CA-4, CA-5). Verifica: `src/app/api/historico/__tests__/route.int.test.ts` (integración con `Request`) con `#26 CA-5` (sin cookie: 401 JSON), `#26 CA-4` (`desde=ayer` y rango invertido: 400 JSON), `#26 CA-1` (200 con `items`, `pagina`, `tamano`, `total`) y `#26 CA-3` (filtro sin resultados: 200 con lista vacía).
- [x] 4.2 Agregar `/api/historico` (GET) a `contracts/openapi.yaml` con los parámetros `nodoId`, `sensorId`, `desde`, `hasta`, `pagina`, el esquema `PaginaHistorico` y las respuestas 200, 400 y 401, conservando las demás rutas (CA-1, CA-4, CA-5). Verifica: `openspec validate historico-de-lecturas --strict --type change --no-interactive` pasa y `contracts/openapi.yaml` contiene `/api/historico` con las respuestas `$ref` a `#/components/responses/DatosInvalidos` y `#/components/responses/NoAutenticado` (Grep).

## 5. Página y componentes (`src/app/(tablero)/historico/`, `src/modulos/historico/ui/`)

- [x] 5.1 `FiltrosHistorico`, `TablaHistorico` y `PaginacionHistorico` como componentes síncronos, con los tokens `--sc-*`, `formato.ts` y `.cifra`, etiquetas accesibles y `data-testid` de design.md (CA-1, CA-2). Verifica: `npx vitest run --project unit src/modulos/historico/__tests__/ui.test.ts` renderizando a HTML con `react-dom/server`: `#26 CA-1` (25 filas con cifras formateadas, enlaces Anterior/Siguiente con sus estados), `#26 CA-2` (los valores de los filtros quedan en los campos con etiqueta).
- [x] 5.2 `page.tsx` (Server Component dinámico): valida `searchParams` con el esquema, llama a `consultarHistorico`, `listarNodos` y `listarTodosLosSensores`, y resuelve `EstadoError` (parámetros inválidos o fallo), `EstadoVacio` (CA-3) y la tabla; el estado de carga lo da el `loading.tsx` del grupo `(tablero)`, que ya usa `Cargando`. Verifica: la página es asíncrona, así que se prueba solo con Playwright (tarea 7.1); `npm run typecheck` pasa.

## 6. Menú (`src/modulos/historico/menu.ts`)

- [x] 6.1 Ítem «Histórico» a `/historico` para administrador y técnico, icono genérico (CA-1). Verifica: `npx vitest run --project unit src/modulos/historico/__tests__/menu.test.ts` con `#26 CA-1` (etiqueta, `href`, roles) y que el registro de menú lo descubre sin editar el núcleo.

## 7. Integración y aceptación de la historia

- [x] 7.1 `e2e/historico.spec.ts`: crea su nodo y sensor con nombres únicos (`Date.now()`), genera 26 lecturas con `POST /api/simulador`, y los elimina en `afterEach`. Cubre `#26 CA-1` (25 filas en la página 1, al menos 1 en la 2, fechas en orden descendente), `#26 CA-2` (filtro por su nodo y luego su sensor), `#26 CA-3` (filtro con un sensor sin lecturas muestra el estado vacío) y `#26 CA-5` (la API sin sesión responde 401). Selectores por rol con `exact: true` o `data-testid`; sin totales exactos sobre datos ajenos. Verifica: `npx playwright test --list` muestra los casos; se revisa contra las reglas e2e de CLAUDE.md §7.
- [x] 7.2 (CA-1 a CA-5) `npm run typecheck` y `npm run test:unit` en verde; `test:integration`, `e2e`, `lint` y `build` los corre el CI del PR.

## Workflow follow-up

- Abrir el PR en borrador con `Closes #26` y `Change: historico-de-lecturas`.
- Esperar el CI (integración, e2e, lint y build) y revisar sus resultados.
- Archivar con `openspec archive historico-de-lecturas --yes` en un PR propio, después del merge.
