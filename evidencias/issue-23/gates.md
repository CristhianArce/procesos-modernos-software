# Puertas

## Revisión de la propuesta — intento 1

Veredicto: APROBADO

| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | tasks.md (tareas 1.1 a 5.2) | Ninguna tarea recuerda la convención de nombre de las pruebas: `it("#23 CA-n: ...")`. No bloquea, porque la regla de CLAUDE.md §7 ya aplica al implementar. | Opcional: mencionar en las tareas de prueba que los nombres citan `#23 CA-n`. |

Criterios revisados: validación estricta de OpenSpec en verde; spec con `## Purpose`, `## ADDED Requirements`, escenarios `**WHEN**`/`**THEN**`; trazabilidad CA-1 a CA-4 sin huecos; tablas y módulos existentes en `contexto.md`; decisiones #1 a #8 con fila; pregunta #1 respondida (decisión #1); cada grupo con sus pruebas, contrato en 4.2, grupo final solo e2e y verificación; sin migraciones; artefactos coherentes entre sí y con el código.
