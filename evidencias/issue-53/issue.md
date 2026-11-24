# Issue #53: HU 13: Marcar una notificación como leída

Estado: OPEN
Etiquetas: historia, clase

## Historia

Como técnico quiero marcar una notificación como leída para saber cuáles avisos ya atendí.

## Contexto

**HU 13: Marcar una notificación como leída**, fila 13 de [la propuesta](../propuesta.md), §5.
Esta historia sale de dividir la HU 7 ([#24](https://github.com/CristhianArce/procesos-modernos-software/issues/24), "Consultar y marcar como leídas las notificaciones") en dos: la HU 7 conserva la tabla, la consulta y la página del centro de notificaciones, y aquí queda el marcado como leída. CA-1 es el CA-2 de #24; CA-2 es la mitad de CA-3 de #24 (marcar una ajena); CA-3 es la mitad de CA-4 de #24 (el `PATCH` sin sesión) y CA-4 es el CA-5 de #24.
Se construye sobre la tabla `notificaciones`, el módulo y la página de la HU 7 y se prueba con notificaciones de la semilla y con las que insertan las propias pruebas. Los usuarios y la sesión de la HU 3 se reutilizan como están implementados, sin modificarlos.

## Criterios de aceptación

- **CA-1:** Dada una notificación no leída, cuando el técnico la marca como leída, entonces deja de contarse entre las no leídas y sigue en la lista.
- **CA-2:** Dados dos técnicos, cuando uno intenta marcar como leída una notificación del otro, entonces recibe 404 y la notificación no cambia.
- **CA-3:** Dado un visitante sin sesión, cuando intenta marcar una notificación como leída por la API, entonces recibe 401 en JSON.
- **CA-4:** Dado un identificador de notificación con formato inválido, cuando se intenta marcar como leída, entonces la API responde 400 por la validación de Zod.

## Reglas de negocio

- **RN-1:** El destinatario se toma de la sesión, nunca de un dato enviado por el cliente.
- **RN-2:** Solo los técnicos marcan notificaciones; los administradores no reciben ni consultan notificaciones (RN-4 de la HU 7).
- **RN-3:** Las notificaciones se marcan como leídas una por una y la lista se actualiza al recargar o navegar.
- **RN-4:** Marcar como leída una notificación que ya lo está no cambia nada y no es un error.

## Fuera de alcance

- Crear la tabla, consultar la lista y la página del centro (lo cubre la HU 7).
- Crear notificaciones a partir de alertas reales (lo cubre la HU 12).
- Marcar todas las notificaciones como leídas a la vez.
- Marcar una notificación como no leída de nuevo.
- Borrar notificaciones.
- Actualización periódica o en tiempo real de una página ya abierta.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/notificaciones/` (el de la HU 7) · API `src/app/api/notificaciones/`. Esta historia agrega el `PATCH` y el botón "Marcar como leída" en la página del centro, sin editar el resto de la página de la HU 7.
- Endpoint sugerido: `PATCH /api/notificaciones/{id}` (se agrega a `contracts/openapi.yaml`).
- Datos: sin migración ni semilla propias; escribe la columna de leída de la tabla de la HU 7. SQL solo en `repo.ts`.
- Roles y seguridad: `sessionFromRequest(req)`, `requireRole(sesion, "tecnico")` y `conHttp`. Una notificación ajena responde 404 (CA-2), sin revelar que existe ni cambiar su estado.
- Pruebas: la semilla de la HU 3 trae un solo técnico, así que las pruebas de integración de CA-2 crean ellas mismas el segundo técnico y sus notificaciones.
- Puntos de extensión: ninguno.

### E2E futuro (no ejecutado)

Preparación: aplicación y BD de prueba migradas, con la semilla de la HU 3 y la de la HU 7. El número de no leídas esperado se fija a partir de la semilla antes del recorrido, sin usar la consulta de producción como oráculo.

1. Iniciar sesión como `tecnico`, abrir el centro y marcar como leída una no leída: sigue en la lista y el contador baja en uno.
2. Recargar: el estado y el contador se conservan.

Cobertura del recorrido: **CA-1**. **CA-2**, **CA-3** y **CA-4** se cubren con pruebas de integración del handler.

## Dependencias

- HU 7 ([#24](https://github.com/CristhianArce/procesos-modernos-software/issues/24)): tabla `notificaciones`, consulta y página del centro de notificaciones.
- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20)): usuarios, roles y sesión.
- Sin dependencia de la HU 4 ni de la HU 5.

## Preguntas abiertas

Ninguna. RN-4 es consecuencia natural de CA-1 y no cambia ningún criterio.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.

## Criterios numerados

- **CA-1:** Dada una notificación no leída, cuando el técnico la marca como leída, entonces deja de contarse entre las no leídas y sigue en la lista.
- **CA-2:** Dados dos técnicos, cuando uno intenta marcar como leída una notificación del otro, entonces recibe 404 y la notificación no cambia.
- **CA-3:** Dado un visitante sin sesión, cuando intenta marcar una notificación como leída por la API, entonces recibe 401 en JSON.
- **CA-4:** Dado un identificador de notificación con formato inválido, cuando se intenta marcar como leída, entonces la API responde 400 por la validación de Zod.
