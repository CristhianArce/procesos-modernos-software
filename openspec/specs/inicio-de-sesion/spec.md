# inicio-de-sesion Specification

## Purpose

Permite que un administrador o un técnico inicie y cierre sesión con su nombre de usuario y su contraseña, y que el tablero y la API reconozcan esa sesión y su rol, para que cada historia solo decida qué rol exige.

## Requirements

### Requirement: Inicio de sesión con credenciales válidas
La API SHALL iniciar sesión con el nombre de usuario y la contraseña de un usuario registrado: MUST responder 200, crear la sesión en una cookie `httpOnly` y llevar a la persona al tablero desde la página `/login`. La sesión SHALL durar 8 horas y llevar el rol del usuario, que es `administrador` o `tecnico` (CA-1; Derivado: decisión #1, #5, #6).

#### Scenario: Credenciales correctas (CA-1)
- **WHEN** un usuario registrado envía su nombre de usuario y su contraseña correctos al login
- **THEN** la API responde 200 con su usuario y su rol, y la respuesta fija una cookie de sesión `httpOnly` que dura 8 horas

#### Scenario: La interfaz lleva al tablero (CA-1)
- **WHEN** una persona envía credenciales correctas desde la página `/login`
- **THEN** la interfaz la lleva al tablero y el menú corresponde a su rol

#### Scenario: Cuentas de demostración (CA-1)
- **WHEN** se carga la semilla de autenticación y se inicia sesión con cada cuenta de demostración documentada en el README
- **THEN** la cuenta del administrador obtiene el rol `administrador` y la del técnico el rol `tecnico`

### Requirement: Credenciales incorrectas sin pistas
La API SHALL responder 401 con el mismo mensaje cuando la contraseña es incorrecta y cuando el usuario no existe, y MUST NOT crear ninguna cookie de sesión. La contraseña SHALL guardarse solo como hash, y los registros del servidor MUST NOT incluir contraseñas ni tokens (CA-2; Derivado: decisión #2, #3).

#### Scenario: Contraseña incorrecta (CA-2)
- **WHEN** se envía el nombre de un usuario registrado con una contraseña que no le corresponde
- **THEN** la API responde 401 con el mensaje `Credenciales inválidas` y sin cabecera `Set-Cookie`

#### Scenario: Usuario inexistente (CA-2)
- **WHEN** se envía un nombre de usuario que no existe
- **THEN** la API responde 401 con exactamente el mismo mensaje y sin cabecera `Set-Cookie`

### Requirement: Validación del cuerpo del login
La API SHALL validar el cuerpo del login con Zod y responder 400 cuando falta el usuario o la contraseña, o cuando el cuerpo no es JSON; MUST NOT consultar la base de datos ni contar un intento fallido en ese caso (CA-3; Derivado: decisión #4, #7).

#### Scenario: Cuerpo sin usuario (CA-3)
- **WHEN** se llama al login con un cuerpo que no trae `usuario`
- **THEN** la API responde 400 con el detalle del campo faltante

#### Scenario: Cuerpo sin contraseña (CA-3)
- **WHEN** se llama al login con un cuerpo que no trae `contrasena`
- **THEN** la API responde 400 con el detalle del campo faltante

#### Scenario: Cuerpo que no es JSON (CA-3)
- **WHEN** se llama al login con un cuerpo que no se puede leer como JSON
- **THEN** la API responde 400 y no 500

### Requirement: Límite de intentos fallidos
La API SHALL responder 429, con la cabecera `Retry-After`, a un cliente que supere 5 intentos fallidos de login en un minuto, contados por IP y por nombre de usuario, y MUST responder 429 antes de verificar la contraseña aunque esta sea correcta (CA-4; Derivado: decisión #4).

#### Scenario: Sexto intento desde la misma IP (CA-4)
- **WHEN** una IP acumula 5 intentos fallidos de login dentro de un minuto y envía un intento más
- **THEN** la API responde 429 con `Retry-After` y no consulta la base de datos

#### Scenario: Sexto intento contra el mismo usuario (CA-4)
- **WHEN** un mismo nombre de usuario acumula 5 intentos fallidos dentro de un minuto, aunque vengan de IP distintas, y llega otro intento
- **THEN** la API responde 429, incluso con la contraseña correcta

#### Scenario: La ventana vence (CA-4)
- **WHEN** pasa un minuto desde el primer intento fallido contado
- **THEN** el cliente puede volver a intentar y recibe 401 o 200 según sus credenciales

### Requirement: Acceso con la sesión emitida por el login
Las páginas del tablero SHALL redirigir a `/login` a un visitante sin sesión, y las rutas `/api/...` protegidas MUST responder 401 en JSON, sin redirección, cuando no hay sesión válida. Una sesión emitida por el login SHALL ser reconocida por el tablero y por la API con el rol de su usuario (CA-5, CA-6; Derivado: decisión #8).

#### Scenario: Página del tablero sin sesión (CA-5)
- **WHEN** un visitante sin sesión abre una página del tablero
- **THEN** es redirigido a `/login`

#### Scenario: API protegida sin sesión (CA-5)
- **WHEN** un visitante sin sesión llama a una ruta `/api/...` protegida
- **THEN** recibe 401 en JSON y sin cabecera `Location`

#### Scenario: Sesión emitida por el login abre el tablero (CA-5)
- **WHEN** una persona inicia sesión y abre una página del tablero con la cookie recibida
- **THEN** la página se muestra sin redirección

### Requirement: Endpoints reservados a administradores
Una ruta reservada a administradores SHALL responder 403 en JSON y MUST NOT ejecutar la acción cuando la sesión es de un técnico (CA-6; Derivado: decisión #8).

#### Scenario: Técnico en una ruta de administrador (CA-6)
- **WHEN** el técnico de demostración inicia sesión y llama con su cookie a una ruta que exige `administrador`
- **THEN** recibe 403 en JSON y la acción no se ejecuta

#### Scenario: Administrador en la misma ruta (CA-6)
- **WHEN** el administrador de demostración inicia sesión y llama con su cookie a esa misma ruta
- **THEN** la acción se ejecuta y recibe 200

### Requirement: Cierre de sesión
La API SHALL cerrar la sesión eliminando la cookie, de modo que la siguiente llamada a una ruta protegida responda 401 (CA-7; Derivado: decisión #5).

#### Scenario: Cierre con sesión (CA-7)
- **WHEN** un usuario con sesión llama a `POST /api/auth/logout`
- **THEN** la API responde 200 y fija la cookie de sesión vencida

#### Scenario: La sesión cerrada ya no sirve (CA-7)
- **WHEN** el cliente repite una llamada a una ruta protegida con la cookie que recibió al cerrar sesión
- **THEN** recibe 401
