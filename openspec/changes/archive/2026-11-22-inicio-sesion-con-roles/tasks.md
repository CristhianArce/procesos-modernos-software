# Tasks

## 1. Migración

- [x] 1.1 Escribir `src/modulos/auth/__tests__/usuarios.int.test.ts` (rechaza un nombre de usuario repetido y un rol distinto de `administrador` y `tecnico`) y luego `db/migration/V202611221930__usuarios.sql` con la tabla `usuarios`; verificar con `docker compose run --rm flyway migrate info` (versión 202611221930 aplicada) y con la prueba en verde (CA-1, CA-2; Derivado: decisión #1)

## 2. Repo

- [x] 2.1 Escribir `src/modulos/auth/__tests__/repo.int.test.ts` (`buscarPorNombre` devuelve id, nombre, hash y rol de un usuario insertado por la propia prueba, y `null` si no existe) y luego `src/modulos/auth/repo.ts` con `import "server-only"` y SQL a mano; verificar con `npm run test:integration -- repo` (CA-1, CA-2; Derivado: decisión #1)

## 3. Schema

- [x] 3.1 Escribir `src/modulos/auth/__tests__/schema.test.ts` (acepta usuario y contraseña; rechaza sin usuario, sin contraseña, vacíos y más largos que 64 y 128 caracteres) y luego `src/modulos/auth/schema.ts` con Zod; verificar con `npm run test:unit -- schema` (CA-3; Derivado: decisión #7)

## 4. Service

- [x] 4.1 Escribir `src/modulos/auth/__tests__/contrasena.test.ts` (el hash nunca contiene la contraseña, dos hashes de la misma contraseña difieren, verifica la correcta, rechaza la incorrecta y un hash mal formado) y luego `src/modulos/auth/contrasena.ts` con `scrypt` y `timingSafeEqual`; verificar con `npm run test:unit -- contrasena` (CA-2; Derivado: decisión #2)
- [x] 4.2 Escribir `src/modulos/auth/__tests__/limitador.test.ts` (con reloj inyectado: bloquea la clave al quinto fallo, cuenta por IP y por usuario por separado, libera al vencer el minuto y poda entradas vencidas) y luego `src/modulos/auth/limitador.ts`; verificar con `npm run test:unit -- limitador` (CA-4; Derivado: decisión #4)
- [x] 4.3 Escribir `src/modulos/auth/__tests__/service.test.ts` (sin BD, con el repo simulado: credenciales correctas devuelven un token que `verificarSesion` acepta con el id y el rol del usuario; usuario inexistente y clave incorrecta lanzan 401 con el mismo mensaje y verifican contra el hash de relleno; el sexto fallo lanza 429 sin consultar el repo; un cuerpo válido no cuenta como fallo) y luego `src/modulos/auth/service.ts` con `iniciarSesion`; verificar con `npm run test:unit -- service` (CA-1, CA-2, CA-4; Derivado: decisión #3, #4)

## 5. Semilla de demostración

- [x] 5.1 Escribir `src/modulos/auth/__tests__/semilla.int.test.ts` (aplica `db/seed/auth.sql` dos veces sin duplicar filas e inicia sesión con las dos cuentas del README: `admin` obtiene `administrador` y `tecnico` obtiene `tecnico`) y luego `db/seed/auth.sql` (solo hashes, `ON CONFLICT DO NOTHING`) y la sección «Cuentas de demostración» del `README.md`; verificar con `npm run test:integration -- semilla` y con `npm run seed` aplicada dos veces (CA-1; Derivado: decisión #9)

## 6. Handler y contrato

- [x] 6.1 Escribir `src/app/api/__tests__/login.int.test.ts` (con `Request`, usuarios propios de la prueba y una IP distinta por caso: 200 con cookie `HttpOnly`, `SameSite=Lax`, `Max-Age=28800` y sin `Secure` por `http`, con `Secure` si llega `x-forwarded-proto: https`; 401 con el mismo mensaje y sin `Set-Cookie` para usuario inexistente y clave incorrecta; 400 sin usuario, sin contraseña y con un cuerpo que no es JSON; 429 con `Retry-After` al sexto fallo, también con la clave correcta; el registro del servidor no contiene la contraseña enviada) y luego `src/app/api/auth/login/route.ts` envuelto en `conHttp`; verificar con `npm run test:integration -- login` (CA-1, CA-2, CA-3, CA-4; Derivado: decisión #5, #7)
- [x] 6.2 Escribir `src/app/api/__tests__/logout.int.test.ts` (responde 200 con la cookie vencida, es idempotente sin sesión, y una ruta protegida responde 401 con la cookie recibida) y luego `src/app/api/auth/logout/route.ts` envuelto en `conHttp`; verificar con `npm run test:integration -- logout` (CA-7; Derivado: decisión #5)
- [x] 6.3 Agregar `POST /api/auth/login` y `POST /api/auth/logout` a `contracts/openapi.yaml` conservando las rutas existentes; verificar con `npm run test:unit -- contrato`, que exige cada ruta de `src/app/api` en el contrato (CA-1, CA-2, CA-3, CA-4, CA-7; Derivado: decisión #13)

## 7. Página y UI

- [x] 7.1 Escribir `src/modulos/auth/__tests__/login-page.test.ts` (usa `createElement`, porque Vitest solo incluye `*.test.ts`; renderiza `src/app/login/page.tsx` a HTML con `react-dom/server`: formulario con los campos `usuario` y `contrasena` y un botón para enviar) y luego `src/app/login/page.tsx` y `src/modulos/auth/ui/FormularioLogin.tsx` (Client Component que llama a `POST /api/auth/login`, navega a `/` con 200 y muestra el mensaje de error con 400, 401 y 429); verificar con `npm run test:unit -- login-page` y, en la tarea 8.2, con Playwright (CA-1; Derivado: decisión #10)

## 8. Integración y aceptación

- [x] 8.1 Escribir `src/modulos/auth/__tests__/acceso.int.test.ts` (con la cookie que entrega el login real: la API protegida responde 401 sin cookie; `proxy` redirige a `/login` sin sesión y deja pasar con la cookie del login; una ruta local con `requireRole("administrador")` responde 403 al técnico de demostración y 200 al administrador); verificar con `npm run test:integration -- acceso` (CA-5, CA-6; Derivado: decisión #8)
- [x] 8.2 Escribir `e2e/login.spec.ts` (un visitante sin sesión que abre `/` llega a `/login`; el administrador de demostración entra desde el formulario y ve el tablero; una contraseña incorrecta muestra el mensaje de error; al cerrar sesión por la API, abrir `/` vuelve a `/login`, porque ninguna ruta real de `/api` es protegida todavía: el 401 de la API protegida se prueba en 6.2 y 8.1); verificar con `npx playwright test --list` (CA-1, CA-2, CA-5, CA-7; Derivado: decisión #8, #10)
- [x] 8.3 `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration` y `npm run build` en verde; `openspec validate inicio-sesion-con-roles --strict --type change --no-interactive` y `openspec validate --all --strict --no-interactive` en verde (CA-1 a CA-7)

## Workflow follow-up

- Abrir el PR en borrador con `Closes #20` y `Change: inicio-sesion-con-roles`, y esperar que el CI esté en verde.
- Correr `e2e/login.spec.ts` contra la app levantada con `docker compose up -d --build --wait app`, `npm run seed` y `BASE_URL=http://localhost:<puerto> npm run e2e`.
- Después del merge, comprobar en la URL pública que el CD migró y sembró la base de Render y que el login funciona con las cuentas del README.
- Archivar con `openspec archive inicio-sesion-con-roles --yes` en un PR propio, después del merge.
