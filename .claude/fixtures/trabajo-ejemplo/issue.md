# Issue #900: PRÁCTICA: Página Acerca de

- Estado: abierto
- Etiquetas: historia, practica

## Historia

Como usuario autenticado quiero ver una página "Acerca de" con el texto y la versión de la app para saber qué versión estoy usando.

## Criterios de aceptación

- **CA-1:** Dado un usuario autenticado, cuando consulta `GET /api/acerca`, entonces recibe 200 con `texto` y `version`.
- **CA-2:** Dado un técnico autenticado, cuando abre el tablero, entonces ve el ítem "Acerca de" en el menú y la página con el texto y la versión.
- **CA-3:** Dado un visitante sin sesión, cuando consulta `GET /api/acerca`, entonces recibe 401 en JSON.

## Criterios numerados

- CA-1: Dado un usuario autenticado, cuando consulta `GET /api/acerca`, entonces recibe 200 con `texto` y `version`.
- CA-2: Dado un técnico autenticado, cuando abre el tablero, entonces ve el ítem "Acerca de" en el menú y la página con el texto y la versión.
- CA-3: Dado un visitante sin sesión, cuando consulta `GET /api/acerca`, entonces recibe 401 en JSON.
