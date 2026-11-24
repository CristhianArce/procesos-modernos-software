# Tasks

## 1. Migración y semilla

- [x] 1.1 Crear `db/migration/V202611242000__notificaciones.sql` con la tabla `notificaciones` y su índice (CA-1, CA-2; Derivado: decisión #4). Se verifica con la prueba de integración `src/modulos/notificaciones/__tests__/tabla.int.test.ts` («#24 CA-1: la tabla guarda sensor, magnitud, valor, fecha y leída, sin umbral ni nodo» y «#24 CA-1: la notificación sobrevive a la eliminación del sensor»).
- [x] 1.2 Crear `db/seed/notificaciones.sql` con 4 notificaciones del usuario `tecnico` (2 leídas y 2 no leídas, fechas distintas, ids fijos, idempotente) (CA-1; Derivado: decisión #4). Se verifica con `src/modulos/notificaciones/__tests__/semilla.int.test.ts` («#24 CA-1: la semilla deja 4 notificaciones del técnico, 2 sin leer» y «#24 CA-1: aplicar la semilla dos veces no duplica»).

## 2. Repo

- [x] 2.1 Crear `src/modulos/notificaciones/tipos.ts` con `Notificacion`, `CentroNotificaciones` y `LIMITE_NOTIFICACIONES` (CA-1). Se verifica con `npm run typecheck`.
- [x] 2.2 Crear `src/modulos/notificaciones/repo.ts` con `listarDeUsuario(usuarioId, limite)` (orden por fecha de la alerta y luego id, ambos descendentes) y `contarNoLeidas(usuarioId)` (CA-1, CA-2; Derivado: decisión #1, #2). Se verifica con `src/modulos/notificaciones/__tests__/repo.int.test.ts` («#24 CA-1: la más reciente primero y, en empate de fecha, el id mayor», «#24 CA-1: respeta el límite y cuenta las no leídas sobre el total», «#24 CA-2: solo devuelve y cuenta las del usuario»).

## 3. Service

- [x] 3.1 Crear `src/modulos/notificaciones/service.ts` con `consultarNotificaciones(usuarioId)`, que une la lista (límite de 50) y el conteo de no leídas y convierte las filas a `Notificacion` (CA-1; Derivado: decisión #1). Se verifica con `src/modulos/notificaciones/__tests__/service.test.ts`, sin BD («#24 CA-1: pide al repo 50 y devuelve la lista con el número de no leídas» y «#24 CA-1: sin notificaciones devuelve lista vacía y 0»).

## 4. Schema

- [x] 4.1 Sin tarea de schema: el handler no recibe parámetros del cliente (RN-3), así que no hay entrada que validar con Zod (CA-2). Se verifica en 5.2 con la prueba que envía un identificador ajeno en la URL.

## 5. Handler y contrato

- [x] 5.1 Agregar `GET /api/notificaciones` y el esquema `CentroNotificaciones` a `contracts/openapi.yaml`, conservando las rutas existentes (CA-1, CA-3). Se verifica con `openspec validate consultar-notificaciones --strict --type change --no-interactive` y revisando que las rutas previas siguen en el archivo.
- [x] 5.2 Crear `src/app/api/notificaciones/route.ts` con `conHttp`, `sessionFromRequest` y `requireRole(sesion, "tecnico")`, y `usuarioId = sesion.sub` (CA-1, CA-2, CA-3; Derivado: decisión #3). Se verifica con `src/modulos/notificaciones/__tests__/notificaciones.int.test.ts` con `Request` («#24 CA-1: un técnico recibe 200 con sus notificaciones, la más reciente primero, y el número de no leídas», «#24 CA-2: un técnico no ve las del otro», «#24 CA-2: ignora un identificador de usuario enviado en la URL», «#24 CA-3: sin sesión responde 401 en JSON», «#24 CA-3: un administrador recibe 403 en JSON»).

## 6. Página y ui

- [x] 6.1 Crear `src/modulos/notificaciones/ui/ListaNotificaciones.tsx`, síncrono, con `Tarjeta`, `Insignia` ("Leída" y "Sin leer", con texto y forma además de color), `EstadoVacio` y `cifraConUnidad` con la clase `.cifra`, solo con tokens `--sc-*` (CA-1). Se verifica con `src/modulos/notificaciones/__tests__/lista.test.ts` con `react-dom/server` («#24 CA-1: lista las notificaciones en el orden recibido con el número de no leídas», «#24 CA-1: sin notificaciones muestra el estado vacío y 0», «#24 CA-1: cada notificación muestra sensor, magnitud, valor con unidad, fecha y si está leída») y revisando a mano que la lista no depende del color para el estado.
- [x] 6.2 Crear `src/app/(tablero)/notificaciones/page.tsx` (dinámica, llama a `sesionActual()` y al servicio, sin `fetch` a la API; para un administrador muestra `EstadoError` y no consulta) y `loading.tsx` con `Cargando` (CA-1; Derivado: decisión #3). El error de carga lo cubre `src/app/(tablero)/error.tsx`. Se verifica con `npm run typecheck`; la página es un Server Component asíncrono y se prueba con Playwright en 7.2.

## 7. menu.ts y e2e

- [x] 7.1 Crear `src/modulos/notificaciones/menu.ts` con el ítem "Notificaciones", href `/notificaciones`, rol `tecnico` e icono genérico (CA-1; RN-4; Derivado: decisión #3). Se verifica con `src/modulos/notificaciones/__tests__/menu.test.ts` («#24 CA-1: la entrada Notificaciones es solo para el técnico»).
- [x] 7.2 Escribir `e2e/notificaciones.spec.ts`: inicia sesión como `tecnico`, abre `/notificaciones` y comprueba el orden y el número de no leídas de la semilla con `data-testid` (`notificacion`, `no-leidas`), sin afirmar totales de datos ajenos (CA-1). Se verifica con `npx playwright test --list`.

## 8. Integración y aceptación

- [x] 8.1 Comprobar que cada CA tiene al menos una prueba cuyo nombre cita `#24 CA-k` (CA-1, CA-2, CA-3). Se verifica con `trazabilidad-grep.mjs ... --pruebas 24` sin criterios «Sin prueba».
- [x] 8.2 Correr `npm run typecheck` y `npm run test:unit` en verde (CA-1, CA-2, CA-3). Se verifica con `node .claude/skills/build-test/scripts/build-test.mjs 24`.

## Workflow follow-up

- Abrir el PR en borrador con `Closes #24` y `Change: consultar-notificaciones`.
- Esperar al CI del PR: `test:integration`, `e2e`, `lint` y `build` (primera ejecución real de las pruebas de integración y e2e).
- Archivar con `openspec archive consultar-notificaciones --yes` como último commit del mismo PR, cuando el CI esté en verde y la revisión haya terminado.
