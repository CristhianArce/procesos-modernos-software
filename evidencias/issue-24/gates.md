## Revisión de la propuesta — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | design.md / tasks.md 6.1 | La interfaz no menciona de forma explícita el foco visible ni la operabilidad con teclado de la lista. Es una lista de solo lectura, así que el riesgo es bajo. | Añadir una línea en 6.1 o en design.md que diga que la lista no introduce controles propios y que los estados usan texto y forma además de color. |

Comprobaciones: `openspec validate --strict` válido; formato de specs correcto; trazabilidad sin vacíos; contexto, preguntas, tareas, migración, alcance y coherencia sin hallazgos.
