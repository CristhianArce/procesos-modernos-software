# Verificación

## Build

`node .claude/skills/build-test/scripts/build-test.mjs 21`: **BUILD SUCCESS** (`typecheck`, `test:unit`, `test:integration`). Log: `.flujo/issue-21/build-20261122-163948.log`.

- Migraciones aplicadas en la BD de la corrida: `202611211900`, `202611221930` y `202611222130 - nodos sensores lecturas`.
- Semillas aplicadas: `auth.sql`, `nodos.sql` y `sensores.sql`.
- Integración: 18 archivos, 95 pruebas en verde. Unitarias: 25 archivos, 141 pruebas en verde.
- `openspec validate nodos-sensores-y-simulador --strict --type change --no-interactive`: válido.

## Trazabilidad

Pruebas: 7 de 7 CA con prueba

## Revisor de reglas

Veredicto: listo · CRITICAL: 0 · WARNING: 0 · SUGGESTION: 4

| # | Severidad | Archivo | Hallazgo | Estado |
|---|---|---|---|---|
| 1 | SUGGESTION | src/modulos/sensores/service.ts (`crearSensor`) | Si el nodo se borra entre comprobarlo e insertar el sensor, la FK falla y responde 500 en vez de 404. La ventana es mínima. | No corregido: se informa en el PR |
| 2 | SUGGESTION | src/modulos/simulador/service.ts (`simular`) | Usa `listarSensores`, que también consulta la última lectura, y el simulador no la usa: una consulta extra por simulación. | No corregido: se informa en el PR |
| 3 | SUGGESTION | src/modulos/sensores/ui/FormularioSensor.tsx y src/modulos/simulador/ui/BotonSimular.tsx | Importan `enviarJson` desde `@/modulos/nodos/ui/enviar-json`: dependen de la UI de otro módulo. `src/lib/` no se puede editar. | No corregido: se informa en el PR |
| 4 | SUGGESTION | src/modulos/simulador/generador.ts (`generarLectura`) | Cuando una lectura sale de umbral, la potencia deja de ser voltaje × corriente; falta un comentario que lo diga. | No corregido: se informa en el PR |

El revisor contó además 9 archivos modificados en `docs/backlog/` (HU 4 a HU 12). No los escribió esta corrida y no entran en el commit de la historia.

## Paso 7

No corrió: no hay `CRITICAL` y el build está en verde.
