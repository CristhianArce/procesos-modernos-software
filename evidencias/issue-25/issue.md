# Issue #25: HU 8: Ver los afectados de un nodo

Estado: OPEN
Etiquetas: historia, clase

## Historia

Como administrador o técnico quiero ver qué usuarios o dispositivos dependen de un nodo para saber a quién afecta una falla o un corte antes de actuar.

## Contexto

**HU 8: Ver los afectados de un nodo**, fila 8 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#25](https://github.com/CristhianArce/procesos-modernos-software/issues/25).
Esta historia sale de dividir la HU 8 original ("Registrar los usuarios o dispositivos afectados por un nodo") en tres: aquí quedan la tabla, la consulta y el panel de solo lectura; la HU 14 ([#54](https://github.com/CristhianArce/procesos-modernos-software/issues/54)) agrega afectados y la HU 15 ([#55](https://github.com/CristhianArce/procesos-modernos-software/issues/55)) los quita. CA-1 es el CA-3 publicado antes; CA-2 es la mitad de lectura del CA-4 y CA-3 es la mitad de consulta del CA-6.
Con el corte, la historia se construye y se prueba con afectados de la semilla y con los que insertan las propias pruebas. Se conserva la definición local acordada: usuarios ficticios asociados, con un alias por asociación, sin contacto, datos personales reales, cuentas de acceso ni catálogo global. La red es simulada: estas asociaciones no calculan impacto eléctrico ni exigen aislamiento.

## Criterios de aceptación

- **CA-1:** Dado un nodo con afectados, cuando se abre su ficha, entonces el panel muestra el total de afectados y su lista.
- **CA-2:** Dado un usuario administrador o técnico, cuando abre la ficha de un nodo, entonces ve el panel con la lista y el total.
- **CA-3:** Dado un identificador de nodo que no existe, cuando se consultan sus afectados, entonces la API responde 404; un nodo existente sin afectados responde una lista vacía y total 0.

## Reglas de negocio

- **RN-1:** Cada afectado pertenece a un solo nodo.
- **RN-2:** El panel se enchufa por `paneles.ts`: no se edita la página de la ficha de la HU 4.
- **RN-3:** Un afectado es un alias ficticio asociado a un nodo. El alias es obligatorio y es su único dato: no hay contacto, tipo, catálogo global ni enlace con cuentas de acceso.
- **RN-4:** Un mismo alias puede repetirse en un nodo: no se valida unicidad.

## Fuera de alcance

- Agregar afectados (lo cubre la HU 14) y quitarlos (lo cubre la HU 15).
- Notificar a los afectados.
- Calcular automáticamente los afectados a partir de la topología de la red.
- Importar afectados desde un archivo.
- Datos personales reales en la demo, inferencia de impacto eléctrico o requisito de aislamiento previo.
- Evitar afectados duplicados en un nodo.

## Notas técnicas (no vinculantes)

- Módulo oficial `src/modulos/afectados/`, panel propio mediante `paneles.ts` en la ficha de la HU 4. Endpoint sugerido: `GET /api/afectados` con el nodo como parámetro; se agrega a `contracts/openapi.yaml`.
- Roles y seguridad: lectura para administrador y técnico, con `sessionFromRequest(req)` y `conHttp`. El registro de paneles no filtra por rol: el componente usa la sesión real.
- Datos y propiedad: tabla propia `nodo_usuarios` con migración Flyway y semilla `db/seed/afectados.sql`. Se lee `nodos` de la HU 4 sin modificarla; la tabla referencia al nodo con borrado en cascada. Se conserva el alias ficticio por asociación (decisiones 1 y 3). SQL solo en `repo.ts`, Zod y handlers delgados; sin Server Actions ni cambios al núcleo o a la página de la HU 4.
- Semilla de prueba: administrador A y técnico T reales de la HU 3; N0 y N1 ficticios de la HU 4. N0 empieza sin afectados (total 0) y N1 contiene `Usuario demo 02` (total 1). Las expectativas fijas se declaran antes de consultar la aplicación.
- Puntos de extensión: `paneles.ts`.

### E2E futuro (no ejecutado)

Preparación: aplicación y BD de prueba reales, migradas y con la semilla conocida descrita arriba; autenticación real.

1. El administrador abre la ficha de N1: el panel muestra total 1 y `Usuario demo 02`.
2. El técnico abre la misma ficha y ve la misma lista y el mismo total. Abre la de N0: total 0 y lista vacía.

Cobertura del recorrido: **CA-1** y **CA-2**. **CA-3** se cubre con pruebas de integración del handler: nodo inexistente → 404, separado del vacío válido.

## Decisiones de la HU 4 que aplican

La HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)) cerró sus preguntas abiertas el 2026-11-22. Lo que sigue es consecuencia de esas decisiones y no cambia los CA de esta historia.

- **Borrado en cascada (decisión 5):** al eliminar un nodo, la HU 4 elimina también sus sensores y lecturas. La tabla `nodo_usuarios` lo referencia con borrado en cascada, para que eliminar el nodo no falle ni deje filas huérfanas.
- **El técnico solo consulta (decisión 6):** la lista y la ficha del nodo las pueden ver el administrador y el técnico.
- **Campos del nodo (decisión 1):** nombre, ubicación y estado. Los nombres no son únicos (decisión 8), así que el nodo se identifica por su identificador.

## Dependencias

- HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)): nodos, ficha y registro de paneles.
- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20)) para login y roles reales y entorno de prueba aislado de la HU 2. No se afirma que estén implementados los contratos adicionales.
- Sin dependencias de las HU 6, 7, 9 ni 10; no se requiere que el nodo haya sido aislado. Las HU 14 y 15 dependen de esta.

## Decisiones tomadas

Resueltas por el equipo el 2026-11-22. Reemplazan a las preguntas abiertas de la versión anterior.

| # | Pregunta | Decisión | Alternativa descartada |
|---|---|---|---|
| 1 | Qué es un afectado (PA-1) | Un alias ficticio por nodo, sin cuenta de acceso ni catálogo global | Una cuenta existente de `usuarios` |
| 2 | Afectado duplicado en un nodo (PA-2) | Se permite; coherente con la decisión 8 de la HU 4 (nombres sin unicidad) | 409 si ya existe |
| 3 | Datos del afectado (PA-3) | Solo el alias | Nombre, tipo y contacto |
| 4 | Contrato de la HU 4 (PA-4) | Se reutiliza lo que implemente la HU 4: nodo por identificador y panel por `paneles.ts` | Coordinarlo antes con su responsable |

## Preguntas abiertas

Ninguna. Decididas en "Decisiones tomadas".

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.

## Criterios numerados

- **CA-1:** Dado un nodo con afectados, cuando se abre su ficha, entonces el panel muestra el total de afectados y su lista.
- **CA-2:** Dado un usuario administrador o técnico, cuando abre la ficha de un nodo, entonces ve el panel con la lista y el total.
- **CA-3:** Dado un identificador de nodo que no existe, cuando se consultan sus afectados, entonces la API responde 404; un nodo existente sin afectados responde una lista vacía y total 0.
