# Issue #6: [PRUEBA] Página Acerca de (issue de prueba del orquestador, no es del backlog)

Estado: OPEN
Etiquetas: prueba, practica

> ⚠️ **ISSUE DE PRUEBA. No es una historia del backlog ni parte del producto.**
> Solo sirve para probar el orquestador de la HU 1a (#1). Se puede cerrar y reabrir durante las pruebas, y su PR **no se fusiona** a `main`: se cierra sin fusionar al terminar cada corrida.

## Historia

Como usuario autenticado quiero ver una página "Acerca de" con el nombre y la versión de la app para tener esa información a mano en el tablero.

## Contexto

Issue de **prueba** para probar el orquestador en modo `demo` (plan de construcción, sección 2.0). No entra al backlog. Es un módulo autocontenido que no toca el núcleo: solo usa los puntos de extensión.

## Criterios de aceptación

- **CA-1:** Dado un usuario autenticado (administrador o técnico), cuando consulta `GET /api/acerca`, entonces recibe 200 con un JSON que contiene `nombre` y `version`.
- **CA-2:** Dado un técnico autenticado, cuando abre el tablero, entonces ve el ítem "Acerca de" en el menú, y al entrar a `/acerca` ve el nombre y la versión de la app.
- **CA-3:** Dado un visitante sin sesión, cuando consulta `GET /api/acerca`, entonces recibe 401 con un JSON de error.

## Reglas de negocio

- **RN-1:** El contenido es fijo en el código del módulo; no se guarda en la BD.

## Fuera de alcance

- Editar el contenido desde la interfaz.
- Cualquier cambio en el núcleo (`proxy.ts`, `src/lib/`, layout del tablero).

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/acerca/` (`schema.ts`, `service.ts`, `menu.ts`, `__tests__/`) · página `src/app/(tablero)/acerca/page.tsx` · API `src/app/api/acerca/route.ts`.
- Endpoint: `GET /api/acerca` (se agrega a `contracts/openapi.yaml`).
- Datos: sin tablas, sin migración y sin semilla.
- Puntos de extensión: `menu.ts`.

## Dependencias

- HU 1a (#1) y HU 1b (#2).

## Preguntas abiertas

- Ninguna.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.

## Criterios numerados

- CA-1: Dado un usuario autenticado (administrador o técnico), cuando consulta `GET /api/acerca`, entonces recibe 200 con un JSON que contiene `nombre` y `version`.
- CA-2: Dado un técnico autenticado, cuando abre el tablero, entonces ve el ítem "Acerca de" en el menú, y al entrar a `/acerca` ve el nombre y la versión de la app.
- CA-3: Dado un visitante sin sesión, cuando consulta `GET /api/acerca`, entonces recibe 401 con un JSON de error.
