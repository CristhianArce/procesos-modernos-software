# Tasks

## 1. Migración y semilla

- [x] 1.1 Escribir `db/migration/V202611242330__nodo_tecnicos.sql` con la tabla `nodo_tecnicos (nodo_id uuid PRIMARY KEY REFERENCES nodos ON DELETE CASCADE, tecnico_id uuid NOT NULL REFERENCES usuarios ON DELETE CASCADE, asignado_en timestamptz NOT NULL DEFAULT now())`; verificar con las pruebas de integración del repo (tarea 2.1) en el CI, que migra la base (CA-1; Derivado: decisión #2)
- [x] 1.2 Escribir `src/modulos/mantenimiento/__tests__/semilla.test.ts` (sin BD: el archivo `db/seed/nodos_tecnicos.sql` se ordena después de `auth.sql` y `nodos.sql`, asigna `tecnico` al nodo `00000000-0000-4000-8000-000000000001` y usa `ON CONFLICT (nodo_id) DO NOTHING`) y luego `db/seed/nodos_tecnicos.sql`; verificar con `npx vitest run --project unit src/modulos/mantenimiento/__tests__/semilla.test.ts` (CA-1; Derivado: decisión #4)

## 2. Repo

- [x] 2.1 Escribir `src/modulos/mantenimiento/__tests__/repo.int.test.ts` (con nodos y usuarios propios de la prueba: `asignar` y luego `tecnicoDeNodo` devuelve `{ id, nombreUsuario }`; asignar otro técnico lo reemplaza y el nodo tiene una sola fila; `tecnicoDeNodo` devuelve `null` sin asignación; `buscarUsuario` devuelve `{ id, nombreUsuario, rol }` o `null`; `listarTecnicos` solo trae usuarios con rol técnico, por nombre; borrar el nodo borra su asignación) y luego `src/modulos/mantenimiento/repo.ts` con `import "server-only"`; verificar con `npm run test:integration -- mantenimiento/__tests__/repo` en el CI (CA-1, CA-2; Derivado: decisión #2)

## 3. Schema

- [x] 3.1 Escribir `src/modulos/mantenimiento/__tests__/schema.test.ts` (acepta un `tecnicoId` UUID; rechaza sin `tecnicoId`, un texto que no es UUID, un número y `null`) y luego `src/modulos/mantenimiento/schema.ts` con Zod; verificar con `npx vitest run --project unit src/modulos/mantenimiento/__tests__/schema.test.ts` (CA-2; Derivado: decisión #3)

## 4. Service

- [x] 4.1 Escribir `src/modulos/mantenimiento/__tests__/service.test.ts` (sin BD, con el repo y `@/modulos/nodos/service` simulados: `asignarTecnico` llama a `repo.asignar` y devuelve `{ nodoId, tecnico: { id, nombreUsuario } }`; con un usuario administrador lanza 400 `El usuario no es técnico`, con un usuario inexistente 404 `Usuario no encontrado` y con un nodo inexistente 404 `Nodo no encontrado`, y en los tres no llama a `repo.asignar`; `tecnicoAsignado` y `tecnicosDisponibles` devuelven lo del repo) y luego `src/modulos/mantenimiento/service.ts`; verificar con `npx vitest run --project unit src/modulos/mantenimiento/__tests__/service.test.ts` (CA-1, CA-2, CA-3; Derivado: decisión #3)

## 5. Handler y contrato

- [x] 5.1 Escribir `src/app/api/__tests__/mantenimiento.int.test.ts` (con `Request`, nodos y usuarios propios: el administrador asigna un técnico con 200 y el cuerpo `{ nodoId, tecnico }`; reasignar reemplaza al anterior; un usuario administrador responde 400 `El usuario no es técnico` y un UUID inexistente 404 `Usuario no encontrado`, sin cambiar la asignación previa; sin `tecnicoId`, un `tecnicoId` mal formado y un cuerpo que no es JSON responden 400 con `detalles`; un nodo inexistente y uno mal formado responden 404 `Nodo no encontrado`; el técnico recibe 403 con cuerpo válido e inválido y la asignación no cambia; sin sesión 401) y luego `src/app/api/mantenimiento/nodos/[id]/tecnico/route.ts` con `PUT` envuelto en `conHttp` (`requireRole("administrador")`, Zod y servicio); verificar con `npm run test:integration -- mantenimiento` en el CI (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #1, #3)
- [x] 5.2 Agregar `PUT /api/mantenimiento/nodos/{id}/tecnico` a `contracts/openapi.yaml` conservando las rutas existentes (esquemas `TecnicoAsignar` y `TecnicoDeNodo`; respuestas 200, 400, 401, 403 y 404); verificar con `npx vitest run --project unit src/__tests__/contrato.test.ts`, que exige cada ruta de `src/app/api` en el contrato (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #1)

## 6. Página y UI

- [x] 6.1 Escribir `src/modulos/mantenimiento/__tests__/tecnico-asignado.test.ts` (con `createElement` y `react-dom/server`: con técnico muestra «Responsable» y el nombre en `data-testid="tecnico-asignado"`; sin técnico muestra el `EstadoVacio` «Sin técnico asignado» y no el `data-testid`) y luego `src/modulos/mantenimiento/ui/TecnicoAsignado.tsx` (síncrono, sin `"use client"`, solo tokens `--sc-*`); verificar con `npx vitest run --project unit src/modulos/mantenimiento/__tests__/tecnico-asignado.test.ts` (CA-1; Derivado: decisión #5)
- [x] 6.2 Escribir `src/modulos/mantenimiento/__tests__/asignar-tecnico.test.ts` (con `react-dom/server` y `next/navigation` simulado: muestra el `<select>` con `<label>` «Técnico», la opción «Elige un técnico» y una opción por técnico con su id; preselecciona `asignadoId`; muestra el botón «Asignar»; sin técnicos muestra «No hay técnicos registrados.» y no el selector; en reposo no hay `role="alert"`) y luego `src/modulos/mantenimiento/ui/AsignarTecnico.tsx` (Client Component con `fetch` `PUT`, `router.refresh()` en una transición, botón desactivado sin selección o mientras envía, error en `role="alert"`, `.campo`, `.etiqueta-campo` y `.boton-primario`, operable con teclado); verificar con `npx vitest run --project unit src/modulos/mantenimiento/__tests__/asignar-tecnico.test.ts` y el clic con Playwright en la tarea 7.1 (CA-1; Derivado: decisión #5)
- [x] 6.3 Escribir `src/modulos/mantenimiento/__tests__/extensiones.test.ts` (el registro incluye el panel «Técnico asignado» con orden 50, después de «Afectados», y la página de la ficha no nombra al módulo `mantenimiento`) y luego `src/modulos/mantenimiento/paneles.ts` y `src/modulos/mantenimiento/ui/PanelTecnico.tsx` (Server Component: `Suspense` con `Cargando` «Cargando técnico asignado…», `EstadoError` «No se pudo cargar el técnico asignado» si la lectura falla, `TecnicoAsignado` para ambos roles y `AsignarTecnico` solo para el administrador); verificar con `npx vitest run --project unit src/modulos/mantenimiento/__tests__/extensiones.test.ts` y el panel por rol con Playwright en la tarea 7.1 (CA-1, CA-4; Derivado: decisión #5)

## 7. Integración y aceptación

- [x] 7.1 Escribir `e2e/mantenimiento.spec.ts` (el administrador crea un nodo por la API con `Date.now()` en el nombre, abre su ficha, ve «Sin técnico asignado», elige `tecnico` en «Técnico», pulsa «Asignar» y el panel muestra `tecnico` en `data-testid="tecnico-asignado"` sin recargar; recarga y sigue asignado; un técnico abre la ficha, ve el técnico asignado y no ve el selector ni el botón «Asignar», y su `PUT` a la API responde 403; un `PUT` del administrador a un nodo inexistente responde 404; `afterEach` borra el nodo aunque la prueba falle); verificar con `npx playwright test --list` (CA-1, CA-3, CA-4; Derivado: decisión #5)
- [x] 7.2 Comprobar que cada CA (CA-1 a CA-4) tiene al menos una prueba que lo cita como `#27 CA-k`; verificar con `trazabilidad-grep.mjs --pruebas 27` y su lista `sinPrueba` vacía (CA-1, CA-2, CA-3, CA-4)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #27` y `Change: asignar-tecnico-a-nodo`, y esperar que el CI esté en verde (lint, pruebas de integración, e2e, build y `openspec validate --all`).
- Correr `e2e/mantenimiento.spec.ts` contra la app levantada con la semilla cargada: `BASE_URL=http://localhost:<puerto> npm run e2e` (lo verifica el CI).
- Revisar con el equipo los supuestos del orquestador (decisiones #3, #4 y #5).
- Archivar con `/archivar-change-openspec 27` desde `main` en un PR propio, después del merge.
