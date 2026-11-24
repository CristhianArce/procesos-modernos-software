# Tasks

Las pruebas unitarias se verifican con `npx vitest run --project unit <archivo>` y las de integración con `node .claude/skills/build-test/scripts/build-test.mjs 26 --solo test:integration`, que levanta y migra la BD de la corrida. Sin migración: la historia solo lee.

## 1. Migración y semilla

- [x] 1.1 Escribir `src/modulos/historico/__tests__/semilla.int.test.ts` (aplicar `db/seed/historico.sql` deja 26 lecturas del nodo `…0301` entre el 2026-03-01 y el 2026-03-31, dos lecturas fuera de ese rango, tres del nodo `…0302`, y aplicarla dos veces no duplica nada) y luego `db/seed/historico.sql` (idempotente; nodos, sensores y lecturas con identificadores fijos y fechas de marzo de 2026); verificar con la prueba de integración (CA-1, CA-2; Derivado: decisión #9)

## 2. Schema

- [x] 2.1 Escribir `src/modulos/historico/__tests__/schema.test.ts` (aceptan sin parámetros con `pagina` 1; `nodoId` y `sensorId` UUID; `desde` y `hasta` ISO en UTC, también iguales; `pagina` de texto entero mayor o igual que 1; rechazan una fecha mal formada como `ayer` o `2026-03-01`, un UUID inválido, `pagina` 0 o decimal, y `desde` posterior a `hasta` con el error en `hasta`; `filtrosHistoricoSchema` aplica la misma regla de rango) y luego `src/modulos/historico/schema.ts` (`POR_PAGINA`, `filtrosBase`, `filtrosHistoricoSchema`, `consultaHistoricoSchema`); verificar con la prueba unitaria (CA-2, CA-4; Derivado: decisión #1, #2, #5)
- [x] 2.2 Escribir `src/modulos/historico/__tests__/url.test.ts` (`filtrosDeBusqueda` toma el primer valor de un arreglo y descarta los vacíos y los `undefined`; `enlacePagina` conserva los filtros, agrega `pagina` y codifica los valores) y luego `src/modulos/historico/url.ts`; verificar con la prueba unitaria (CA-2; Derivado: decisión #7)

## 3. Repo

- [x] 3.1 Escribir `src/modulos/historico/__tests__/repo.int.test.ts` (con nodos, sensores y lecturas propios de la prueba: `listar` ordena por fecha descendente y desempata por `id` descendente, devuelve como mucho 25 filas y la segunda página trae el resto sin repetir; filtra por nodo, por sensor y por rango con ambos extremos inclusivos y combina las condiciones con AND; un sensor de otro nodo da lista vacía; cada fila trae `sensorNombre`, `nodoId` y `nodoNombre`; `contar` coincide con los mismos filtros; las lecturas y las demás tablas quedan intactas) y luego `src/modulos/historico/repo.ts` con `import "server-only"` (`listar` y `contar`); verificar con la prueba de integración (CA-1, CA-2, CA-3; Derivado: decisión #1, #3, #4, #6)

## 4. Service

- [x] 4.1 Escribir `src/modulos/historico/__tests__/service.test.ts` (sin BD, con el repo simulado: `consultarHistorico` devuelve `{ items, pagina, porPagina: 25, total }` con lo que da el repo; una página más allá del final devuelve `items` vacío con el total real) y luego `src/modulos/historico/service.ts`; verificar con la prueba unitaria (CA-1, CA-3; Derivado: decisión #4, #5)

## 5. Handler y contrato

- [x] 5.1 Escribir `src/app/api/__tests__/historico.int.test.ts` (con `Request` y cookie firmada: 401 en JSON sin sesión; 400 con detalle para `desde=ayer`, para `desde` posterior a `hasta`, para `nodoId` que no es UUID y para `pagina=0`; 200 con `desde` igual a `hasta`; el técnico recibe 200 con 25 lecturas en la página 1 y una en la página 2 sobre 26 lecturas propias, la más reciente primero, y `total` 26; un rango sin lecturas da `items` vacío y `total` 0; los filtros de nodo, sensor y fechas dejan solo lo que cumple todo) y luego `src/app/api/historico/route.ts` con `conHttp`; verificar con la prueba de integración (CA-1, CA-2, CA-3, CA-4, CA-5; Derivado: decisión #5, #8)
- [x] 5.2 Agregar a `contracts/openapi.yaml` la ruta `/api/historico` (parámetros `nodoId`, `sensorId`, `desde`, `hasta`, `pagina`; respuestas 200, 400 y 401) y los esquemas `LecturaHistorico` y `PaginaHistorico`, conservando las rutas existentes; verificar con `npx vitest run --project unit src/__tests__/contrato.test.ts` (CA-1, CA-4, CA-5; Derivado: decisión #4)

## 6. Página y UI

- [x] 6.1 Escribir `src/modulos/historico/__tests__/filtros-historico.test.ts` (renderiza `FiltrosHistorico` a HTML con `react-dom/server`: los campos "Nodo", "Sensor", "Desde (UTC)" y "Hasta (UTC)" con su etiqueta, el formulario con método `get` y acción `/historico`, el botón "Aplicar filtros" y el enlace "Limpiar filtros"; las opciones usan el identificador como valor y el sensor se muestra con su nodo; los valores aplicados salen seleccionados o escritos) y luego `src/modulos/historico/ui/FiltrosHistorico.tsx`; verificar con la prueba unitaria (CA-2; Derivado: decisión #7)
- [x] 6.2 Escribir `src/modulos/historico/__tests__/tabla-historico.test.ts` (renderiza `TablaHistorico` a HTML: las filas salen en el orden recibido con `data-testid="fila-lectura"`, nodo, sensor y las tres magnitudes con su unidad y la clase `.cifra`; sin filas muestra "Sin lecturas" y no hay tabla) y luego `src/modulos/historico/ui/TablaHistorico.tsx`; verificar con la prueba unitaria (CA-1, CA-3)
- [x] 6.3 Escribir `src/modulos/historico/__tests__/paginador-historico.test.ts` (renderiza `PaginadorHistorico` a HTML: "Página 1 de 2" y "26 lecturas"; en la primera página "Anterior" no es un enlace y "Siguiente" lleva a `pagina=2` conservando los filtros; en la última página ocurre al revés; con 0 lecturas muestra "Página 1 de 1") y luego `src/modulos/historico/ui/PaginadorHistorico.tsx` con `<nav aria-label="Paginación del histórico">`; verificar con la prueba unitaria (CA-1)
- [x] 6.4 Escribir `src/app/(tablero)/historico/page.tsx` (Server Component dinámico que lee `searchParams`, valida con `consultaHistoricoSchema.safeParse` y llama a los servicios de histórico, nodos y sensores (arma el `nodoNombre` de cada sensor cruzando su `nodoId` con la lista de nodos); un filtro inválido muestra `EstadoError` con el detalle y no consulta; con 0 resultados muestra el estado vacío) y `src/app/(tablero)/historico/loading.tsx` con `Cargando`; se verifica con `npm run typecheck` y, en la tarea 8.1, con Playwright; la navegación con teclado y el foco visible salen de las clases `.campo`, `.boton-primario` y `.enlace` (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #7)

## 7. menu.ts

- [x] 7.1 Escribir `src/modulos/historico/__tests__/menu.test.ts` (el registro real incluye "Histórico" con `/historico` para ambos roles) y luego `src/modulos/historico/menu.ts`; verificar con la prueba unitaria (CA-1; Derivado: decisión #10)

## 8. Integración y aceptación

- [x] 8.1 Escribir `e2e/historico.spec.ts` con la semilla fija de la tarea 1.1 y un `test("#26 CA-k: ...")` por criterio: CA-1 (25 filas en la página 1, una en la 2 y la más reciente primero, con el filtro de nodo y de fechas de marzo de 2026), CA-2 (añadir el sensor reduce la lista a sus lecturas), CA-3 (un rango sin lecturas muestra "Sin lecturas"), CA-4 (`desde=ayer` en la API responde 400 y la página muestra el error) y CA-5 (la API sin sesión responde 401 en JSON); no crea ni cambia datos, acota todo con el nodo de la semilla y un rango de marzo de 2026, y usa selectores por rol con nombre, `data-testid` o contenedor; verificar con `npx playwright test --list` (CA-1, CA-2, CA-3, CA-4, CA-5; Derivado: decisión #9)
- [x] 8.2 Confirmar que cada CA tiene al menos una prueba (`trazabilidad.md` sin "Sin prueba") y que `openspec validate historico-de-lecturas --strict --type change --no-interactive` pasa (CA-1, CA-2, CA-3, CA-4, CA-5)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #26` y `Change: historico-de-lecturas`.
- Esperar el CI del PR: `lint`, `typecheck`, `test:unit`, `test:integration`, `build` y `e2e` en verde (el orquestador no corre `test:integration` ni `e2e`).
- Archivar con `openspec archive historico-de-lecturas --yes` en un PR propio, después del merge.
