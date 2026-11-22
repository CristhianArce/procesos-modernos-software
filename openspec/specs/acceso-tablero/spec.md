# acceso-tablero Specification

## Purpose

Fija el control de acceso base del tablero: las páginas sin sesión llevan al login y la API protegida responde errores JSON en lugar de redirigir, para que cada historia solo declare qué rol exige.

## Requirements

### Requirement: Páginas del tablero redirigen sin sesión
Las páginas del tablero SHALL redirigir a `/login` a un visitante sin sesión válida (CA-6).

#### Scenario: Visitante sin sesión abre el tablero (CA-6)
- **WHEN** un visitante sin cookie de sesión abre `/`
- **THEN** recibe una redirección a `/login`

#### Scenario: Sesión con firma inválida (CA-6)
- **WHEN** un visitante abre `/` con una cookie de sesión cuya firma no corresponde a `SESSION_SECRET`
- **THEN** recibe una redirección a `/login`

### Requirement: API protegida responde 401 y 403 en JSON
Una ruta `/api/...` protegida SHALL responder 401 en JSON, sin redirección, cuando no hay sesión válida, y 403 en JSON cuando la sesión no tiene el rol exigido (CA-6).

#### Scenario: API protegida sin sesión (CA-6)
- **WHEN** un cliente sin sesión llama a una ruta `/api/...` protegida
- **THEN** recibe 401 con un cuerpo JSON de error y sin cabecera `Location`

#### Scenario: Rol insuficiente (CA-6)
- **WHEN** un cliente con sesión de rol `tecnico` llama a una ruta que exige `administrador`
- **THEN** recibe 403 con un cuerpo JSON de error
