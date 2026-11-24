# Tasks

## 1. Migración y semilla

- [x] 1.1 Crear `db/migration/V202611241000__notificaciones.sql` con la tabla `notificaciones` y su índice `(destinatario_id, creada_en DESC)` según design.md (CA-1; RN-2, RN-5). Se verifica con la prueba de integración de 1.3.
- [x] 1.2 Crear `db/seed/notificaciones.sql`, idempotente, con notificaciones leídas y sin leer para `tecnico` y ninguna para `admin` (CA-1; Derivado: decisión #4). Se verifica con la prueba de integración de 1.3.
- [x] 1.3 Prueba de integración `src/modulos/notificaciones/__tests__/tabla.int.test.ts`: la tabla tiene las columnas esperadas y no tiene columnas de umbral ni de nodo, borrar el sensor de origen no borra la notificación (copia del nombre), borrar al destinatario sí la borra, y aplicar la semilla dos veces deja a `tecnico` con leídas y sin leer, sin duplicados, y a `admin` sin ninguna (CA-1; RN-2, RN-5). Se verifica con `npx vitest list src/modulos/notificaciones`; la corre el CI.

## 2. Repo

- [x] 2.1 Prueba de integración `src/modulos/notificaciones/__tests__/repo.int.test.ts` escrita antes que el repo: `recientesDe` devuelve de la más reciente a la más antigua y máximo 50, `contarNoLeidas` cuenta todas las del destinatario aunque pasen de 50, y ninguna incluye las de otro destinatario (CA-1, CA-2; Derivado: decisión #1). Se verifica con `npx vitest list`; la corre el CI.
- [x] 2.2 Implementar `src/modulos/notificaciones/repo.ts` (`import "server-only"`, SQL a mano con `pg`): `recientesDe`, `contarNoLeidas`, `insertar`, `LIMITE_NOTIFICACIONES` y el tipo `Notificacion` (CA-1, CA-2). Se verifica con `npm run typecheck` y la prueba de 2.1 en el CI.

## 3. Service

- [x] 3.1 Prueba unitaria `src/modulos/notificaciones/__tests__/service.test.ts` con el repo simulado: `consultarNotificaciones` devuelve `{ noLeidas, notificaciones }`, pide ambos datos para el destinatario recibido y conserva el orden del repo (CA-1, CA-2; Derivado: decisión #2). Se verifica con `npx vitest run --project unit src/modulos/notificaciones/__tests__/service.test.ts`.
- [x] 3.2 Implementar `src/modulos/notificaciones/service.ts` con `consultarNotificaciones` y el tipo `CentroNotificaciones`, consultando el repo en paralelo (CA-1, CA-2; Derivado: decisión #2). Se verifica con la prueba de 3.1 en verde.

## 4. Handler y contrato

- [x] 4.1 Prueba de integración `src/modulos/notificaciones/__tests__/acceso.int.test.ts` con `Request` al handler: sin sesión responde 401 en JSON, un administrador 403 en JSON, un técnico 200 con sus notificaciones y su `noLeidas`, y con dos técnicos (el segundo se crea y se elimina en la propia prueba) cada uno ve solo las suyas, también si envía `?destinatarioId=<otro>` (CA-1, CA-2, CA-3; Derivado: decisión #3). Se verifica con `npx vitest list`; la corre el CI.
- [x] 4.2 Implementar `src/app/api/notificaciones/route.ts` con `conHttp`, `sessionFromRequest` y `requireRole(sesion, "tecnico")`, pasando `sesion.sub` al servicio y sin leer parámetros del cliente (CA-1, CA-2, CA-3; RN-3, RN-4). Se verifica con `npm run typecheck` y la prueba de 4.1 en el CI.
- [x] 4.3 Agregar `/api/notificaciones` (GET, 200, 401, 403) y los esquemas `Notificacion` y `CentroNotificaciones` a `contracts/openapi.yaml`, conservando las demás rutas (CA-1, CA-3). Se verifica con `npm run typecheck`, que la ruta aparece en `grep -n "/api/notificaciones" contracts/openapi.yaml` y con que `/api/notificaciones`, `Notificacion` y `CentroNotificaciones` aparecen en el contrato.

## 5. Página y ui

- [x] 5.1 Prueba unitaria `src/modulos/notificaciones/__tests__/lista-notificaciones.test.ts` (renderiza con `react-dom/server` desde un `.ts`): muestra «N sin leer», una `notificacion` por elemento en el orden recibido, con sensor, magnitud, valor con unidad `.cifra`, fecha es-CO y la insignia «Sin leer» o «Leída» con texto, y con la lista vacía muestra «No tienes notificaciones» (CA-1; RN-1, RN-6). Se verifica con `npx vitest run --project unit src/modulos/notificaciones/__tests__/lista-notificaciones.test.ts`.
- [x] 5.2 Implementar `src/modulos/notificaciones/ui/ListaNotificaciones.tsx` reutilizando `Tarjeta`, `Insignia`, `EstadoVacio`, `cifraConUnidad` y `formatearFecha`, con los `data-testid` y textos de design.md y sin colores fuera de los tokens `--sc-*` (CA-1). Se verifica con la prueba de 5.1 en verde, y el estado se lee con texto y forma (insignia con etiqueta), no solo con color.
- [x] 5.3 Crear `src/app/(tablero)/notificaciones/page.tsx` (Server Component, `force-dynamic`: lee `sesionActual()`, redirige a `/` si el rol no es técnico y llama a `consultarNotificaciones(sesion.sub)`) y `loading.tsx` con `Cargando`; el error lo cubre `(tablero)/error.tsx` (CA-1, CA-3; RN-4, RN-6). Se verifica con `npm run typecheck` y con la prueba e2e de 7.2 en el CI (las páginas con datos solo se prueban con Playwright).

## 6. `menu.ts`

- [x] 6.1 Prueba unitaria `src/modulos/notificaciones/__tests__/menu.test.ts`: el menú del técnico incluye «Notificaciones» con `/notificaciones` y el del administrador no (CA-1; RN-4; Derivado: decisión #3). Se verifica con `npx vitest run --project unit src/modulos/notificaciones/__tests__/menu.test.ts`.
- [x] 6.2 Crear `src/modulos/notificaciones/menu.ts` exportando `menu` con `roles: ["tecnico"]` y orden 30, sin editar `src/shell/iconos-menu.ts` (CA-1; RN-4). Se verifica con la prueba de 6.1 en verde.

## 7. Integración y aceptación de la historia

- [x] 7.1 Verificar que cada CA tiene al menos una prueba nombrada `#24 CA-n: ...` con `trazabilidad-grep.mjs ... --pruebas 24` y que `sinPrueba` queda vacío (CA-1, CA-2, CA-3). Se verifica con la salida de ese script.
- [x] 7.2 Escribir `e2e/notificaciones.spec.ts` con el recorrido de CA-1 del issue: iniciar sesión como `tecnico`, abrir «Notificaciones» y comprobar el contador y el orden esperados de la semilla, con selectores `data-testid`, y que un administrador no ve la entrada del menú (CA-1, CA-3; Derivado: decisión #3). Se verifica con `npx playwright test --list`.

## Workflow follow-up

- Abrir el PR en borrador con `abrir-pr` y esperar el CI (`test:integration`, `e2e`, `lint` y `build`).
- Correr `/archivar-change-openspec 24` desde `main` después de mezclar el PR.
