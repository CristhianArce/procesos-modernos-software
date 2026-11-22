## Historia

Como administrador o técnico quiero iniciar sesión con mi usuario y contraseña para acceder al tablero con los permisos de mi rol.

## Contexto

Es la HU 3 de la propuesta (sección 5) y la primera historia de la línea base. La HU 1b dejó el núcleo de sesión (`session.ts`, `dal.ts`), `proxy.ts` y el envoltorio de handlers, pero no hay usuarios ni página de login. Esta historia crea los usuarios, el login y el cierre de sesión, y deja las credenciales de demostración que usarán las demás historias.

## Criterios de aceptación

- **CA-1:** Dado un usuario registrado, cuando envía su usuario y contraseña correctos al login, entonces la API responde 200, crea una sesión en una cookie `httpOnly` y la interfaz lo lleva al tablero.
- **CA-2:** Dadas credenciales incorrectas o de un usuario que no existe, cuando se intenta iniciar sesión, entonces la API responde 401 con el mismo mensaje en ambos casos y no crea ninguna cookie de sesión.
- **CA-3:** Dado un cuerpo sin usuario o sin contraseña, cuando se llama al login, entonces responde 400 por la validación de Zod.
- **CA-4:** Dado un cliente que supera el límite de intentos fallidos de login, cuando intenta de nuevo, entonces responde 429.
- **CA-5:** Dado un visitante sin sesión, cuando abre una página del tablero, entonces es redirigido a `/login`, y cuando llama a una ruta `/api/...` protegida recibe 401 en JSON.
- **CA-6:** Dada una sesión de técnico, cuando llama a un endpoint reservado a administradores, entonces recibe 403 en JSON y la acción no se ejecuta.
- **CA-7:** Dado un usuario con sesión, cuando cierra sesión, entonces la cookie se elimina y la siguiente llamada a una ruta protegida responde 401.

## Reglas de negocio

- **RN-1:** Los roles son `admin` y `tecnico` (propuesta, sección 4). Cada usuario tiene exactamente uno.
- **RN-2:** La contraseña nunca se guarda ni se registra en claro; el log no incluye contraseñas ni tokens.
- **RN-3:** La sesión es un JWT firmado con `SESSION_SECRET` y se verifica siempre en el servidor.

## Fuera de alcance

- Registro de usuarios, recuperación de contraseña y administración de usuarios.
- Cierre de sesión por inactividad y renovación del token.
- Proveedores externos de identidad (se descartó Cognito).

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/auth/` · página `src/app/login/page.tsx` · API `src/app/api/auth/login/route.ts` (pública, con `rate-limit.ts`) y cierre de sesión en `src/app/api/auth/`.
- Endpoints sugeridos: `POST /api/auth/login` y `POST /api/auth/logout` (se agregan a `contracts/openapi.yaml`).
- Datos: tabla `usuarios` con migración Flyway y semilla `db/seed/auth.sql` con un administrador y un técnico de demostración.
- Contador de negocio opcional: `auth_login_fallidos_total` en `src/modulos/auth/metrics.ts`.
- Puntos de extensión: ninguno (usa el núcleo de sesión que dejó la HU 1b).

## Dependencias

- HU 2 (#18): infraestructura y CI/CD.

## Preguntas abiertas

- ¿Con qué se inicia sesión? — opciones: correo electrónico / nombre de usuario. Los CA dicen "usuario" para no fijarlo.
- ¿Cómo se guarda la contraseña? — opciones: `scrypt` del módulo `crypto` de Node, sin dependencias nuevas / `bcrypt`, que exige aprobar una librería nueva (CLAUDE.md).
- ¿Cuál es el límite de intentos y la ventana de tiempo del rate limit? — la propuesta pide 429 pero no el valor. Opciones: por ejemplo 5 intentos por minuto por IP y usuario / otro valor.
- ¿Cuánto dura la sesión? — opciones: 8 horas / 24 horas / otro.
- ¿Cuáles son las credenciales de demostración? — la propuesta las deja pendientes; la semilla las define y el README las documenta.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
