# Design

## Context

La HU 1b dejó el núcleo: `src/lib/session.ts` (`ROLES` = `administrador` y `tecnico`, `COOKIE_SESION` = `sesion`, `DURACION_SESION_S` = 8 h y `firmarSesion`, que solo firma el token), `src/lib/dal.ts` (`sessionFromRequest`, `requireRole`, `sesionActual`), `src/proxy.ts` (redirige páginas a `/login`; su matcher excluye `/login` y `/api`), `src/lib/http.ts` (`conHttp`, que traduce `ErrorHttp` y `ZodError`) y `src/lib/db.ts`. No existen tablas de dominio, la página `/login` ni `src/lib/rate-limit.ts`; el núcleo no se edita, así que el limitador vive en el módulo. La migración `V202611211900__linea_base.sql` solo habilita `pgcrypto`. Ver `proposal.md` para el motivo.

## Goals / Non-Goals

**Goals:**
- Que una persona obtenga una sesión válida con usuario y contraseña, y que el núcleo existente la reconozca sin cambios.
- Dejar cuentas de demostración que las demás historias usen en sus pruebas.

**Non-Goals:**
- Registro, recuperación de contraseña, administración de usuarios, cierre por inactividad y renovación del token (issue #20).
- Limitar intentos de forma compartida entre varias instancias: el servicio público corre en una sola.
- Cambiar el layout, `proxy.ts` o `src/lib/` (núcleo).

## Decisions

1. **Tabla `usuarios` y migración propia.** `db/migration/V202611221930__usuarios.sql` crea `usuarios(id uuid primary key default gen_random_uuid(), nombre_usuario text not null unique, contrasena_hash text not null, rol text not null check (rol in ('administrador', 'tecnico')), creado_en timestamptz not null default now())`. El `CHECK` repite los literales de `ROLES` y la restricción `unique` hace cumplir RN-4. El `sub` del JWT es el `id` (texto), no el nombre, para que renombrar a una persona no rompa sus sesiones. Es compatible hacia atrás: solo agrega una tabla. Alternativa descartada: `serial` como clave, porque expone cuántos usuarios hay si algún día se muestra el id.
2. **Contraseñas con `scrypt` de Node.** `contrasena.ts` guarda `scrypt$<sal en hex>$<hash en hex>` con sal aleatoria de 16 bytes, longitud de clave 64 y los parámetros por defecto de Node (N=16384, r=8, p=1), y compara con `timingSafeEqual` (RN-5, RN-2). Es lo decidido en el issue: sin librerías nuevas (CLAUDE.md §3). Los parámetros van en una constante y no dentro del texto guardado: si cambian, se versiona el prefijo (`scrypt$` pasaría a `scrypt2$`).
3. **Un solo mensaje de error y hash de relleno.** Contraseña incorrecta y usuario inexistente responden 401 con `Credenciales inválidas`. Cuando el usuario no existe, el servicio verifica la contraseña contra un hash de relleno calculado al cargar el módulo, para que ambos casos tarden parecido y no se pueda enumerar usuarios por el tiempo de respuesta (CA-2).
4. **Limitador en memoria dentro del módulo y orden fijo.** `limitador.ts` guarda, por clave `ip:<ip>` y `usuario:<nombre>`, las marcas de tiempo de los fallos dentro de una ventana deslizante de 60 s; el límite es 5 fallos por clave (RN-6). El orden en el servicio es: validar el cuerpo (400), comprobar el límite (429 con `Retry-After`), consultar el usuario y verificar la contraseña. Así un cuerpo inválido no cuenta ni consulta la base, y un cliente bloqueado recibe 429 aunque acierte la contraseña. Un fallo (usuario inexistente o clave incorrecta) suma a ambas claves; un acierto no reinicia contadores. Las entradas vencidas se podan en cada consulta para que el mapa no crezca. La IP es el primer valor de `x-forwarded-for` (o `desconocida`): un cliente puede falsearla, pero el límite por usuario sigue vigente. Alternativa descartada: tabla en la base, que añadiría migración y SQL a cada intento sin necesidad con una sola instancia. El reloj se inyecta para probar la ventana sin esperar.
5. **Cookie de sesión.** El handler fija `sesion=<JWT>; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800` y agrega `Secure` cuando la petición llegó por HTTPS (`x-forwarded-proto: https` o protocolo `https` de la URL): así funciona en local por `http` y en Render por `https`. El cierre de sesión responde 200 con la misma cookie vacía y `Max-Age=0`; es idempotente y no exige sesión. Se arma el encabezado `Set-Cookie` a mano en la `Response` (y no con `cookies()` de `next/headers`) para poder probar los handlers con `Request` y `Response` sin entorno de Next.
6. **Duración de 8 horas: ya la fija el núcleo** (`DURACION_SESION_S`, RN-7). La cookie usa esa constante; esta historia no la cambia.
7. **Cuerpo del login.** `schema.ts` define `{ usuario: texto sin espacios en los extremos, 1 a 64 caracteres; contrasena: texto de 1 a 128 caracteres }`. El handler lee el cuerpo con `req.json().catch(() => undefined)`, de modo que un cuerpo que no es JSON falla en Zod y `conHttp` responde 400, no 500 (CA-3). Los límites máximos impiden que una contraseña enorme cueste un `scrypt` caro.
8. **CA-5 y CA-6 no agregan código de producción.** El núcleo ya redirige páginas (`proxy.ts`), responde 401 y 403 en JSON (`sessionFromRequest`, `requireRole`) y las pruebas de la HU 1b lo cubren con sesiones firmadas a mano. Aquí se prueba con la cookie que entrega el login real. Como esta historia no tiene un endpoint de administrador, la prueba de CA-6 define una ruta local con `requireRole("administrador")`, igual que `acceso.int.test.ts`. El redirect a `/login` de páginas se comprueba también con Playwright, porque Vitest no renderiza páginas asíncronas.
9. **Semilla y cuentas de demostración.** `db/seed/auth.sql` inserta dos usuarios con `ON CONFLICT (nombre_usuario) DO NOTHING` (idempotente, CLAUDE.md §5): `admin` (rol `administrador`) y `tecnico` (rol `tecnico`). Guarda solo el hash. Las contraseñas de demostración son `Demo-Admin-2026` y `Demo-Tecnico-2026` y se documentan en el README; no protegen datos reales y la base de Render solo tiene datos de demostración. Una prueba de integración inicia sesión con ambas, de modo que la semilla y el README no puedan desalinearse. Los hashes se generan una vez con el mismo código de `contrasena.ts`.
10. **Página `/login` y formulario.** `src/app/login/page.tsx` es un Server Component síncrono sin datos que muestra `FormularioLogin` (Client Component en `ui/`), el cual llama a `POST /api/auth/login` y, con 200, navega a `/` y refresca; con 400, 401 o 429 muestra el mensaje que devuelve la API. Queda fuera del grupo `(tablero)` porque no lleva el layout con menú. No redirige a quien ya tiene sesión: no es parte de los CA.
11. **Sin botón de cerrar sesión en el tablero.** Los CA piden solo el cierre por API, el layout es núcleo y el issue declara que la historia no usa puntos de extensión. Un enlace en el menú tendría que apuntar a una página nueva solo para llamar a la API (YAGNI). Se informa en el PR para que el equipo decida si lo pide en otra historia.
12. **Sin contador opcional.** `auth_login_fallidos_total` es opcional en el issue y ningún CA lo exige; no se agrega (YAGNI). `conHttp` ya mide y registra cada petición con su estado, así que los 401 y 429 quedan en las métricas y en el registro por ruta.
13. **Contrato.** `contracts/openapi.yaml` suma `POST /api/auth/login` (`security: []`; respuestas 200, 400, 401 y 429) y `POST /api/auth/logout` (`security: []`; 200), conservando las rutas existentes. Los errores usan el esquema `Error` ya definido; el 400 de Zod trae además `detalles`, como los demás handlers.

## Risks / Trade-offs

- [El límite en memoria se reinicia con cada despliegue y no se comparte entre instancias] → aceptable con una sola instancia y para una demo; si el servicio escalara, se mueve a la base (decisión #4).
- [La IP sale de `x-forwarded-for`, que un cliente puede falsear] → el límite por usuario sigue protegiendo cada cuenta; no se confía en la IP para autorizar nada.
- [Bloquear por nombre de usuario permite que alguien bloquee a otra persona a propósito, por un minuto] → se acepta: la ventana es corta y el efecto es temporal.
- [Contraseñas de demostración públicas en el README] → solo hay datos de demostración; la administración de usuarios y el cambio de contraseña quedan fuera de alcance.
- [`scrypt` cuesta CPU y memoria en el plan gratuito de Render] → los límites de longitud (decisión #7) y el limitador (decisión #4) acotan cuántas verificaciones puede forzar un cliente.
- [Las pruebas de integración usan la base de desarrollo] → cada prueba usa nombres de usuario propios y borra sus filas; no tocan las cuentas de demostración salvo para leerlas.

## Migration Plan

1. Se fusiona la historia; el CD migra y siembra la base de Render antes de avisar al servicio (`cd.yml`, HU 2): `V202611221930__usuarios.sql` y `db/seed/auth.sql`.
2. Reversa: la migración solo agrega una tabla, así que una imagen anterior sigue funcionando; para deshacer, una migración nueva hacia adelante la elimina (las migraciones fusionadas no se editan).
