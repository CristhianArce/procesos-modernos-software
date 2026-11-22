# Issue #20: HU 3: Iniciar sesión con roles de administrador y técnico

Estado: OPEN
Etiquetas: historia, linea-base

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

- **RN-1:** Los roles son `administrador` y `tecnico` (propuesta, sección 4; son los literales de `ROLES` en `src/lib/session.ts`). Cada usuario tiene exactamente uno.
- **RN-2:** La contraseña nunca se guarda ni se registra en claro; el log no incluye contraseñas ni tokens.
- **RN-3:** La sesión es un JWT firmado con `SESSION_SECRET` y se verifica siempre en el servidor.
- **RN-4:** El usuario inicia sesión con su nombre de usuario, que es único.
- **RN-5:** La contraseña se guarda con `scrypt` del módulo `crypto` de Node (sal aleatoria por usuario) y se compara en tiempo constante. No se agrega ninguna librería.
- **RN-6:** El límite de login es de 5 intentos fallidos por minuto, contados por IP y por usuario; al superarlo responde 429 (CA-4).
- **RN-7:** La sesión dura 8 horas, valor que ya fija `DURACION_SESION_S` en el núcleo; esta historia no lo cambia.

## Fuera de alcance

- Registro de usuarios, recuperación de contraseña y administración de usuarios.
- Cierre de sesión por inactividad y renovación del token.
- Proveedores externos de identidad (se descartó Cognito).

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/auth/` · página `src/app/login/page.tsx` · API `src/app/api/auth/login/route.ts` (pública, con rate limit) y cierre de sesión en `src/app/api/auth/`.
- Rate limit: `src/lib/` no tiene `rate-limit.ts` y el núcleo no se edita, así que esta historia crea el limitador dentro de `src/modulos/auth/` (en memoria, suficiente para una sola instancia).
- Endpoints sugeridos: `POST /api/auth/login` y `POST /api/auth/logout` (se agregan a `contracts/openapi.yaml`).
- Datos: tabla `usuarios` (nombre de usuario único, hash de contraseña, rol) con migración Flyway y semilla `db/seed/auth.sql` con un administrador y un técnico de demostración. La semilla guarda solo el hash; las contraseñas de demostración se documentan en el README.
- Contador de negocio opcional: `auth_login_fallidos_total` en `src/modulos/auth/metrics.ts`.
- Puntos de extensión: ninguno (usa el núcleo de sesión que dejó la HU 1b).

## Dependencias

- HU 2 (#18): infraestructura y CI/CD.

## Preguntas abiertas

Ninguna. Decididas el 22 de noviembre de 2026:

- Se inicia sesión con **nombre de usuario** (RN-4).
- La contraseña se guarda con **`scrypt`** de Node, sin librerías nuevas (RN-5).
- El rate limit es de **5 intentos fallidos por minuto** por IP y usuario (RN-6).
- La sesión dura **8 horas**, como ya fija el núcleo (RN-7).
- Las credenciales de demostración son **dos cuentas fijas en la semilla** (un administrador y un técnico); la semilla guarda solo el hash y el README documenta las contraseñas.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.

## Criterios numerados

- CA-1: Dado un usuario registrado, cuando envía su usuario y contraseña correctos al login, entonces la API responde 200, crea una sesión en una cookie `httpOnly` y la interfaz lo lleva al tablero.
- CA-2: Dadas credenciales incorrectas o de un usuario que no existe, cuando se intenta iniciar sesión, entonces la API responde 401 con el mismo mensaje en ambos casos y no crea ninguna cookie de sesión.
- CA-3: Dado un cuerpo sin usuario o sin contraseña, cuando se llama al login, entonces responde 400 por la validación de Zod.
- CA-4: Dado un cliente que supera el límite de intentos fallidos de login, cuando intenta de nuevo, entonces responde 429.
- CA-5: Dado un visitante sin sesión, cuando abre una página del tablero, entonces es redirigido a `/login`, y cuando llama a una ruta `/api/...` protegida recibe 401 en JSON.
- CA-6: Dada una sesión de técnico, cuando llama a un endpoint reservado a administradores, entonces recibe 403 en JSON y la acción no se ejecuta.
- CA-7: Dado un usuario con sesión, cuando cierra sesión, entonces la cookie se elimina y la siguiente llamada a una ruta protegida responde 401.
