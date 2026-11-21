# Prueba del agente trazabilidad (tarea 4.1; CA-6)

- **Fecha:** 2026-11-21. Sesión nueva `claude -p --model sonnet`, que lanza el subagente `trazabilidad` (haiku, pasado en la invocación).
- **Entrada:** modo `g2`, `demo`, `<trabajo>` = `.claude/fixtures/trabajo-ejemplo`, `<change>` = `.claude/fixtures/change-ok`.
- **Resultado esperado:** una fila por CA, sin criterios sin cobertura. **Cumple.**

## Salida textual del agente

| Criterio | Tarea | Requisito | Código | Caso | Estado |
|---|---|---|---|---|---|
| CA-1 | 1.1, 1.2, 1.4 | acerca: Consulta de la información de la aplicación | — | sin plan (demo) | Cubierto |
| CA-2 | 1.3 | acerca: Página Acerca de en el menú | — | sin plan (demo) | Cubierto |
| CA-3 | 1.2 | acerca: Acceso sin sesión rechazado | — | sin plan (demo) | Cubierto |

**Huérfanos**
- Ninguno. Todas las tareas (1.1 a 1.4) y los tres requisitos citan un `CA-n`.
- Ninguna tarea ni requisito cita "Derivado: decisión #k", así que no hay referencias a `decisiones.md` que comprobar. La decisión #1 existe, pero el change no la cita.
- Observación, sin afectar al veredicto: el requisito de CA-2 dice "a cualquier usuario autenticado", mientras que CA-2 del issue habla de un técnico autenticado. El escenario sí dice técnico.

**Migración y semilla**
- No aplica. El change no toca esquema de BD ni datos semilla, así que no hace falta tarea de migración `db/migration/V<AAAAMMDDHHmm>__*.sql` ni de semilla.

**Preguntas abiertas**
- Ninguna. La única pregunta (#1, "¿De dónde sale la versión?") está en estado `resuelta` (Decisión #1).

**Planes**
- No aplica en demo.

Veredicto: Trazabilidad completa
