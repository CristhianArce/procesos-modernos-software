# Preguntas

Estados: `abierta` (sin responder), `respondida` (Respuesta: `<respuesta> (decisión #k)`) y `diferida` (Respuesta: `supuesto: <opción> (decisión #k)`, con `Revisar: sí` en la decisión).

| # | Tipo | Pregunta | Estado | Respuesta |
|---|---|---|---|---|
| 1 | Negocio | CA-1/CA-2: qué debe hacer la API si el destino pedido ya es el estado actual del nodo (aislar un nodo ya desconectado o reconectar uno ya conectado); el issue retiró la "respuesta de repetición no publicada" y no la fija — opciones: éxito idempotente (200 con el estado actual) / conflicto (409) | respondida | éxito idempotente: 200 con el estado actual (decisión #1) |
