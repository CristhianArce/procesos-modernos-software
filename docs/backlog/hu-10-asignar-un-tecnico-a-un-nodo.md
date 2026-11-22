## Historia

Como administrador quiero asignar un técnico a un nodo para saber quién responde por cada nodo.

## Contexto

**HU 10: Asignar un técnico a un nodo**, fila 10 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#27](https://github.com/CristhianArce/procesos-modernos-software/issues/27).
Esta historia sale de dividir la HU 10 original ("Registrar mantenimiento y asignar un técnico a un nodo") en dos: aquí queda la asignación por el administrador y en la HU 11 el registro de mantenimientos por el técnico. CA-1 y CA-2 son los publicados; CA-3 es la mitad de asignación del CA-6 original y CA-4 hace explícito el permiso de asignación que antes solo estaba en las notas técnicas.
La red eléctrica es simulada, sin control de equipos reales. Los roles y usuarios de la HU 3 y los nodos y la ficha de la HU 4 son dependencias: se reutilizan como estén implementados, sin modificarlos.

## Criterios de aceptación

- **CA-1:** Dado un nodo y un administrador, cuando asigna un técnico al nodo, entonces el panel de la ficha muestra al técnico asignado.
- **CA-2:** Dado un usuario que no es técnico o que no existe, cuando el administrador intenta asignarlo a un nodo, entonces la API responde 400 si no es técnico y 404 si no existe, y la asignación no cambia.
- **CA-3:** Dado un identificador de nodo que no existe, cuando el administrador asigna un técnico, entonces la API responde 404.
- **CA-4:** Dado un usuario con rol técnico, cuando intenta asignar un técnico a un nodo, entonces la API responde 403 y la asignación no cambia.

## Reglas de negocio

- **RN-1:** Solo un usuario con rol técnico puede asignarse a un nodo.
- **RN-2:** El panel se enchufa por `paneles.ts`: no se edita la página de la ficha de la HU 4.

## Fuera de alcance

- Registrar mantenimientos y mostrar su historial (lo cubre la HU 11).
- Notificar al técnico de su asignación (la HU 7 solo cubre alertas de umbral).
- Fijar la cardinalidad por inferencia: mientras PA-1 siga abierta, el caso de prueba usa una sola asignación.
- Decidir qué pasa con el historial de mantenimientos al cambiar el técnico (pregunta abierta de la HU 11).
- Implementar funcionalidades o contratos propietarios de otras historias.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/mantenimiento/` · API `src/app/api/mantenimiento/`. Esta historia crea el módulo y su panel; la HU 11 los extiende.
- Endpoint sugerido: `PUT /api/mantenimiento/nodos/{id}/tecnico` (se agrega a `contracts/openapi.yaml`).
- Autorización en servidor: `sessionFromRequest(req)` + `requireRole(sesion, "administrador")` dentro del handler, con el envoltorio `conHttp`. El literal `admin` de la propuesta se adapta al rol real; no se crea un alias. Ocultar el control en el panel no sustituye el permiso.
- Datos: tabla propia de asignaciones, migración Flyway propia y semilla `db/seed/mantenimiento.sql`. Se consultan `nodos` y `usuarios` de las HU 4 y HU 3 sin modificarlos. Tipos y nombres de columnas se concretan con esos contratos; no se inventan.
- Puntos de extensión: `paneles.ts` de la ficha del nodo. El registro de paneles recibe `nodoId` y no filtra por rol: el componente verifica sesión y permisos en el servidor.
- SQL solo en `repo.ts`, Zod, servicio y handlers delgados; sin Server Actions, librerías nuevas ni cambios al núcleo.

### E2E

Aplicación, API y BD de prueba reales, migradas y con datos conocidos: administrador A, técnico T1 y nodo ficticio N0 (de las HU 3 y HU 4), con N0 inicialmente sin asignación.

1. A abre la ficha de N0, asigna T1 por el panel y comprueba que aparece como técnico asignado.
2. A recarga la ficha: T1 sigue asignado.

Cubre **CA-1**. **CA-2** (usuario no técnico → 400, inexistente → 404), **CA-3** (nodo inexistente → 404) y **CA-4** (técnico → 403) se prueban con pruebas de integración de los handlers, comprobando que la asignación no cambia.

## Dependencias

- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20): usuarios y roles) y HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21): nodos, ficha y registro de paneles).
- Sin dependencias de las HU 6 a 9. La HU 11 ([#43](https://github.com/CristhianArce/procesos-modernos-software/issues/43)) depende de esta.

## Preguntas abiertas

- **PA-1:** ¿Un nodo puede tener varios técnicos? — opciones: uno / varios. CA-1 asume uno. Cambiarlo obliga a revisar esta historia y el CA-2 de la HU 11.
- **PA-2:** ¿Qué contratos reales de las HU 3 y HU 4 dan la identidad y el rol del técnico, la existencia del nodo y el montaje del panel? — opciones: reutilizar la implementación cuando exista / coordinarla antes con sus responsables.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
