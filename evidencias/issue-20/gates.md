# Puertas

## G2 — intento 1

Veredicto: CORREGIR

| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | CRITICAL | .flujo/issue-20/decisiones.md | La tabla está vacía (solo la cabecera). `tasks.md` y `specs/inicio-de-sesion/spec.md` citan `Derivado: decisión #1` a `#13` (por ejemplo tareas 1.1, 3.1, 4.3, 6.1, 6.3, 8.1, 8.2 y todos los requisitos de la spec). Ninguna de esas filas existe. `preguntas.md` también está vacío. Los números salen de la lista «Decisions» de `design.md`, que no sustituye a `decisiones.md`. | Registrar en `decisiones.md` una fila por cada `#k` citado (#1 a #10 y #13 se citan en tasks y specs; #11 y #12 solo en proposal y design). Cada fila lleva fase, decisión, quién decidió, evidencia y alternativa descartada. Si algún `#k` no se registra, quitarlo de tasks y specs, o citar el CA o la fila que sí exista. |
| 2 | WARNING | .flujo/issue-20/contexto.md | `design.md` apoya el change en piezas existentes que `contexto.md` no lista: `src/lib/session.ts` (`ROLES`, `COOKIE_SESION`, `DURACION_SESION_S`, `firmarSesion`), `src/lib/dal.ts`, `src/lib/http.ts` (`conHttp`), `src/lib/db.ts`, `src/proxy.ts` y `src/__tests__/contrato.test.ts`. Los confirmé en disco. La sección «Módulos» solo muestra `inicio`. `contexto.md` tampoco menciona la migración `V202611211900__linea_base.sql`, que la sección «Tablas» no recoge. Además lista como «Changes activos» a `configuracion-ia-sdd` y `herramientas-desarrollo`, y en cambio no lista `inicio-sesion-con-roles`. | Regenerar `contexto.md` con esas piezas, o dejar en `decisiones.md` la evidencia de que son núcleo ya verificado. No es bloqueante si el punto 1 queda resuelto con evidencia en las filas #8 y #2. |

Lo demás cumple:
- `openspec validate inicio-sesion-con-roles --strict --type change --no-interactive` termina con código 0 e imprime `Change 'inicio-sesion-con-roles' is valid`.
- Formato de la spec correcto: `## Purpose` con texto real, `SHALL`/`MUST`, `**WHEN**`/`**THEN**` y `### Requirement:` / `#### Scenario:` en inglés.
- La trazabilidad que recibí no tiene huecos: `sinCobertura` y el resto de listas vacías. Los 7 CA tienen escenario y tarea.
- `tasks.md`: cada tarea trae su verificación en la misma línea. Cada grupo lleva sus pruebas. El contrato va en el grupo del handler (6.3). El grupo 8 es solo integración y aceptación. Abrir el PR, esperar el CI, correr e2e contra la app y archivar están en `## Workflow follow-up`, sin casilla.
- La migración `V202611221930` es solo hacia adelante, compatible hacia atrás y posterior a `linea_base`.
- No hay capacidad existente que el change deba modificar: `acceso-tablero` no está en `openspec/specs/`, y `proposal.md` lo explica.
- La prueba `src/__tests__/contrato.test.ts` que cita la tarea 6.3 existe.

## G2 — intento 2

Veredicto: APROBADO

| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | SUGGESTION | specs/inicio-de-sesion/spec.md (Requisito «Credenciales incorrectas sin pistas») | El requisito dice que los registros del servidor no incluyen contraseñas ni tokens, pero ningún escenario ni tarea lo verifica de forma explícita. `conHttp` ya evita registrar cuerpos, así que no bloquea. | Opcional: en la tarea 6.1, afirmar que el registro del handler no contiene la contraseña enviada. |

Comprobaciones hechas en este intento:
- `openspec validate inicio-sesion-con-roles --strict --type change --no-interactive` terminó con código 0 e imprimió `Change 'inicio-sesion-con-roles' is valid`.
- Formato de specs correcto (encabezados, `SHALL`/`MUST` y `**WHEN**`/`**THEN**` en inglés; cuerpo en español; `## Purpose` con texto real).
- Trazabilidad: CA-1 a CA-7 tienen requisito, escenario y tarea.
- `contexto.md` y `decisiones.md`: las filas #1 a #13 existen y todo `Derivado: decisión #k` tiene su fila; el núcleo citado existe en disco.
- `tasks.md` agrupado por capa, con pruebas por grupo, contrato en el grupo del handler (6.3), grupo 8 solo de integración y aceptación, y el flujo del PR en `## Workflow follow-up`.
- La migración es hacia adelante y compatible hacia atrás.

Resuelto por el orquestador: la sugerencia se incorporó a la tarea 6.1.
