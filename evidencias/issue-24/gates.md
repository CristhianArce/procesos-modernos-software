## Revisión de la propuesta — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | WARNING | tasks.md, tarea 4.3 | La verificación del contrato es condicional y vaga: «con `npx vitest list` si hay una prueba del contrato». | Fijar una verificación concreta, por ejemplo el `grep` de la ruta y los esquemas más `npm run typecheck`, sin el «si hay». |
| 2 | WARNING | tasks.md, tarea 5.3 | La página solo se verifica con la e2e de 7.2, y esa tarea se verifica únicamente con `npx playwright test --list`. Es un grupo posterior, no el de la página. | Aceptable por la regla de Playwright de CLAUDE.md §7. Conviene que 5.3 diga que se verifica con `npm run typecheck` y con el `data-testid` que la e2e de 7.2 comprueba. |
| 3 | SUGGESTION | proposal.md, Impact | Lista `src/modulos/notificaciones/schema.ts`, pero design.md dice que no hay esquema Zod de entrada y ninguna tarea lo crea. | Quitar `schema` de la lista de archivos nuevos del Impact. |

Criterios revisados: validador en verde; trazabilidad-grep con todos los campos vacíos; formato de la spec correcto; contexto, capacidades, decisiones y preguntas coherentes; tasks.md con pruebas por grupo, verificación en cada tarea y PR/archivado como viñetas.
