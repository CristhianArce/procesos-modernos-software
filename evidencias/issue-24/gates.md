# Puertas

## Revisión de la propuesta — intento 1

Veredicto: APROBADO

| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | WARNING | proposal.md (página `/notificaciones`) y tasks.md 5.3 | El proposal promete «cargando, error y vacío»; las tareas cubren error y vacío, no el estado de carga (`Cargando`, `loading.tsx`). | Agregar `loading.tsx` con `Cargando`, o quitar «cargando» del proposal y justificarlo. |
| 2 | SUGGESTION | tasks.md 4.3 | La verificación del contrato depende de la prueba 6.1, de un grupo posterior. | Opcional: mover la prueba del contrato al grupo 4. |

Resolución: el WARNING 1 se corrige en proposal.md (se quita «cargando» y se justifica: Server Component sin cliente). La SUGGESTION 2 se mantiene.
