# Proposal

## Why

La historia de práctica #900 pide una página "Acerca de" que muestre el texto y la versión de la app, para probar el flujo SDD sin tocar el núcleo.

## What Changes

- Endpoint `GET /api/acerca` que devuelve el texto y la versión (CA-1, CA-3).
- Página `Acerca de` con su ítem de menú para usuarios autenticados (CA-2).

## Capabilities

### New Capabilities
- `acerca`: información de la aplicación (texto y versión) para usuarios autenticados.

### Modified Capabilities
- Ninguna.

## Impact

- Módulo nuevo `src/modulos/acerca/`, ruta `src/app/api/acerca/` y página `src/app/(tablero)/acerca/`.
