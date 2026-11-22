## Why

El tablero ya tiene el núcleo de sesión (`session.ts`, `dal.ts`), `proxy.ts` y el envoltorio de handlers, pero no hay usuarios ni forma de obtener una sesión: `/login` no existe y ninguna ruta puede probarse con una persona real. Esta historia (#20, HU 3) crea los usuarios, el inicio y el cierre de sesión, y deja las cuentas de demostración que usarán las demás historias.

## What Changes

- Tabla `usuarios` (nombre de usuario único, hash de contraseña y uno de los dos roles) con su migración Flyway y la semilla `db/seed/auth.sql`: un administrador y un técnico de demostración, solo con el hash. Las contraseñas de demostración se documentan en el README. Cubre CA-1 y CA-2.
- Módulo `src/modulos/auth/`: contraseñas con `scrypt` de Node (sin librerías nuevas), limitador de intentos fallidos en memoria (5 por minuto, por IP y por usuario) y servicio de inicio de sesión. Cubre CA-1 a CA-4.
- `POST /api/auth/login` (pública): valida con Zod, comprueba el límite, verifica las credenciales y crea la cookie `httpOnly` con el JWT firmado por el núcleo; `POST /api/auth/logout` elimina la cookie. Ambas se agregan a `contracts/openapi.yaml`. Cubre CA-1 a CA-4 y CA-7.
- Página `/login` con un formulario que llama a la API y lleva al tablero. Cubre CA-1.
- Pruebas de aceptación de CA-5 y CA-6 con sesiones emitidas por el login real (páginas que redirigen a `/login`, API protegida con 401 y 403). No agregan código de producción: el núcleo ya hace ese trabajo.

Fuera de alcance (issue #20): registro, recuperación de contraseña y administración de usuarios; cierre por inactividad y renovación del token; proveedores externos de identidad. Tampoco se agrega un botón de cerrar sesión en el tablero (el layout es núcleo y los CA piden solo la API) ni el contador opcional `auth_login_fallidos_total` (ver `design.md`, decisiones #11 y #12).

## Capabilities

### New Capabilities

- `inicio-de-sesion`: comportamiento observable del inicio y cierre de sesión (credenciales, validación, límite de intentos, cookie de sesión) y del acceso al tablero con la sesión emitida por el login (páginas, API y roles).

### Modified Capabilities

(ninguna: `acceso-tablero`, del change `herramientas-desarrollo`, aún no está archivada y no cambia; esta historia solo la verifica con sesiones reales)

## Impact

- **Datos:** migración `V202611221930__usuarios.sql` (tabla nueva `usuarios`, sin tocar tablas ajenas) y `db/seed/auth.sql`.
- **Código nuevo:** `src/modulos/auth/{schema,service,repo}.ts`, `contrasena.ts`, `limitador.ts` y `ui/`; `src/app/api/auth/{login,logout}/route.ts`; `src/app/login/page.tsx`.
- **Contrato:** `contracts/openapi.yaml` (rutas `/api/auth/login` y `/api/auth/logout`).
- **Sin cambios** en el núcleo (`proxy.ts`, `src/lib/`, layout del tablero) ni dependencias nuevas.
- **Documentación:** sección de cuentas de demostración en `README.md`.
