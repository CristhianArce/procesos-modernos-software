## Historia

Como administrador quiero asignar un técnico a un nodo, y como técnico registrar los mantenimientos que hago, para saber quién responde por cada nodo y qué se ha hecho en él.

## Contexto

**HU 10: Registrar mantenimiento y asignar un técnico a un nodo**, fila 10 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#27](https://github.com/CristhianArce/procesos-modernos-software/issues/27); documento canónico: `docs/backlog/hu-10-registrar-mantenimiento-y-asignar-un-tecnico-a-un-nodo.md` ([main fijado](https://github.com/CristhianArce/procesos-modernos-software/blob/6134fcef5867ad08149450e024b5069a3a761843/docs/backlog/hu-10-registrar-mantenimiento-y-asignar-un-tecnico-a-un-nodo.md)).
Se conservan los seis CA publicados. El refinamiento documenta en un mismo recorrido la asignación por administrador y el registro persistente por el técnico asignado.
La historia reúne asignación por administrador y registro por el técnico asignado en una red eléctrica simulada, sin control de equipos reales. Roles, nodos y usuarios de HU 3/HU 4 son dependencias pendientes de implementación/validación, no entregas aceptadas.

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
- Fijar cardinalidad, campos adicionales o tratamiento de autoría histórica por inferencia.
- Implementar funcionalidades o contratos propietarios de otras historias.

## Notas técnicas (no vinculantes)

- Módulo `src/modulos/mantenimiento/`, panel propio mediante `paneles.ts` en la ficha de HU 4. Endpoints sugeridos oficiales: `PUT /api/mantenimiento/nodos/{id}/tecnico` y `GET|POST /api/mantenimiento/nodos/{id}/registros`, documentados posteriormente en `contracts/openapi.yaml`.
- Roles en servidor: asignación por `administrador`, con `sessionFromRequest(req)`, `requireRole(sesion, "administrador")` y `conHttp`; registro por `tecnico` comprobando además su asignación real al nodo en el servicio. El literal oficial `admin` se adapta al rol real, no se usa como alias nuevo. Un técnico válido no asignado recibe 403 y no guarda datos, según CA-4; ocultar un control no sustituye el permiso. La lectura y visibilidad del panel reutilizan los contratos de la línea base que se verifiquen, sin inventar otra matriz.
- Datos y propiedad: tablas propias para asignaciones y registros, migración Flyway propia y semilla `db/seed/mantenimiento.sql`. Se consultan nodos y usuarios de HU 4/HU 3 sin modificarlos. Tipos, nombres de columnas y validación real se concretan con sus contratos; no se inventan UUID ni límites de descripción. El registro tiene fecha y descripción según CA-3/CA-5; tipo/estado adicionales siguen pendientes.
- Datos conocidos para la prueba: administrador A, técnicos T1/T2 y nodo ficticio N0 de HU 3/HU 4, con N0 inicialmente sin asignación ni mantenimientos. El caso usa dos registros ficticios, M1 = `Inspección demo 01` y M2 = `Inspección demo 02`, con fechas fijas válidas F1 < F2 elegidas conforme al contrato real. Antes del caso se declara el historial esperado `[M2, M1]`, sin usar el ordenador de producción como oráculo. El responsable de HU 10 debe confirmar la representación y semántica de fecha/orden; no se inventan columnas ni formatos. Este caso solo necesita una asignación.
- **Recomendación pendiente:** conservar la autoría y las fechas históricas de cada mantenimiento al cambiar la asignación. Es una recomendación, no una RN aprobada, un requisito añadido ni un comportamiento que el E2E dé por decidido; PA-4 mantiene abiertas las opciones oficiales.
- Integración y estado: el registro actual recibe `nodoId` pero no filtra paneles por rol; el componente verifica sesión y permisos en servidor. SQL solo en `repo.ts`, Zod, servicio y handlers delgados; sin Server Actions, librerías nuevas o cambios al núcleo ni a la ficha de HU 4. Checkout y árbol remoto fijado todavía carecen de login, nodos y usuarios de dominio implementados; los fixtures no prueban esos contratos. No se implementa ninguna dependencia ni se ejecuta ninguna prueba.

### E2E futuro (no ejecutado)

Usar aplicación, servidor/API y BD de prueba reales, migrados y con los datos conocidos anteriores; autenticación real en sesiones separadas. HU 3 debe aportar identidad y técnicos de prueba, HU 4 la ficha y el nodo, y HU 10 sus datos propios con el contrato de fecha/orden acordado.

1. A abre la ficha de N0, asigna T1 por el panel y comprueba que aparece. Recargar y verificar la asignación persistida.
2. T1 inicia una sesión real, abre la misma ficha y registra M1 con F1 y M2 con F2 mediante el formulario de fecha y descripción ya previsto. Comprobar los dos registros y el orden temporal esperado `[M2, M1]`. Volver a la ficha o recargar: ambos permanecen y T1 continúa asignado.
3. T2, técnico válido no asignado, intenta por la API registrar un mantenimiento con datos válidos: recibe 403 y el historial conserva exactamente M2/M1, sin una entrada nueva.

Cobertura principal diseñada: **CA-1, CA-3 y CA-4**. **CA-2** conserva pruebas específicas de usuario no técnico → 400 y usuario inexistente → 404, sin alterar la asignación; **CA-5**, descripción vacía/fecha inválida → 400; **CA-6**, nodo inexistente → 404 en asignar/registrar. Mantener complementariamente los controles generales de sesión y permiso de asignación con handlers/BD reales. No se añaden múltiples asignados, recordatorios o campos nuevos, ni se ejercita una reasignación que dé por resuelta la autoría histórica. Sin mocks, código implementado ni pruebas ejecutadas.

## Dependencias

- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20): usuarios/roles) y HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21): nodos), dependencias expresas de #27.
- Entorno real de aplicación/BD aislada y registro de paneles de la línea base; su disponibilidad se valida, no se da por satisfecha mediante los fixtures del flujo.
- Sin dependencias de HU 6, HU 7, HU 8 o HU 9.

## Preguntas abiertas

- **PA-1:** ¿Un nodo puede tener varios técnicos? — opciones oficiales: uno / varios. CA-1 asume uno; el E2E usa un caso con una asignación, sin cerrar cardinalidad. Un cambio requiere revisar asignación y CA-4 con el equipo y el responsable de HU 10.
- **PA-2:** ¿Quién puede registrar? — opciones oficiales: solo asignado / cualquier técnico / también administrador. CA-3/CA-4 publicadas asumen solo el asignado y se conservan; ninguna alternativa queda aprobada por aparecer aquí. Lo resuelven el equipo y el responsable de HU 10.
- **PA-3:** ¿Qué datos lleva el mantenimiento? — opciones oficiales: fecha y descripción / también tipo y estado. No se añaden campos ni validaciones de negocio sin acuerdo. Lo resuelven el equipo y el responsable de HU 10.
- **PA-4:** ¿Cambiar el técnico conserva el historial con quien lo realizó o lo reasigna? — opciones oficiales: conservar / reasignar. Se recomienda conservar autoría, separadamente y sin convertir la recomendación en regla aprobada. Lo resuelven el equipo y el responsable de HU 10.
- **PA-5:** ¿Qué contratos reales de HU 3/HU 4 habilitan identidad y rol del técnico, existencia del nodo, montaje del panel y datos de prueba? — opciones: reutilizar la implementación cuando exista / coordinarla antes con los propietarios. Validar también fecha y orden del historial; no se atribuye aceptación ni se inventa un esquema persistido. Lo coordinan los responsables de HU 3/HU 4 con el de HU 10; este último concreta la fecha y el orden de sus registros.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
