# observabilidad Specification

## Purpose

Permite saber si la app está viva, medir su tráfico HTTP en formato Prometheus sin exponer las métricas a cualquiera, y registrar cada petición de forma estructurada sin filtrar datos sensibles.

## Requirements

### Requirement: Salud de la app sin autenticación
La app SHALL responder `GET /api/health` sin autenticación con 200 y un cuerpo JSON que incluye `status` igual a `ok` y la versión de la app (CA-2; Derivado: decisión #6).

#### Scenario: Consulta de salud (CA-2)
- **WHEN** un cliente sin sesión ni token hace `GET /api/health`
- **THEN** recibe 200 con `Content-Type` JSON, `status` igual a `ok` y `version` igual a la versión de la app

### Requirement: Métricas protegidas por token
La app SHALL responder `GET /api/metrics` con las métricas en formato Prometheus, incluidas las de peticiones HTTP, solo cuando la petición trae `Authorization: Bearer <METRICS_TOKEN>`; en cualquier otro caso responde 401 en JSON (CA-3).

#### Scenario: Sin token (CA-3)
- **WHEN** un cliente hace `GET /api/metrics` sin cabecera `Authorization`
- **THEN** recibe 401 con un cuerpo JSON de error

#### Scenario: Token incorrecto (CA-3)
- **WHEN** un cliente hace `GET /api/metrics` con `Authorization: Bearer` y un token distinto de `METRICS_TOKEN`
- **THEN** recibe 401 con un cuerpo JSON de error

#### Scenario: Token correcto (CA-3)
- **WHEN** un cliente hace `GET /api/metrics` con `Authorization: Bearer <METRICS_TOKEN>` después de al menos una petición a `/api/health`
- **THEN** recibe 200 con métricas en formato de texto de Prometheus que incluyen un contador de peticiones HTTP por método, ruta y código de estado

### Requirement: Log estructurado de cada petición sin datos sensibles
Cada Route Handler SHALL registrar al terminar una línea de log estructurado con método, ruta, código de estado y duración, y la línea MUST NOT contener el cuerpo de la petición, contraseñas ni tokens (CA-5).

#### Scenario: Petición con contraseña en el cuerpo (CA-5)
- **WHEN** un Route Handler que pasa por el envoltorio común recibe un `POST` con `{"password":"secreta-123"}` en el cuerpo
- **THEN** se registra una línea JSON con método, ruta, código de estado y duración, y la línea no contiene `secreta-123` ni el cuerpo

#### Scenario: Error no controlado en un handler (CA-5)
- **WHEN** un Route Handler que pasa por el envoltorio común lanza un error no controlado
- **THEN** el cliente recibe 500 en JSON sin el detalle interno del error y se registra la línea de log con código 500
