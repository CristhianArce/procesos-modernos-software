# aislamiento-de-nodos

Comportamiento ya especificado: `vigente` (en `openspec/specs/`) o `en curso` (en un change sin archivar). Cada requisito va con su texto completo y los nombres de sus escenarios; si una versión en curso reemplaza a la vigente, queda la más reciente. Si la historia cambia uno, su delta usa `## MODIFIED Requirements` con el nombre exacto.

<!-- entrada: proposito -->
Permite que un administrador aísle un nodo de la red (lo deja desconectado) y lo reconecte desde su ficha, para cortar el suministro de un tramo con falla sin afectar al resto. Ambas transiciones son simuladas: solo cambian el estado guardado del nodo, sin órdenes a equipos reales.
<!-- fin -->

<!-- entrada: requisito: Aislar y reconectar un nodo -->
- **Aislar y reconectar un nodo** (en curso (aislar-nodo-de-la-red)): La API SHALL cambiar el estado de un nodo a `conectado` o `desconectado` cuando un administrador lo pide, y MUST responder 200 con el identificador y el estado resultante. El cambio SHALL modificar únicamente el estado del nodo indicado y no el de ningún otro nodo (CA-1, CA-2; Derivado: decisión #3, #4).
  - Escenarios: Aislar un nodo conectado (CA-1); Reconectar un nodo desconectado (CA-2); Solo cambia el estado del nodo indicado (CA-1); Un nodo desconectado sigue simulándose (CA-1; Derivado: RN-3)
<!-- fin -->

<!-- entrada: requisito: Repetición y validación del cambio de estado -->
- **Repetición y validación del cambio de estado** (en curso (aislar-nodo-de-la-red)): Si el nodo ya está en el estado pedido, la API MUST responder 200 con ese estado y no cambiar nada. El estado pedido MUST ser `conectado` o `desconectado`: cualquier otro valor, la falta del campo o un cuerpo que no es JSON responde 400 con el detalle y el nodo conserva su estado (CA-1, CA-2; Derivado: decisión #1, #3).
  - Escenarios: El destino ya es el estado actual (CA-1, CA-2); Estado pedido inválido (CA-1; Derivado: decisión #3)
<!-- fin -->

<!-- entrada: requisito: Aislar y reconectar desde la ficha con confirmación -->
- **Aislar y reconectar desde la ficha con confirmación** (en curso (aislar-nodo-de-la-red)): La ficha del nodo SHALL ofrecer a un administrador el botón «Aislar nodo» cuando el nodo está conectado y «Reconectar nodo» cuando está desconectado. Al pulsarlo MUST pedir confirmación antes de llamar a la API, y la persona SHALL poder cancelar sin que cambie nada. Tras confirmar, la ficha SHALL mostrar el nuevo estado sin recargar la página, y el estado SHALL persistir al recargarla (CA-1, CA-2; Derivado: decisión #2, #5, #6).
  - Escenarios: Aislar con confirmación (CA-1); Reconectar con confirmación (CA-2); Cancelar la confirmación (CA-1, CA-2); El estado persiste (CA-1, CA-2)
<!-- fin -->

<!-- entrada: requisito: Solo el administrador cambia el estado de un nodo -->
- **Solo el administrador cambia el estado de un nodo** (en curso (aislar-nodo-de-la-red)): La API MUST responder 403 cuando quien cambia el estado es un técnico, aunque el cuerpo sea inválido, y 401 cuando no hay sesión; en ambos casos el estado de ningún nodo cambia. La ficha MUST NOT mostrar los botones de aislar ni de reconectar a un técnico (CA-3; Derivado: decisión #3, #5).
  - Escenarios: Técnico llama a la API (CA-3); Sin sesión (CA-3); Técnico abre la ficha (CA-3)
<!-- fin -->

<!-- entrada: requisito: Nodo inexistente -->
- **Nodo inexistente** (en curso (aislar-nodo-de-la-red)): La API SHALL responder 404 con el mensaje `Nodo no encontrado` cuando el identificador no corresponde a ningún nodo, incluido uno mal formado, y MUST NOT cambiar el estado de ningún otro nodo (CA-4; Derivado: decisión #3).
  - Escenarios: Identificador que no existe (CA-4); Identificador mal formado (CA-4)
<!-- fin -->
