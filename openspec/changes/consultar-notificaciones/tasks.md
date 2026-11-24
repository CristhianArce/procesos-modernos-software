# Tasks

Las tareas de prueba las escribe el agente `escritor-pruebas` a partir de las specs y de `## Interfaces` de `design.md`; la sesión escribe el código.

## 1. Migración y semilla

- [x] 1.1 Crear `db/migration/V202611230100__notificaciones.sql` con la tabla e índice del design (CA-1; Derivado: decisión #1; Derivado: decisión #5). Se verifica con la prueba de integración 1.2.
- [x] 1.2 Escribir `src/modulos/notificaciones/__tests__/tabla.int.test.ts` (`#24 CA-1: la tabla guarda sensor_nombre sin clave foránea ni umbral`, `#24 CA-1: la notificación sobrevive al borrado del sensor`). Se verifica con `npx vitest run --project integration` en el CI.
- [x] 1.3 Crear `db/seed/notificaciones.sql` idempotente con las 4 notificaciones de `## Interfaces` (CA-1). Se verifica con 1.4.
- [x] 1.4 Escribir `src/modulos/notificaciones/__tests__/semilla.int.test.ts` (`#24 CA-1: la semilla deja leídas y no leídas para tecnico en orden`, y que aplicarla dos veces no duplica). Se verifica con el CI.

## 2. Repo

- [x] 2.1 Escribir `__tests__/repo.int.test.ts`: `#24 CA-1: lista de la más reciente a la más antigua y cuenta las no leídas`, `#24 CA-2: no devuelve notificaciones de otro usuario`, y que `noLeidas` cuenta todas aunque la lista tenga tope. Se verifica con el CI.
- [x] 2.2 Implementar `src/modulos/notificaciones/repo.ts` (`import "server-only"`, `listarDeUsuario`, orden `alerta_creada_en DESC, id DESC`, tope 100, `noLeidas` en SQL) (CA-1, CA-2). Se verifica con 2.1.

## 3. Service y schema

- [x] 3.1 Escribir `__tests__/service.test.ts` con el repo simulado: `#24 CA-1: devuelve notificaciones y noLeidas`, `#24 CA-2: pasa al repo solo el usuario recibido`. Se verifica con `npx vitest run --project unit`.
- [x] 3.2 Implementar `schema.ts` (tipos de `## Interfaces`; `Magnitud` reutilizada de `@/modulos/alertas/magnitudes`) y `service.ts` (`consultar`) (CA-1, CA-2). Se verifica con 3.1 y `npm run typecheck`.

## 4. Handler y contrato

- [x] 4.1 Escribir `src/app/api/__tests__/notificaciones.int.test.ts`: `#24 CA-3: sin sesión responde 401 en JSON`, `#24 CA-3: un administrador recibe 403 en JSON`, `#24 CA-1: el técnico recibe lista ordenada y noLeidas`, `#24 CA-2: dos técnicos con sesión propia no ven las del otro` (usuarios y notificaciones propios, eliminados en `afterAll`), `#24 CA-2: un identificador de otro usuario en la consulta no cambia el destinatario`. Se verifica con el CI.
- [x] 4.2 Implementar `src/app/api/notificaciones/route.ts` con `conHttp`, `sessionFromRequest`, `requireRole(..., "tecnico")` y el servicio, sin leer parámetros del cliente (CA-1, CA-2, CA-3; RN-3). Se verifica con 4.1.
- [x] 4.3 Agregar `/api/notificaciones` (GET, 200/401/403) y los esquemas `Notificacion` y `RespuestaNotificaciones` a `contracts/openapi.yaml` conservando las demás rutas (CA-1, CA-3). Se verifica con la prueba de 6.1 que lee el YAML y con `src/__tests__/contrato.test.ts`.

## 5. Página y UI

- [x] 5.1 Escribir `src/modulos/notificaciones/__tests__/lista-notificaciones.test.ts` con `react-dom/server`: `#24 CA-1: muestra sensor, magnitud, valor y fecha de cada notificación`, `#24 CA-1: respeta el orden recibido`, `#24 CA-1: la no leída lleva el texto «No leída» además del color`, `#24 CA-1: muestra el número de no leídas`, `#24 CA-1: muestra el estado vacío sin notificaciones`. Se verifica con `test:unit`.
- [x] 5.2 Implementar `ui/ListaNotificaciones.tsx` reutilizando `Tarjeta`, `Insignia`, `EstadoVacio` y `formato.ts`, con la clase `.cifra` y solo tokens `--sc-*` (CA-1; Derivado: decisión #2, sin "marcar todas"). Se verifica con 5.1 (la lista es de solo lectura, sin controles que operar con teclado).
- [x] 5.3 Implementar `src/app/(tablero)/notificaciones/page.tsx` dinámico: lee `sesionActual()`, redirige a `/` si el rol no es técnico, llama al servicio (sin `fetch`) y resuelve el error con `EstadoError` (CA-1, CA-3; Derivado: decisión #3, #4). Se verifica con el e2e 7.1 (Vitest no renderiza páginas asíncronas).

## 6. Menú

- [x] 6.1 Escribir `__tests__/extensiones.test.ts`: `#24 CA-1: el menú ofrece Notificaciones al técnico`, `#24 CA-1: el menú no ofrece Notificaciones al administrador`, y `#24 CA-3: el contrato declara 401 y 403 para GET /api/notificaciones`. Se verifica con `test:unit`.
- [x] 6.2 Crear `src/modulos/notificaciones/menu.ts` (`roles: ["tecnico"]`, icono genérico) (CA-1; Derivado: decisión #4). Se verifica con 6.1.

## 7. Integración y aceptación

- [x] 7.1 Escribir `e2e/notificaciones.spec.ts`: `#24 CA-1: el técnico ve las notificaciones de la semilla, la más reciente primero, con el número de no leídas`. El orden y el número esperados se fijan desde la semilla de `## Interfaces`, con `data-testid` o rol con nombre `exact: true`, sin crear ni cambiar datos. Se verifica con `npx playwright test --list`.
- [x] 7.2 Revisar que cada CA tiene al menos una prueba con `trazabilidad-grep.mjs` y que `npm run typecheck` y `test:unit` pasan (CA-1, CA-2, CA-3).

## Workflow follow-up

- Abrir el PR en borrador con `Closes #24` y `Change: consultar-notificaciones`.
- Esperar el CI del PR: `lint`, `build`, `test:integration` y `e2e` (primera ejecución real de las pruebas de integración y e2e).
- Archivar con `openspec archive consultar-notificaciones --yes` en un PR propio, después del merge.
