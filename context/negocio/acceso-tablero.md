# acceso-tablero

Comportamiento ya especificado: `vigente` (en `openspec/specs/`) o `en curso` (en un change sin archivar). Cada requisito va con su texto completo y los nombres de sus escenarios; si una versión en curso reemplaza a la vigente, queda la más reciente. Si la historia cambia uno, su delta usa `## MODIFIED Requirements` con el nombre exacto.

<!-- entrada: proposito -->
Fija el control de acceso base del tablero: las páginas sin sesión llevan al login y la API protegida responde errores JSON en lugar de redirigir, para que cada historia solo declare qué rol exige.
<!-- fin -->

<!-- entrada: requisito: Páginas del tablero redirigen sin sesión -->
- **Páginas del tablero redirigen sin sesión** (vigente): Las páginas del tablero SHALL redirigir a `/login` a un visitante sin sesión válida (CA-6).
  - Escenarios: Visitante sin sesión abre el tablero (CA-6); Sesión con firma inválida (CA-6)
<!-- fin -->

<!-- entrada: requisito: API protegida responde 401 y 403 en JSON -->
- **API protegida responde 401 y 403 en JSON** (vigente): Una ruta `/api/...` protegida SHALL responder 401 en JSON, sin redirección, cuando no hay sesión válida, y 403 en JSON cuando la sesión no tiene el rol exigido (CA-6).
  - Escenarios: API protegida sin sesión (CA-6); Rol insuficiente (CA-6)
<!-- fin -->
