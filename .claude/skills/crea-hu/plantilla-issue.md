## Historia

Como <rol> quiero <acción> para <beneficio>.

## Contexto

<2 a 4 líneas: por qué importa, qué existe hoy y qué cambia. Citar la fila de la propuesta (HU <N>).>

## Criterios de aceptación

- **CA-1:** Dado <contexto>, cuando <acción>, entonces <resultado observable>.
- **CA-2:** Dado <contexto>, cuando <acción>, entonces <resultado observable>.
- **CA-3:** Dado <contexto con dato inválido o rol incorrecto>, cuando <acción>, entonces <error, mensaje o código HTTP>.

## Reglas de negocio

- **RN-1:** <cálculo, umbral, estado posible o restricción que no sea ya un criterio>.

## Fuera de alcance

- <lo que esta historia no hace>.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/<modulo>/` · página `src/app/(tablero)/<modulo>/` · API `src/app/api/<modulo>/`.
- Endpoints sugeridos: `<MÉTODO> /api/<modulo>/...` (se agregan a `contracts/openapi.yaml`).
- Datos: <tablas nuevas o columnas; migración Flyway sí/no; semilla `db/seed/<modulo>.sql` sí/no>.
- Puntos de extensión: <`menu.ts` / `paneles.ts` de la ficha del nodo / `on-alerta.ts` / ninguno>.

## Dependencias

- <HU <k> (#<issue>) o "Ninguna además de la línea base">.

## Preguntas abiertas

- <pregunta> — opciones: <a> / <b>. (Si no hay, escribir "Ninguna".)

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
