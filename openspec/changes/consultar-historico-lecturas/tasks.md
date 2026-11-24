# Tasks

## 1. Migración y semilla

- [x] 1.1 Sin migración ni semilla (RN-1; Derivado: decisión #8): confirmar que `git diff --name-only main -- db/` no lista archivos de `db/migration/` ni `db/seed/historico.sql`.

## 2. Schema y tipos

- [x] 2.1 Prueba unitaria primero en `src/modulos/historico/__tests__/schema.test.ts` (`#26 CA-4: ...`, `#26 CA-2: ...`) y luego `src/modulos/historico/schema.ts` con `historicoFiltrosSchema`: `nodoId`, `sensorId` (guid), `desde`, `hasta` (ISO con zona), `pagina` (≥ 1, por defecto 1), parámetros vacíos como ausentes y `desde <= hasta` (CA-4; Derivado: decisión #6). Se verifica con `npx vitest run --project unit src/modulos/historico/__tests__/schema.test.ts`: rechaza `desde=ayer`, rango invertido, `sensorId=abc` y `pagina=0`, y acepta `desde` igual a `hasta`.
- [x] 2.2 `src/modulos/historico/tipos.ts` sin Zod, con `TAMANO_PAGINA = 25` y los tipos `FilaHistorico` y `PaginaHistorico` (`{ lecturas, total, pagina, tamano }`) que usa también la interfaz (RN-2; Derivado: decisión #5). Se verifica con `npm run typecheck` y con un `it("#26 CA-1: ...")` que fija `TAMANO_PAGINA` en 25.

## 3. Repo

- [x] 3.1 Prueba de integración primero en `src/modulos/historico/__tests__/repo.int.test.ts` (`#26 CA-1`, `#26 CA-2`, `#26 CA-3`) con su propio nodo, sensores y lecturas, que borra al terminar, y luego `src/modulos/historico/repo.ts` (`import "server-only"`, solo SQL): consulta parametrizada con `ORDER BY l.tomada_en DESC, l.id DESC`, `LIMIT 25 OFFSET`, `count(*)` con el mismo `WHERE`, filtros por nodo (`JOIN sensores`), sensor y rango inclusivo `>=`/`<=` (CA-1, CA-2; Derivado: decisiones #1 y #2). Se verifica con la prueba de integración del CI (`npm run test:integration`) y `npm run typecheck`.
- [x] 3.2 Casos del repo para el vacío: filtro sin coincidencias, página más allá de la última e identificador inexistente devuelven `lecturas: []` sin error, con el total real (CA-3; Derivado: decisiones #3 y #7). Se verifica en el mismo `repo.int.test.ts` (`#26 CA-3: ...`).

## 4. Service

- [x] 4.1 Prueba unitaria primero en `src/modulos/historico/__tests__/service.test.ts` (repo simulado, `#26 CA-1` y `#26 CA-3`) y luego `src/modulos/historico/service.ts` con `consultarHistorico(filtros)`, que calcula el desplazamiento desde `pagina` y arma `{ lecturas, total, pagina, tamano }` (CA-1, CA-3; Derivado: decisión #5). Se verifica con `npx vitest run --project unit src/modulos/historico/__tests__/service.test.ts`.

## 5. Handler y contrato

- [x] 5.1 Prueba de integración primero en `src/modulos/historico/__tests__/handler.int.test.ts` con `Request` (`#26 CA-5: sin sesión responde 401 en JSON`, `#26 CA-4: fecha mal formada responde 400`, `#26 CA-4: rango invertido responde 400`, `#26 CA-1: devuelve 25 y el total`, `#26 CA-2: filtra por sensorId`, `#26 CA-3: filtro sin resultados devuelve lista vacía`) y luego `src/app/api/historico/route.ts` con `conHttp("/api/historico", ...)`: `requireRole(await sessionFromRequest(req), ...ROLES)` antes de `historicoFiltrosSchema.parse` y `consultarHistorico` (CA-1, CA-4, CA-5; Derivado: decisión #4). Se verifica con `npm run test:integration` en el CI y `npm run typecheck`.
- [x] 5.2 `contracts/openapi.yaml`: agregar `/api/historico` (GET, parámetros `nodoId`, `sensorId`, `desde`, `hasta`, `pagina`, respuestas 200, 400 y 401) y el esquema `PaginaHistorico`, reutilizando `Lectura`, `DatosInvalidos` y `NoAutenticado` y conservando las rutas de las demás historias (CA-1 a CA-5). Se verifica con `openspec validate consultar-historico-lecturas --strict --type change --no-interactive` y revisando que `git diff contracts/openapi.yaml` solo agrega líneas.

## 6. Página y ui

- [x] 6.1 `src/modulos/historico/ui/ConsultaHistorico.tsx` (`"use client"`, llama a `GET /api/historico`, sin Zod): filtros con `.campo` (nodo, sensor, desde, hasta), conversión de las fechas a ISO con zona, tabla `.tabla` con valores por `formato.ts` y `.cifra`, y paginación por botones, con `Cargando`, `EstadoError` (con reintentar) y `EstadoVacio` (CA-1, CA-2, CA-3). La tabla y el estado vacío van en el componente síncrono `ui/TablaHistorico.tsx`, que recibe las filas por props. Se verifica con una prueba unitaria `#26 CA-3: ...` que renderiza `TablaHistorico` con `react-dom/server` (estado vacío y tabla con filas), y con el e2e 8.1 para el flujo con datos.
- [x] 6.2 `src/app/(tablero)/historico/page.tsx` (Server Component dinámico, `export const dynamic = "force-dynamic"`): carga nodos y sensores con `listarNodos` y `listarTodosLosSensores` y renderiza `ConsultaHistorico` dentro de `Tarjeta`, sin `fetch` a la API propia (CA-1, CA-2). Se verifica con `npm run typecheck` y con el e2e 8.1.
- [x] 6.3 Accesibilidad y diseño: solo tokens `--sc-*` y clases existentes (sin colores hex ni paleta de Tailwind), controles con nombre accesible, operables con teclado y con foco visible. Se verifica con `grep` de `#[0-9a-fA-F]{3,6}` y `bg-red|text-red` sin coincidencias en `src/modulos/historico/` y con la prueba e2e 8.1 que opera filtros y paginación con el teclado (CA-1, CA-2).

## 7. menu.ts

- [x] 7.1 Prueba unitaria primero en `src/modulos/historico/__tests__/menu.test.ts` (`#26 CA-1: ...`) y luego `src/modulos/historico/menu.ts` con `{ etiqueta: "Histórico", href: "/historico", roles: ["administrador", "tecnico"], orden: 20 }` y el icono genérico, sin editar `src/shell/` (CA-1; Derivado: decisión #4). Se verifica con `npx vitest run --project unit src/modulos/historico/__tests__/menu.test.ts`.

## 8. Integración y aceptación

- [x] 8.1 Prueba e2e en `e2e/historico.spec.ts` (`#26 CA-1: ...`, `#26 CA-2: ...`, `#26 CA-3: ...`, `#26 CA-5: ...`): un nodo y un sensor propios con nombres únicos (`Date.now()`) y 26 lecturas con fechas distintas creadas por la API, que se eliminan en `afterEach`. Comprueba 25 filas en la primera página y una en la segunda, el filtro por nodo y por fechas acotado a sus datos, el vacío con un filtro sin resultados y la redirección al login sin sesión; los selectores usan rol con nombre `exact: true` o `data-testid`. Se verifica con `npx playwright test e2e/historico.spec.ts --list`.
- [x] 8.2 Revisión de trazabilidad: cada `CA-1` a `CA-5` tiene al menos una prueba cuyo nombre cita `#26 CA-k`. Se verifica con `node .claude/skills/orquestador/scripts/trazabilidad-grep.mjs .flujo/issue-26/issue.md openspec/changes/consultar-historico-lecturas --pruebas 26` sin `sinCobertura`.

## Workflow follow-up

- Abrir el PR en borrador con `Closes #26` y `Change: consultar-historico-lecturas`.
- Esperar el CI del PR: `lint`, `build`, `test:integration` y `e2e` (primera ejecución real de las pruebas de integración y e2e).
- Archivar el change con `openspec archive consultar-historico-lecturas --yes` en un PR propio, después del merge.
