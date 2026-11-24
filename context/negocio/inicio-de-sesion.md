# inicio-de-sesion

Comportamiento ya especificado: `vigente` (en `openspec/specs/`) o `en curso` (en un change sin archivar). Cada requisito va con su texto completo y los nombres de sus escenarios; si una versión en curso reemplaza a la vigente, queda la más reciente. Si la historia cambia uno, su delta usa `## MODIFIED Requirements` con el nombre exacto.

<!-- entrada: proposito -->
Permite que un administrador o un técnico inicie y cierre sesión con su nombre de usuario y su contraseña, y que el tablero y la API reconozcan esa sesión y su rol, para que cada historia solo decida qué rol exige.
<!-- fin -->

<!-- entrada: requisito: Inicio de sesión con credenciales válidas -->
- **Inicio de sesión con credenciales válidas** (vigente): La API SHALL iniciar sesión con el nombre de usuario y la contraseña de un usuario registrado: MUST responder 200, crear la sesión en una cookie `httpOnly` y llevar a la persona al tablero desde la página `/login`. La sesión SHALL durar 8 horas y llevar el rol del usuario, que es `administrador` o `tecnico` (CA-1; Derivado: decisión #1, #5, #6).
  - Escenarios: Credenciales correctas (CA-1); La interfaz lleva al tablero (CA-1); Cuentas de demostración (CA-1)
<!-- fin -->

<!-- entrada: requisito: Credenciales incorrectas sin pistas -->
- **Credenciales incorrectas sin pistas** (vigente): La API SHALL responder 401 con el mismo mensaje cuando la contraseña es incorrecta y cuando el usuario no existe, y MUST NOT crear ninguna cookie de sesión. La contraseña SHALL guardarse solo como hash, y los registros del servidor MUST NOT incluir contraseñas ni tokens (CA-2; Derivado: decisión #2, #3).
  - Escenarios: Contraseña incorrecta (CA-2); Usuario inexistente (CA-2)
<!-- fin -->

<!-- entrada: requisito: Validación del cuerpo del login -->
- **Validación del cuerpo del login** (vigente): La API SHALL validar el cuerpo del login con Zod y responder 400 cuando falta el usuario o la contraseña, o cuando el cuerpo no es JSON; MUST NOT consultar la base de datos ni contar un intento fallido en ese caso (CA-3; Derivado: decisión #4, #7).
  - Escenarios: Cuerpo sin usuario (CA-3); Cuerpo sin contraseña (CA-3); Cuerpo que no es JSON (CA-3)
<!-- fin -->

<!-- entrada: requisito: Límite de intentos fallidos -->
- **Límite de intentos fallidos** (vigente): La API SHALL responder 429, con la cabecera `Retry-After`, a un cliente que supere 5 intentos fallidos de login en un minuto, contados por IP y por nombre de usuario, y MUST responder 429 antes de verificar la contraseña aunque esta sea correcta (CA-4; Derivado: decisión #4).
  - Escenarios: Sexto intento desde la misma IP (CA-4); Sexto intento contra el mismo usuario (CA-4); La ventana vence (CA-4)
<!-- fin -->

<!-- entrada: requisito: Acceso con la sesión emitida por el login -->
- **Acceso con la sesión emitida por el login** (vigente): Las páginas del tablero SHALL redirigir a `/login` a un visitante sin sesión, y las rutas `/api/...` protegidas MUST responder 401 en JSON, sin redirección, cuando no hay sesión válida. Una sesión emitida por el login SHALL ser reconocida por el tablero y por la API con el rol de su usuario (CA-5, CA-6; Derivado: decisión #8).
  - Escenarios: Página del tablero sin sesión (CA-5); API protegida sin sesión (CA-5); Sesión emitida por el login abre el tablero (CA-5)
<!-- fin -->

<!-- entrada: requisito: Endpoints reservados a administradores -->
- **Endpoints reservados a administradores** (vigente): Una ruta reservada a administradores SHALL responder 403 en JSON y MUST NOT ejecutar la acción cuando la sesión es de un técnico (CA-6; Derivado: decisión #8).
  - Escenarios: Técnico en una ruta de administrador (CA-6); Administrador en la misma ruta (CA-6)
<!-- fin -->

<!-- entrada: requisito: Cierre de sesión -->
- **Cierre de sesión** (vigente): La API SHALL cerrar la sesión eliminando la cookie, de modo que la siguiente llamada a una ruta protegida responda 401 (CA-7; Derivado: decisión #5).
  - Escenarios: Cierre con sesión (CA-7); La sesión cerrada ya no sirve (CA-7)
<!-- fin -->
