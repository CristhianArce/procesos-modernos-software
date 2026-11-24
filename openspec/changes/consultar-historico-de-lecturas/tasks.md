# Tasks

## 1. Semilla

- [x] 1.1 Escribir `src/modulos/historico/__tests__/semilla.test.ts` (lee `db/seed/historico.sql`: usa `ON CONFLICT (id) DO NOTHING`, crea el nodo `…0901` y los sensores `…0911` y `…0912`, y trae 26 lecturas del sensor A dentro de `2026-01-10`–`2026-01-12`, 2 del sensor B y 2 del sensor A fuera del rango) y luego `db/seed/historico.sql`; verificar con `npx vitest run --project unit src/modulos/historico/__tests__/semilla.test.ts` (CA-1, CA-2; Derivado: decisión #6)

## 2. Repo

- [x] 2.1 Escribir `src/modulos/historico/__tests__/repo.int.test.ts` (con un nodo, dos sensores y lecturas propias de la prueba, con fechas fijas: `listarPagina` devuelve 25 por página de la más reciente a la más antigua con nombres de nodo y sensor; la página 2 trae el resto; los filtros por nodo, sensor y días se combinan; el borde de las 23:30 de Bogotá del día anterior queda fuera; `desde` igual a `hasta` trae solo ese día; un sensor de otro nodo da `[]`; `contar` coincide con el total; la consulta no cambia el número de filas de `lecturas`) y luego `src/modulos/historico/repo.ts` con `import "server-only"`; verificar con `npm run test:integration -- historico/__tests__/repo` en el CI (CA-1, CA-2, CA-3; Derivado: decisión #1, #3, #4)

## 3. Schema

- [x] 3.1 Escribir `src/modulos/historico/__tests__/schema.test.ts` (acepta sin filtros con `pagina` 1 por defecto; convierte `""` en ausente; acepta `desde` igual a `hasta`; rechaza `desde=2026-13-40`, `hasta=ayer`, `desde` posterior a `hasta`, `pagina=0`, `pagina=abc` y un `nodoId` que no es UUID; `filtrosHistoricoSchema` no tiene `pagina`) y luego `src/modulos/historico/schema.ts`; verificar con `npx vitest run --project unit src/modulos/historico/__tests__/schema.test.ts` (CA-2, CA-4; Derivado: decisión #2, #5, #10)

## 4. Service

- [x] 4.1 Escribir `src/modulos/historico/__tests__/service.test.ts` (sin BD, con el repo simulado: `consultarHistorico` devuelve `{ pagina, porPagina: 25, total, totalPaginas, lecturas }` con `totalPaginas = ceil(total / 25)`; pasa los filtros y la página al repo; con total 0 devuelve `totalPaginas` 0 y `lecturas` vacía) y luego `src/modulos/historico/service.ts`; verificar con `npx vitest run --project unit src/modulos/historico/__tests__/service.test.ts` (CA-1, CA-3; Derivado: decisión #5)

## 5. Handler y contrato

- [x] 5.1 Escribir `src/app/api/__tests__/historico.int.test.ts` (con `Request` y datos propios de fechas fijas: administrador y técnico reciben 200 con la misma respuesta, 25 lecturas y la más reciente primero; `pagina=2` trae el resto; filtros combinados; rango sin lecturas, nodo inexistente y sensor de otro nodo responden 200 con `lecturas` vacía y `total` 0; fecha mal formada, rango invertido, `pagina=0` y `nodoId` inválido responden 400 con `detalles`; sin sesión 401 en JSON; la consulta no cambia el número de filas de `lecturas`) y luego `src/app/api/historico/route.ts` con `GET` envuelto en `conHttp`; verificar con `npm run test:integration -- historico` en el CI (CA-1, CA-2, CA-3, CA-4, CA-5; Derivado: decisión #4, #5)
- [x] 5.2 Agregar `GET /api/historico` a `contracts/openapi.yaml` conservando las rutas existentes (parámetros `nodoId`, `sensorId`, `desde`, `hasta`, `pagina`; esquemas `LecturaHistorico` y `HistoricoPagina`; respuestas 200, 400 y 401); verificar con `npx vitest run --project unit src/__tests__/contrato.test.ts` (CA-1, CA-4, CA-5; Derivado: decisión #5)

## 6. Página, UI y menú

- [x] 6.1 Escribir `src/modulos/historico/__tests__/paginacion.test.ts` (`enlacePagina` arma `/historico?…&pagina=n`, conserva los filtros presentes y omite los ausentes) y luego `src/modulos/historico/paginacion.ts`; verificar con `npx vitest run --project unit src/modulos/historico/__tests__/paginacion.test.ts` (CA-1, CA-2; Derivado: decisión #8)
- [x] 6.2 Escribir `src/modulos/historico/__tests__/tabla-historico.test.ts` (con `createElement` y `react-dom/server`: una fila `lectura-historico` por lectura en el orden recibido, con fecha, nodo, sensor y cifras con clase `cifra`; `historico-total` y «Página 1 de 2»; en la primera página no hay `pagina-anterior` y `pagina-siguiente` apunta a la página 2 con los filtros; en la última no hay `pagina-siguiente`; con total 0 muestra «No hay lecturas con estos filtros» y no pinta `tabla-historico`) y luego `src/modulos/historico/ui/TablaHistorico.tsx`, reutilizando `EstadoVacio`, `formato.ts`, `formatearFecha` y la clase `.tabla`; el vacío se verifica por su texto y los enlaces son elementos `<a>` operables con teclado; verificar con `npx vitest run --project unit src/modulos/historico/__tests__/tabla-historico.test.ts` (CA-1, CA-3; Derivado: decisión #7, #8)
- [x] 6.3 Escribir `src/modulos/historico/__tests__/filtros-historico.test.ts` (renderiza un `<form method="get">` con `filtros-historico`, etiquetas visibles «Nodo», «Sensor», «Desde» y «Hasta» asociadas a sus controles, opciones «Todos», sensores como «<nodo> · <sensor>», valores actuales seleccionados y el botón «Filtrar») y luego `src/modulos/historico/ui/FiltrosHistorico.tsx` con controles nativos y clases `.campo` y `.boton-primario`; verificar con `npx vitest run --project unit src/modulos/historico/__tests__/filtros-historico.test.ts` (CA-2; Derivado: decisión #8)
- [x] 6.4 Escribir `src/modulos/historico/__tests__/menu.test.ts` («Histórico» con `/historico` y orden 15 aparece en el menú del administrador y del técnico) y luego `src/modulos/historico/menu.ts`; verificar con `npx vitest run --project unit src/modulos/historico/__tests__/menu.test.ts` (CA-1; Derivado: decisión #9)
- [x] 6.5 Crear `src/app/(tablero)/historico/page.tsx` (Server Component dinámico: valida `searchParams`, muestra `EstadoError` «Filtros inválidos» sin tabla si no son válidos, y si lo son pinta `FiltrosHistorico` y `TablaHistorico` con `consultarHistorico`) y `src/app/(tablero)/historico/loading.tsx` con `Cargando`; verificar con `npm run typecheck` y, el comportamiento, con Playwright en la tarea 7.1 (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #8)

## 7. Integración y aceptación

- [x] 7.1 Escribir `e2e/historico.spec.ts` (con la semilla `historico.sql`: un usuario entra por el menú «Histórico», filtra por «Nodo histórico demo», «Medidor histórico A» y `2026-01-10`–`2026-01-12`, ve 25 filas con la más reciente primero y, en «Siguiente», 1 fila; un técnico ve los mismos resultados; un rango sin lecturas muestra «No hay lecturas con estos filtros»; `desde` posterior a `hasta` muestra «Filtros inválidos»; `GET /api/historico` sin sesión responde 401; selectores por `data-testid` y etiquetas exactas; solo cuenta filas acotadas por el nodo de la semilla) y verificar con `npx playwright test --list` (CA-1, CA-2, CA-3, CA-4, CA-5; Derivado: decisión #6)
- [x] 7.2 Cada CA tiene al menos una prueba que lo cita (`trazabilidad-grep.mjs --pruebas 26` con `sinPrueba` vacío) (CA-1, CA-2, CA-3, CA-4, CA-5)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #26` y `Change: consultar-historico-de-lecturas`, y esperar el CI en verde (lint, typecheck, unitarias, integración, build, e2e y `openspec validate --all`).
- Las pruebas de integración y `e2e/historico.spec.ts` corren por primera vez en el CI del PR.
- Revisar con el equipo los supuestos del orquestador (decisiones #4, #5 y #6).
- Después del merge, correr `/archivar-change-openspec 26` desde `main`.
