## Historia

Como administrador quiero aislar un nodo de la red desde su ficha para cortar el suministro de un tramo con falla sin afectar al resto.

## Contexto

Hoy la ficha del nodo (HU 4) muestra sus datos y sensores, pero no permite cambiar su estado. La columna `estado` (conectado o desconectado) ya existe en la base. Fila 6 del backlog de la propuesta.

## Criterios de aceptación

- **CA-1:** Dado un nodo conectado y un usuario administrador, cuando pulsa "Aislar nodo" y confirma, entonces el nodo queda en estado "desconectado" y la ficha lo muestra sin recargar la página.
- **CA-2:** Dado un nodo desconectado y un usuario administrador, cuando pulsa "Reconectar nodo" y confirma, entonces el nodo vuelve a "conectado".
- **CA-3:** Dado un usuario técnico, cuando abre la ficha del nodo, entonces no ve los botones de aislar o reconectar, y si llama a la API de cambio de estado recibe 403.
- **CA-4:** Dado un identificador de nodo que no existe, cuando se pide cambiar su estado, entonces la API responde 404 y el estado de los demás nodos no cambia.

## Reglas de negocio

- **RN-1:** Los únicos estados son "conectado" y "desconectado" (propuesta, fila 6).

## Fuera de alcance

- Aislar varios nodos a la vez.
- Notificar a los técnicos del cambio (lo cubre la HU 7 solo para alertas de umbral).

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/aislamiento/` · panel en la ficha del nodo vía `paneles.ts` (no se edita la página de la HU 4).
- Endpoint sugerido: `PATCH /api/aislamiento/nodos/{id}` con cuerpo `{ "estado": "conectado" | "desconectado" }` (Zod), `requireRole("admin")`.
- Datos: actualiza `nodos.estado`, columna que la línea base ya crea para esta historia; sin migración ni semilla.
- Puntos de extensión: `paneles.ts`.

## Dependencias

- HU 4 (#21: CRUD de nodos y sensores, con simulador).

## Preguntas abiertas

- ¿Se pide confirmación antes de aislar? — opciones: diálogo de confirmación / acción directa con opción de deshacer. (CA-1 y CA-2 asumen diálogo; si se decide otra cosa, se ajustan.)
- ¿Un nodo desconectado deja de recibir lecturas del simulador? — opciones: sí, el simulador lo omite / no, solo cambia el estado visible. La propuesta no lo dice; si la respuesta es sí, se agrega un CA.
- ¿Se registra quién y cuándo cambió el estado? — opciones: no / sí, en una tabla propia del módulo (con migración).

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
