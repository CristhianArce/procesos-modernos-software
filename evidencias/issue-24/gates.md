# Puertas

## Revisión de la propuesta — intento 1

Veredicto: APROBADO

| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | specs/centro-notificaciones/spec.md | El escenario «Notificación nueva tras recargar» (decisión #3) no tiene prueba propia; el único e2e solo lee la semilla. No es un CA, no bloquea. | Opcional: cubrirlo con una prueba de integración que inserte una fila y vuelva a consultar. |

Resolución: sin cambios; la sugerencia se mantiene.
