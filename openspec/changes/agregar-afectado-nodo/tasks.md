# Tasks

## 1. Repo

- [x] 1.1 Prueba de integración de `repo.crear` en `src/modulos/afectados/__tests__/repo.int.test.ts`: inserta, devuelve `{ id, alias }`, el afectado solo aparece en su nodo y un alias repetido se guarda dos veces (CA-1; RN-1, RN-4). Se verifica con `npx vitest list src/modulos/afectados`; la corre el CI.
- [x] 1.2 `crear(nodoId, alias)` en `src/modulos/afectados/repo.ts` con SQL a mano y `RETURNING id, alias` (CA-1; Derivado: decisión #2). Se verifica con `npm run typecheck`.

## 2. Schema

- [x] 2.1 Pruebas unitarias en `src/modulos/afectados/__tests__/schema.test.ts`: alias vacío, solo espacios y de 81 caracteres rechazados; de 1 y de 80 aceptados; recorte de espacios; `nodoId` que no es UUID rechazado (CA-2; Derivado: decisión #1). Se verifica con `npx vitest run --project unit src/modulos/afectados/__tests__/schema.test.ts`.
- [x] 2.2 `afectadoCrearSchema` y `AfectadoCrear` en `src/modulos/afectados/schema.ts` (CA-2; Derivado: decisión #1). Se verifica con las pruebas de 2.1 en verde.

## 3. Service

- [x] 3.1 Pruebas unitarias en `src/modulos/afectados/__tests__/service.test.ts` con repo y `obtenerNodo` simulados: crea y devuelve el afectado (CA-1); con un nodo inexistente lanza 404 y no llama a `repo.crear` (CA-3). Se verifica con `npx vitest run --project unit src/modulos/afectados/__tests__/service.test.ts`.
- [x] 3.2 `crearAfectado(entrada)` en `src/modulos/afectados/service.ts`: `obtenerNodo` y luego `repo.crear` (CA-1, CA-3). Se verifica con las pruebas de 3.1 en verde.

## 4. Handler y contrato

- [x] 4.1 Pruebas de integración del handler `POST` (llamado con `Request`) en `src/modulos/afectados/__tests__/api.int.test.ts`: 201 con datos válidos y el `GET` refleja el total (CA-1); 400 con alias vacío, largo, `nodoId` mal formado y cuerpo no JSON, sin guardar (CA-2); 404 con un UUID sin nodo (CA-3); 403 con técnico (cuerpo válido e inválido) y 401 sin sesión, sin guardar (CA-4). Se verifica con `npx vitest list src/modulos/afectados`; la corre el CI.
- [x] 4.2 `POST` en `src/app/api/afectados/route.ts` dentro de `conHttp`: `requireRole` administrador, `afectadoCrearSchema.parse`, `crearAfectado`, 201 (CA-1 a CA-4; Derivado: decisión #3). Se verifica con `npm run typecheck`.
- [x] 4.3 Agregar `POST /api/afectados` y el esquema `AfectadoCrear` a `contracts/openapi.yaml`, conservando el `GET` y las demás rutas (CA-1 a CA-4; Derivado: decisión #3). Se verifica con `openspec validate agregar-afectado-nodo --strict --type change --no-interactive` y revisando que el `GET` siga en el archivo.

## 5. Página y UI

- [x] 5.1 Pruebas de render con `react-dom/server` en `src/modulos/afectados/__tests__/formulario-afectado.test.ts`: `FormularioAfectado` trae el campo «Alias» con `maxLength` 80, el botón «Agregar afectado» y `data-testid="formulario-afectado"` (CA-1). Se verifica con `npx vitest run --project unit src/modulos/afectados/__tests__/formulario-afectado.test.ts` y con `npx vitest list` (el archivo debe aparecer).
- [x] 5.2 `FormularioAfectado` en `src/modulos/afectados/ui/FormularioAfectado.tsx` (`"use client"`, `enviarJson`, `router.refresh()`, error con `role="alert"`, botón deshabilitado mientras envía, tokens `--sc-*` y clases `.campo`, `.boton-primario`, `.etiqueta-campo`, sin importar Zod) (CA-1; Derivado: decisión #2). Se verifica con las pruebas de 5.1, operando el formulario con teclado y el foco visible.
- [x] 5.3 Mostrar el formulario en `AfectadosDelNodo` de `src/modulos/afectados/ui/PanelAfectados.tsx` solo si `sesionActual()` es administrador; se conservan `Cargando`, `EstadoError` y `EstadoVacio` (CA-1, CA-4). Se verifica con `npm run typecheck` y con la prueba e2e de 6.1 (el panel es asíncrono: Vitest no lo renderiza).

## 6. Integración y aceptación

- [x] 6.1 Prueba e2e `e2e/afectados-agregar.spec.ts` con Playwright: el administrador crea su propio nodo, agrega `Usuario demo <Date.now()>` desde el panel, ve la lista de una entrada, total 1 y la persistencia tras recargar (CA-1); en sesión separada el técnico ve la lista sin el botón de agregar y un `POST` directo devuelve 403 sin cambiar el total (CA-4); el nodo se elimina en `afterEach`. Se verifica con `npx playwright test --list`.
- [x] 6.2 Cada CA (CA-1 a CA-4) tiene al menos una prueba con el nombre `#54 CA-n: …`. Se verifica con `trazabilidad-grep.mjs … --pruebas 54` sin CA en `sinPrueba`.

## Workflow follow-up

- Abrir el PR en borrador y esperar el CI (`test:integration`, `e2e`, `lint` y `build` corren allí).
- Verificar en el CI la ejecución de las pruebas de integración y e2e de este change.
- Después del merge, correr `/archivar-change-openspec 54` desde `main`.
