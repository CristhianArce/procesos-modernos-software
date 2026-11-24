# Tasks

## 1. Repo

- [x] 1.1 Escribir `src/modulos/historico/__tests__/exportar.int.test.ts` (con nodos, sensores y lecturas propios de la prueba: `listarParaExportar` devuelve las lecturas que cumplen nodo, sensor y rango de días con el mismo significado que la HU 9, de la más reciente a la más antigua, con nombres de nodo y sensor; un filtro sin coincidencias devuelve `[]`; con `tope` menor que las coincidencias devuelve solo las `tope` más recientes) y luego `listarParaExportar` en `src/modulos/historico/repo.ts`; verificar con `npm run test:integration -- historico/__tests__/exportar` (CA-1, CA-2; Derivado: decisión #7)

## 2. Serializador CSV

- [x] 2.1 Escribir `src/modulos/historico/__tests__/csv.test.ts` (sin usar el serializador como oráculo: con lecturas escritas a mano, la primera línea es `nodo,sensor,voltaje,corriente,potencia,fecha`; cada fila trae nombre del nodo, nombre del sensor, voltaje, corriente, potencia y fecha ISO 8601 UTC en ese orden; líneas con `\r\n`; sin lecturas el archivo es solo el encabezado; un valor que empieza por `=`, `+`, `-` o `@` sale con `'` delante; un nombre con coma o comillas va entre comillas dobles con las comillas duplicadas y la fila sigue teniendo seis columnas) y luego `src/modulos/historico/csv.ts` con `ENCABEZADO_CSV`, `celdaCsv` y `aCsv`; verificar con `npx vitest run --project unit src/modulos/historico/__tests__/csv.test.ts` (CA-1, CA-2; Derivado: decisión #1, #2, #4, #5)

## 3. Service

- [x] 3.1 Escribir `src/modulos/historico/__tests__/exportar-service.test.ts` (sin BD, con el repo simulado: `exportarHistorico` llama a `listarParaExportar` con los filtros y el tope 10 000 y devuelve el CSV de esas lecturas; sin lecturas devuelve solo el encabezado; `enlaceExportar` arma `/api/historico/exportar` con los filtros presentes, sin `pagina` y sin `?` cuando no hay filtros) y luego `exportarHistorico` en `service.ts` y `src/modulos/historico/exportar.ts`; verificar con `npx vitest run --project unit src/modulos/historico/__tests__/exportar-service.test.ts` (CA-1, CA-2; Derivado: decisión #6, #7)

## 4. Handler y contrato

- [x] 4.1 Escribir `src/app/api/__tests__/historico-exportar.int.test.ts` (con `Request` y datos propios de la prueba: con un filtro, 200 con `text/csv`, `Content-Disposition` de descarga `historico.csv`, `Cache-Control: no-store` y exactamente las filas del filtro; un filtro sin resultados devuelve solo el encabezado; `desde` mal formada y `desde` posterior a `hasta` responden 400 en JSON con `detalles`; sin sesión 401 `{ "error": "No autenticado" }`; el técnico y el administrador reciben 200) y luego `src/app/api/historico/exportar/route.ts` con `GET` envuelto en `conHttp`; verificar con `npm run test:integration -- historico-exportar` (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #3)
- [x] 4.2 Agregar `GET /api/historico/exportar` a `contracts/openapi.yaml` conservando las rutas existentes (parámetros `nodoId`, `sensorId`, `desde` y `hasta`; respuestas 200 `text/csv`, 400 y 401); verificar con `npx vitest run --project unit src/__tests__/contrato.test.ts` (CA-1, CA-3, CA-4; Derivado: decisión #3)

## 5. Página y UI

- [x] 5.1 Escribir `src/modulos/historico/__tests__/exportar-enlace.test.ts` (renderiza `TablaHistorico` a HTML con `react-dom/server`: con resultados y sin resultados muestra el enlace «Exportar CSV» con `data-testid="exportar-csv"`, el atributo `download` y el `href` de `/api/historico/exportar` con los filtros aplicados) y luego el enlace en `src/modulos/historico/ui/TablaHistorico.tsx`; verificar con `npx vitest run --project unit src/modulos/historico/__tests__/exportar-enlace.test.ts` y `src/modulos/historico/__tests__/tabla-historico.test.ts` sin cambios en verde (CA-1; Derivado: decisión #6)

## 6. Integración y aceptación

- [x] 6.1 Escribir `e2e/exportar-historico.spec.ts` (con la semilla `db/seed/historico.sql`: el usuario filtra «Nodo histórico demo» · «Medidor histórico A» del 2026-01-10 al 2026-01-12, pulsa «Exportar CSV», el archivo descargado se llama `historico.csv` y, parseado, trae el encabezado y las 26 filas de ese sensor, la más reciente primero, comparadas con una expectativa fija de la semilla; un filtro sin resultados exportado por la API trae solo el encabezado; sin sesión la API responde 401); verificar con `npx playwright test --list e2e/exportar-historico.spec.ts` (CA-1, CA-2, CA-4)
- [x] 6.2 Cada CA tiene al menos una prueba cuyo nombre cita `#56 CA-k`: `trazabilidad-grep.mjs … --pruebas 56` con `sinPrueba` vacío (CA-1, CA-2, CA-3, CA-4)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #56` y `Change: exportar-historico-de-lecturas-csv`, y esperar el CI en verde (lint, pruebas de integración, e2e, build y `openspec validate --all`).
- Revisar con el equipo los supuestos del orquestador (decisiones #4, #5 y #6).
- Después del merge, correr `/archivar-change-openspec 56` desde `main`.
