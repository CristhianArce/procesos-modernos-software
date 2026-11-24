# Design

## Context

La tabla `nodos(id, nombre, ubicacion, estado, creado_en)` y su ficha (`src/app/(tablero)/nodos/[id]/page.tsx`) vienen de la HU 4. `estado` es `conectado` o `desconectado` (nace `conectado`) y el esquema de edición de nodos lo excluye («lo cambia la HU 6»). La ficha ya pinta el indicador «Conexión» desde `nodo.estado` y muestra los paneles de `registro.paneles` (`Sensores` orden 10, `Simulador` orden 20). El núcleo ofrece `sessionFromRequest`, `requireRole`, `sesionActual`, `conHttp` y `esUuid` (en `nodos/schema.ts`, ya usado por `sensores` y `topologia`). Ver `proposal.md` para el motivo.

## Goals / Non-Goals

**Goals:**
- Que un administrador cambie el estado de un nodo desde su ficha, con confirmación, y que la ficha lo muestre sin recargar.
- Que el técnico no pueda hacerlo ni por la interfaz ni por la API.
- Cambiar solo `nodos.estado` y nada más.

**Non-Goals:**
- Auditoría de quién y cuándo cambió el estado (RN-4), notificaciones, operar equipos reales, aislar varios nodos a la vez.
- Que el simulador omita los nodos desconectados (RN-3).
- Editar el módulo `nodos`, la página de la ficha o el núcleo.

## Decisions

1. **Módulo `aislamiento` con una ruta propia** (decisión #3). `PATCH /api/aislamiento/nodos/{id}` con `{ "estado": "conectado" | "desconectado" }`, validado con Zod (`schema.ts`). Responde 200 con `{ id, estado }`. Alternativa descartada: reutilizar `PATCH /api/nodos/{id}`, porque su esquema (HU 4) declara que el estado no se edita ahí y mezclaría dos permisos distintos en una ruta.
2. **Orden de los controles en el handler.** `requireRole(sesion, "administrador")` primero (401 sin sesión, 403 al técnico aunque el cuerpo sea inválido: CA-3), luego Zod (400) y luego el servicio (404). Un id inexistente con un cuerpo inválido responde 400: se valida lo que envía el cliente antes de buscar. El cuerpo se lee con `req.json().catch(() => undefined)` para que un cuerpo que no es JSON sea 400 y no 500.
3. **Una sola sentencia SQL y el estado idempotente** (decisión #4, #1). `repo.cambiarEstado(id, estado)` ejecuta `UPDATE nodos SET estado = $2 WHERE id = $1 RETURNING id, estado` y devuelve `null` si no hay fila. Pedir el estado que ya tiene el nodo reescribe el mismo valor y responde 200 sin lógica extra. No hay lectura previa ni transacción: una sola sentencia es atómica. Es la excepción de RN-5 a la regla de no modificar tablas ajenas: solo esa columna, sin migración. Alternativa descartada: un método en el servicio de `nodos`, que obligaría a la HU 4 a entregar algo que hoy nadie usa (decisión 4 del issue).
4. **Servicio fino.** `service.cambiarEstadoNodo(id, estado)`: si `esUuid(id)` es falso lanza 404 (`Nodo no encontrado`, mismo mensaje que `nodos`) sin consultar la base; si el repo devuelve `null`, 404. Reutiliza `esUuid` de `nodos/schema` (no es `server-only`).
5. **Panel en la ficha por `paneles.ts`** (decisión #5). `paneles = [{ titulo: "Aislamiento", orden: 30, Componente: PanelAislamiento }]`. `PanelAislamiento` es un Server Component: lee `sesionActual()` y, si el rol no es administrador, muestra solo un texto y ningún botón (CA-3). Si lo es, lee el nodo con `buscarNodo` del servicio de `nodos` (única lectura permitida entre módulos) y pinta `ControlAislamiento` con el estado. Ocultar los botones es cosmético: la API exige el rol. No se agrega ítem de menú (`menu.ts`): la historia vive en la ficha.
6. **Confirmación dentro de la ficha** (decisión #2). `ControlAislamiento` (Client Component) tiene tres estados: reposo (botón «Aislar nodo» o «Reconectar nodo»), confirmando («¿Aislar este nodo?» o «¿Reconectar este nodo?» con «Confirmar» y «Cancelar») y enviando. Solo «Confirmar» llama a la API; «Cancelar» vuelve al reposo sin llamarla (RN-2). El texto del aviso explica que el cambio es simulado y no opera equipos. Alternativa descartada: `window.confirm`, que no se puede renderizar a HTML en Vitest y cuyo texto y foco no se controlan.
7. **Actualizar la ficha sin recargar** (decisión #6). Con 200, `startTransition(() => router.refresh())`: Next vuelve a pintar la página de la ficha, de modo que el indicador «Conexión» del encabezado y el propio panel muestran el estado nuevo sin recarga completa. Mientras dura la transición los botones quedan desactivados. Con error de la API se muestra el mensaje en un `role="alert"` y el nodo conserva su estado. Alternativa descartada: copiar el estado en un `useState`, que puede desalinearse del servidor.
8. **`fetch` propio con `PATCH`** (decisión #7). `enviarJson` de `nodos/ui` solo hace `POST` y es de la HU 4; el control hace su propio `fetch` y lee `{ error, detalles }` como lo hace aquel.
9. **Interfaz.** Solo tokens y clases del sistema de diseño (`boton-primario`, `Insignia`/`IndicadorEstado` ya presentes en la ficha, `text-critico` para errores); no se importa Zod en el cliente (`import type` del tipo `EstadoNodo`). Foco visible y botones con texto, sin icono solo.
10. **Contrato.** `contracts/openapi.yaml` suma `PATCH /api/aislamiento/nodos/{id}` con `security: sesion`, cuerpo `EstadoNodoCambiar`, respuesta 200 `EstadoNodoActual` y las respuestas compartidas 400, 401, 403 y 404 ya definidas en `components.responses`, conservando las demás rutas. `src/__tests__/contrato.test.ts` exige cada ruta de `src/app/api` en el contrato.
11. **Pruebas e2e con un nodo propio** (decisión #8): la prueba crea el nodo por la API para no dejar nodos de la semilla aislados.

## Risks / Trade-offs

- [El técnico ve en la ficha un texto en lugar de botones, pero un cliente HTTP puede llamar a la API] → la API exige el rol (403); ocultar es cosmético (decisión #5).
- [Dos administradores cambian el mismo nodo a la vez] → gana la última escritura y ambas respuestas son 200; sin auditoría no se detecta (RN-4, decisión #1).
- [Un nodo aislado sigue recibiendo lecturas simuladas y alertas] → es lo decidido en el issue (RN-3): aislar solo cambia el estado visible.
- [`router.refresh()` vuelve a leer toda la ficha] → la ficha es una página pequeña y dinámica; se acepta por simplicidad.
- [Las pruebas de integración usan la base de desarrollo] → cada prueba crea sus nodos con un prefijo propio y los borra al terminar.

## Migration Plan

Sin migración ni semilla: no hay cambios de esquema. Se despliega con la imagen. Reversa: retirar la imagen; los nodos que quedaron `desconectado` conservan ese estado válido para la HU 4.
