# Spec Delta

## Purpose

Muestra a los usuarios autenticados el texto descriptivo y la versión de la aplicación en una página propia.

## ADDED Requirements

### Requisito: Consulta de la información de la aplicación
El sistema SHALL devolver el texto y la versión de la aplicación a un usuario autenticado (CA-1).

#### Scenario: Usuario autenticado consulta la información (CA-1)
- **WHEN** un usuario autenticado hace `GET /api/acerca`
- **THEN** recibe 200 con un JSON que contiene `texto` y `version`

### Requisito: Página Acerca de en el menú
El sistema SHALL mostrar el ítem "Acerca de" en el menú y su página a cualquier usuario autenticado (CA-2).

#### Scenario: Ítem de menú visible (CA-2)
- **WHEN** un técnico autenticado abre el tablero
- **THEN** el menú muestra el ítem "Acerca de" y la página muestra el texto y la versión

### Requisito: Acceso sin sesión rechazado
El sistema MUST rechazar la consulta de la información sin sesión (CA-3).

#### Scenario: Sin sesión (CA-3)
- **WHEN** un visitante sin sesión hace `GET /api/acerca`
- **THEN** recibe 401 con un JSON de error
