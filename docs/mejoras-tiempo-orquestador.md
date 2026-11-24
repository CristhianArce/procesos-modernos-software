# Propuestas para reducir el tiempo del orquestador

Origen: comparación de la HU 6 (#23, flujo anterior, 9 min 12 s) con la HU 7 (#24, rama `refactor-orquestador`, 8 min 37 s). Son historias distintas y hay una corrida de cada una, así que los números orientan pero no prueban.

## Qué mejoró y qué no

| Paso | HU 6 | HU 7 | Cambio |
|---|---|---|---|
| 1 Preparar | 49 s | 21 s | −57% |
| 3 Propuesta | 3 min 34 s | 2 min 08 s | −40% |
| 4 Revisar propuesta | 1 min 07 s | fuera del camino crítico | ~−100% |
| 5 Implementar | 1 min 59 s | 3 min 44 s | +88% |
| 6 Verificar | 53 s | 1 min 14 s | +40% |
| 8 Commit y PR | 45 s | 1 min 04 s (incompleto) | +42% |
| Total | 9 min 12 s | 8 min 37 s | −6% |

Las mejoras vienen de `preparar.mjs`, de `contexto.mjs` y de lanzar la revisión de la propuesta en segundo plano. Implementar pasó a ser el 43% del total y es donde está el margen.

## Propuestas

### M1. Patrones del módulo más parecido en `contexto.md`
- **Problema:** en la HU 7 hice unas 6 rondas de lectura (repo, handler, tests de integración, contrato, componentes de `ui/`) antes de escribir la primera línea.
- **Cambio:** `contexto.mjs` agrega la sección "Módulo de referencia": rutas de `repo.ts`, `route.ts`, `service.ts`, un `*.int.test.ts` y un test de `ui/` del módulo con más archivos o el más reciente, más los helpers de prueba (`src/test/api.ts`). Solo rutas, no contenido.
- **Efecto esperado:** menos lecturas exploratorias en el paso 5, y también en el 3.
- **Validación:** medir el número de llamadas `Read`/`Glob` antes del primer `Write`.

### M2. Escritura en tandas paralelas en el paso 5
- **Problema:** los archivos independientes (migración, semilla, schema, menú, pruebas de capas distintas) se escriben en llamadas sucesivas.
- **Cambio:** `SKILL.md` del orquestador pide agrupar en un mismo mensaje las escrituras que no dependen entre sí. Orden por dependencia: migración y schema; repo; service; handler, contrato y UI; pruebas e2e.
- **Riesgo:** choca con TDD estricto de `CLAUDE.md` (prueba antes que código). Se mantiene el orden por tarea, pero la prueba y su código van en el mismo mensaje.

### M3. `revisor-reglas` en segundo plano desde que existe el diff
- **Problema:** el paso 6 espera a `revisor-reglas` junto con `build-test`; el paso entero tardó 1 min 14 s, de los cuales el agente fue ~25 s.
- **Cambio:** lanzar `paquete-diff.mjs` y `revisor-reglas` con `run_in_background` apenas se marcan las últimas tareas, mientras corre `build-test`. Recoger el resultado antes del commit.
- **Riesgo:** una corrección posterior invalida la revisión; en ese caso se relanza una vez.

### M4. Paso 8 en menos llamadas
- **Problema:** commit, push, cuerpo del PR, `abrir-pr`, `tiempos.mjs`, `copiar-evidencias.mjs` y el segundo commit son llamadas separadas.
- **Cambio:** un script `cerrar-historia.mjs <n>` que, con `pr-body.md` ya escrito, cree el PR, registre estado, cierre tiempos y copie evidencias en una sola llamada.
- **Efecto esperado:** −15 a −20 s.

### M5. Verificar el flujo con una historia de práctica
- **Problema:** no hay una medición limpia.
- **Cambio:** correr la misma historia `practica` con el flujo anterior y con el nuevo, y guardar los dos `tiempos.md` en `docs/`.

### M6. Agente que escribe las pruebas en paralelo con la implementación
- **Problema:** en la HU 7, 13 de los 22 archivos fueron pruebas, y la sesión las escribió una tras otra junto con el código.
- **Cambio:** agente nuevo `escritor-pruebas` (sonnet, medium), lanzado en segundo plano al cerrar el paso 3 (o el 4), mientras la sesión implementa. Entradas por ruta: specs y `tasks.md` del change, `design.md`, `contexto.md`, el módulo de referencia (M1) y las reglas de pruebas de `CLAUDE.md` §7. Salida: solo archivos `*.test.ts`, `*.int.test.ts` y `e2e/*.spec.ts`, con nombres `#<n> CA-k`.
- **No es el `preparador`:** ese agente corre en el paso 1, antes de que existan las specs.
- **Requisito:** `design.md` debe fijar las firmas públicas (funciones del repo y del servicio, forma de la respuesta, nombres de `data-testid`) para que prueba y código coincidan. Se agrega como regla del paso 3.
- **Reconciliación:** al cerrar el paso 5, `typecheck` y `test:unit` detectan desajustes; la sesión corrige el código, o la prueba si el error está en ella.
- **Alcance:** no toca código de producción ni ejecuta pruebas de integración ni e2e.
- **Efecto esperado:** el paso 5 baja en proporción al tiempo de escribir pruebas, con una mejor independencia entre prueba y código.
- **Validación:** comparar duración del paso 5, número de desajustes de `typecheck` y cobertura de CA en `trazabilidad.md`.

## Orden sugerido
M1, M6 y M3 primero (mayor efecto), luego M4, después M2 y, al final, M5 para confirmar. M2 se vuelve menos necesaria si se aplica M6.

## Dependencia con la rama
M3 reutiliza el patrón de revisión en segundo plano y `paquete-diff.mjs`, y M1 y M4 extienden `contexto.mjs` y `registrar-agente.mjs`. Estos cambios viven hoy en `refactor-orquestador` y no están en `main`.

## Estado

| Propuesta | Estado |
|---|---|
| Pasos 1 y 2 juntos con `preparar.mjs` (paso 1: 49 s → 21 s) | Aplicada |
| Revisión de la propuesta en segundo plano (`--paralelo`) | Aplicada |
| `paquete-diff.mjs` y `revisor-reglas` en `medium` | Aplicada: sin ellos el paso 6 pasó de 1 min 14 s a 2 min 36 s (32 llamadas del agente, 86 s) |
| M6 `escritor-pruebas` en paralelo con la implementación | Aplicada: paso 5 bajó 3 min 44 s → 2 min 43 s (−27%); ahora se lanza tres veces, una por tipo, por medir |
| M1 `referencia.md` | Descartada por ahora: el ahorro estimado (6 a 12% del total) no llega al 20% y la selección automática de archivos falla |
| M2, M3, M4 | Sin aplicar: no hay medición que las respalde |
| M5 | Pendiente: medir con una historia de práctica |

Para medir M6, comparar la duración del paso 5 con la de la HU 7 (3 min 44 s, 22 archivos), el número de desajustes de `typecheck` al unir y las firmas de `pruebas-supuestos.md`.

## Segunda ronda (tras la corrida 3 de la HU 7: 6 min 36 s)

| Propuesta | Estado |
|---|---|
| Hitos de tiempo dentro del paso 5 (`tiempos.mjs hito <n> "<etiqueta>"`: «5 código listo» y «5 pruebas reconciliadas») | Aplicada: separa lo que cuesta escribir el código de lo que cuesta reconciliar las pruebas |
| Errores frecuentes en `escritor-pruebas` (regex con `\w` sobre tildes, texto decorado, ausencias que pasan solas, formato de cifras) | Aplicada: en la corrida 3 la sesión corrigió dos errores de pruebas de los agentes, unos 54 s de reconciliación |
| `test:unit` solo de lo cambiado (`vitest --changed`) | Sin aplicar: ahorra ~25 s pero quita la red de seguridad local |
| Código de producción en agentes paralelos | Sin aplicar: ~20 a 30 s de ahorro estimado con riesgo alto |
| M1 `referencia.md` | Reabierta: las corridas 2 y 3 no hicieron lecturas exploratorias porque el código ya se conocía, así que no miden su valor; hay que probarla con una historia distinta |

Con lo aplicado hasta ahora, la meta de 5 minutos no se alcanza en una repetición de la HU 7; para decidir lo que falta hace falta medir una historia distinta, en frío.
