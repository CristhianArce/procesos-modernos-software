## Historia

Como administrador quiero asignar un técnico a un nodo, y como técnico registrar los mantenimientos que hago, para saber quién responde por cada nodo y qué se ha hecho en él.

## Contexto

Es la HU 10 de la propuesta (sección 5), historia de clase. Los nodos (HU 4) y los usuarios con rol técnico (HU 3) ya existen, pero no hay relación entre ellos ni historial de mantenimiento. Esta historia agrega un panel a la ficha del nodo, mediante `paneles.ts`, y tablas propias para la asignación y los mantenimientos. Lee `nodos` y `usuarios` sin modificarlas.

## Criterios de aceptación

- **CA-1:** Dado un nodo y un administrador, cuando asigna un técnico al nodo, entonces el panel de la ficha muestra al técnico asignado.
- **CA-2:** Dado un usuario que no es técnico o que no existe, cuando el administrador intenta asignarlo a un nodo, entonces la API responde 400 si no es técnico y 404 si no existe, y la asignación no cambia.
- **CA-3:** Dado un técnico asignado a un nodo, cuando registra un mantenimiento con fecha y descripción válidas, entonces aparece en el historial del nodo con el más reciente primero.
- **CA-4:** Dado un técnico no asignado al nodo, cuando intenta registrar un mantenimiento en él, entonces recibe 403 y no se guarda nada.
- **CA-5:** Dada una descripción vacía o una fecha inválida, cuando se registra un mantenimiento, entonces la API responde 400 por la validación de Zod.
- **CA-6:** Dado un identificador de nodo que no existe, cuando se asigna un técnico o se registra un mantenimiento, entonces la API responde 404.

## Reglas de negocio

- **RN-1:** Solo un usuario con rol técnico puede asignarse a un nodo.
- **RN-2:** El panel se enchufa por `paneles.ts`: no se edita la página de la ficha de la HU 4.

## Fuera de alcance

- Programar mantenimientos futuros o recordatorios.
- Editar o borrar mantenimientos ya registrados.
- Notificar al técnico de su asignación (lo cubre la HU 7 solo para alertas de umbral).

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/mantenimiento/` · panel en la ficha del nodo vía `paneles.ts`.
- Endpoints sugeridos: `PUT /api/mantenimiento/nodos/{id}/tecnico`, `GET|POST /api/mantenimiento/nodos/{id}/registros` (se agregan a `contracts/openapi.yaml`); la asignación exige `requireRole("admin")`.
- Datos: tablas propias para la asignación y los registros de mantenimiento, con migración Flyway; semilla `db/seed/mantenimiento.sql`.
- Puntos de extensión: `paneles.ts`.

## Dependencias

- HU 3 (#20: usuarios y roles) y HU 4 (#21: nodos).

## Preguntas abiertas

- ¿Un nodo puede tener varios técnicos? — opciones: uno solo / varios. CA-1 asume uno; con varios se ajusta la asignación y el CA-4.
- ¿Quién puede registrar un mantenimiento? — opciones: solo el técnico asignado / cualquier técnico / también el administrador. CA-3 y CA-4 asumen solo el técnico asignado.
- ¿Qué datos lleva un mantenimiento? — opciones: fecha y descripción / además un tipo (preventivo o correctivo) y un estado.
- ¿Cambiar de técnico conserva el historial? — opciones: sí, los mantenimientos quedan con el técnico que los hizo / se reasignan.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
