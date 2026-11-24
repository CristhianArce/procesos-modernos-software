# Tasks

## 1. Repo

- [x] 1.1 Prueba de integración `src/modulos/notificaciones/__tests__/repo-marcar.int.test.ts`, escrita antes que el repo. (CA-1, CA-2; RN-4) Casos:
  - `marcarLeida(id, destinatario)` devuelve la notificación con `leida: true` y `contarNoLeidas` baja en uno.
  - Una ya leída devuelve la fila sin cambios.
  - Con el destinatario de otro técnico, que la prueba crea y elimina, devuelve `null` y la fila sigue sin leer.
  - Un UUID que no existe devuelve `null`.

  (CA-1, CA-2; RN-4.) Se verifica con `npx vitest list src/modulos/notificaciones`; la corre el CI.
- [x] 1.2 Agregar `marcarLeida` a `src/modulos/notificaciones/repo.ts` con un solo `UPDATE notificaciones SET leida = true WHERE id = $1 AND destinatario_id = $2 RETURNING …`, según design.md (CA-1, CA-2; RN-1, RN-4). Se verifica con `npm run typecheck` y con la prueba de 1.1 en el CI.

## 2. Service

- [x] 2.1 Prueba unitaria `src/modulos/notificaciones/__tests__/marcar-service.test.ts` con el repo simulado. (CA-1, CA-2) Casos:
  - `marcarComoLeida` pasa el id y el destinatario recibidos al repo y devuelve su notificación.
  - Cuando el repo devuelve `null`, lanza `ErrorHttp` con estado 404 y el mensaje `Notificación no encontrada`.

  (CA-1, CA-2.) Se verifica con `npx vitest run --project unit src/modulos/notificaciones/__tests__/marcar-service.test.ts`.
- [x] 2.2 Agregar `marcarComoLeida` y `NOTIFICACION_NO_ENCONTRADA` a `src/modulos/notificaciones/service.ts` (CA-1, CA-2). Se verifica con la prueba de 2.1 en verde.

## 3. Schema

- [x] 3.1 Prueba unitaria `src/modulos/notificaciones/__tests__/schema.test.ts`: `idNotificacionSchema` acepta un UUID con formato `8-4-4-4-12`, aunque no sea v4, y rechaza `no-es-un-uuid`, la cadena vacía y un UUID sin guiones (CA-4). Se verifica con `npx vitest run --project unit src/modulos/notificaciones/__tests__/schema.test.ts`.
- [x] 3.2 Crear `src/modulos/notificaciones/schema.ts` con `idNotificacionSchema = z.object({ id: z.guid() })` (CA-4). Se verifica con la prueba de 3.1 en verde.

## 4. Handler y contrato

- [x] 4.1 Prueba de integración `src/modulos/notificaciones/__tests__/marcar.int.test.ts`, con `Request` al handler `PATCH`. (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #1, #2) Casos:
  - Un técnico marca una suya: 200 con `leida: true`, y `GET /api/notificaciones` la sigue listando con `noLeidas` uno menos.
  - Marcar una ya leída responde 200.
  - Un cuerpo `{ "leida": false }` se ignora.
  - Una de otro técnico, que la prueba crea y elimina en `afterEach`, responde 404 y sigue sin leer.
  - Sin sesión responde 401 en JSON.
  - Un administrador recibe 403 en JSON.
  - Un técnico con `no-es-un-uuid` recibe 400 con `detalles` del campo `id`.

  (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #1, #2.) Se verifica con `npx vitest list src/modulos/notificaciones`; la corre el CI.
- [x] 4.2 Crear `src/app/api/notificaciones/[id]/route.ts` (CA-1, CA-2, CA-3, CA-4; RN-1, RN-2):
  - `PATCH` envuelto en `conHttp("/api/notificaciones/[id]")`, con `requireRole(await sessionFromRequest(req), "tecnico")` antes de `idNotificacionSchema.parse`.
  - Llama a `marcarComoLeida(id, sesion.sub)` y no lee el cuerpo.
  - `dynamic = "force-dynamic"`.

  (CA-1, CA-2, CA-3, CA-4; RN-1, RN-2.) Se verifica con `npm run typecheck` y con la prueba de 4.1 en el CI.
- [x] 4.3 Agregar `/api/notificaciones/{id}` a `contracts/openapi.yaml` (CA-1, CA-2, CA-3, CA-4):
  - `PATCH` con un parámetro `id` propio (`format: uuid`, uno mal formado responde 400); el `Id` compartido no sirve porque describe 404 para el mal formado.
  - Respuestas 200 (`Notificacion`), 400 (`DatosInvalidos`), 401, 403 y 404.
  - Se conservan las demás rutas.

  (CA-1, CA-2, CA-3, CA-4.) Se verifica con `grep -n "/api/notificaciones/{id}" contracts/openapi.yaml`.

## 5. Página y ui

- [x] 5.1 Prueba unitaria `src/modulos/notificaciones/__tests__/boton-marcar-leida.test.ts`, que renderiza con `react-dom/server` desde un `.ts` y simula `next/navigation`. (CA-1; Derivado: decisión #3) Casos:
  - Muestra un `button` con `type="button"`, `data-testid="marcar-leida"` y el texto «Marcar como leída».
  - Sin error, no hay `role="alert"`.

  (CA-1; Derivado: decisión #3.) Se verifica con `npx vitest run --project unit src/modulos/notificaciones/__tests__/boton-marcar-leida.test.ts`.
- [x] 5.2 Crear `src/modulos/notificaciones/ui/BotonMarcarLeida.tsx` (`"use client"`, sin Zod ni código de servidor) (CA-1; RN-3; Derivado: decisión #3):
  - Hace el `fetch` `PATCH` y, con 200, llama a `router.refresh()` en una transición.
  - Mientras envía, el botón queda deshabilitado con «Marcando…».
  - El error va en `<p role="alert" data-testid="error-marcar">` con los textos de design.md.
  - Usa `.boton-fantasma` y `text-critico`, sin colores fuera de `--sc-*`.

  (CA-1; RN-3; Derivado: decisión #3.) Se verifica con la prueba de 5.1 en verde. El botón tiene texto propio, se usa con teclado (es un `button` nativo con foco visible de `.boton-fantasma`) y no tiene animaciones.
- [x] 5.3 Prueba unitaria `src/modulos/notificaciones/__tests__/lista-marcar.test.ts`, con `next/navigation` simulado. (CA-1; RN-4; Derivado: decisión #4, #6) Casos:
  - En `ListaNotificaciones`, cada fila «Sin leer» trae un `marcar-leida` y cada fila «Leída» ninguno.
  - El contador y la insignia con texto se conservan.

  En `lista-notificaciones.test.ts` solo se agrega `vi.mock("next/navigation")` para que sus pruebas `#24` sigan en verde. (CA-1; RN-4; Derivado: decisión #4, #6.) Se verifica con `npx vitest run --project unit src/modulos/notificaciones/__tests__/lista-marcar.test.ts src/modulos/notificaciones/__tests__/lista-notificaciones.test.ts`.
- [x] 5.4 En `src/modulos/notificaciones/ui/ListaNotificaciones.tsx`, renderizar `<BotonMarcarLeida id={n.id} />` en cada fila con `leida: false`, sin cambiar sus textos ni sus `data-testid`. La página `src/app/(tablero)/notificaciones/page.tsx` no se edita (CA-1; Derivado: decisión #4). Se verifica con la prueba de 5.3 en verde y con `git diff --stat` sin cambios en la página. El estado sigue leyéndose con el texto de la insignia («Sin leer» o «Leída»), y la carga, el error y el vacío de la página siguen cubiertos por `loading.tsx`, `(tablero)/error.tsx` y `EstadoVacio`.

## 6. Integración y aceptación de la historia

- [x] 6.1 Escribir `e2e/notificaciones-marcar.spec.ts` con el recorrido de CA-1 (CA-1; RN-3; Derivado: decisión #5):
  - Preparar los datos con `pg` y `DATABASE_URL`: una notificación sin leer de `tecnico` con el sensor `E2E HU13 <Date.now()>`, que se borra en `afterEach` también si la prueba falla.
  - Iniciar sesión como `tecnico`, abrir `/notificaciones` y leer el contador.
  - En la fila acotada por ese sensor, pulsar «Marcar como leída» (rol con nombre `exact: true`).
  - Comprobar que la fila sigue y dice «Leída», sin botón, y que el contador bajó en uno.
  - Recargar y comprobar que el estado y el contador se conservan.

  (CA-1; RN-3; Derivado: decisión #5.) Se verifica con `npx playwright test --list`.
- [x] 6.2 Verificar con `trazabilidad-grep.mjs … --pruebas 53` que cada CA tiene al menos una prueba nombrada `#53 CA-n: …` y que `sinPrueba` queda vacío (CA-1, CA-2, CA-3, CA-4). Se verifica con la salida de ese script.

## Workflow follow-up

- Abrir el PR en borrador con `abrir-pr` y esperar el CI (`test:integration`, `e2e`, `lint` y `build`).
- La prueba e2e de 6.1 se ejecuta por primera vez en el CI del PR, contra la app levantada.
- Correr `/archivar-change-openspec 53` desde `main` después de mezclar el PR.
