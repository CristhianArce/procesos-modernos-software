# Issue #54: HU 14: Agregar un afectado a un nodo

- Estado: abierto
- Etiquetas: historia, clase

## Historia

Como administrador quiero agregar un usuario o dispositivo afectado a un nodo para registrar a quién afecta una falla o un corte antes de actuar.

## Contexto

**HU 14: Agregar un afectado a un nodo**, fila 14 de [la propuesta](../propuesta.md), §5.
Esta historia sale de dividir la HU 8 ([#25](https://github.com/CristhianArce/procesos-modernos-software/issues/25), "Registrar los usuarios o dispositivos afectados por un nodo") en tres: la HU 8 conserva la tabla, la consulta y el panel de solo lectura; aquí queda agregar un afectado y en la HU 15 quitarlo. CA-1 es el CA-1 de #25; CA-2 es el CA-5; CA-3 es la mitad de agregar del CA-6 y CA-4 es la mitad de agregar del CA-4.
Se conserva la definición local acordada: usuarios ficticios asociados, con un alias por asociación, sin contacto, datos personales reales, cuentas de acceso ni catálogo global. La red es simulada: estas asociaciones no calculan impacto eléctrico ni exigen aislamiento.

## Criterios de aceptación

- **CA-1:** Dado un nodo y un administrador, cuando agrega un afectado con datos válidos desde el panel de la ficha, entonces el afectado aparece en la lista del panel y el total sube en uno.
- **CA-2:** Dados datos inválidos al agregar un afectado, cuando se llama a la API, entonces responde 400 por la validación de Zod y no guarda nada.
- **CA-3:** Dado un identificador de nodo que no existe, cuando se agrega un afectado, entonces la API responde 404 y no guarda nada.
- **CA-4:** Dado un usuario técnico, cuando abre la ficha del nodo, entonces no ve el botón de agregar, y si llama a la API de agregar recibe 403 y no se guarda nada.

## Reglas de negocio

- **RN-1:** Cada afectado pertenece a un solo nodo; agregarlo a un nodo no lo agrega a otros.
- **RN-2:** El panel se extiende por `paneles.ts`: no se edita la página de la ficha de la HU 4.
- **RN-3:** Un afectado es un alias ficticio asociado a un nodo. El alias es obligatorio y es su único dato: no hay contacto, tipo, catálogo global ni enlace con cuentas de acceso.
- **RN-4:** Un mismo alias puede repetirse en un nodo: no se valida unicidad.

## Fuera de alcance

- Consultar la lista y el total (lo cubre la HU 8) y quitar afectados (lo cubre la HU 15).
- Notificar a los afectados.
- Calcular automáticamente los afectados a partir de la topología de la red.
- Importar afectados desde un archivo.
- Evitar afectados duplicados en un nodo.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/afectados/` (el de la HU 8). Esta historia agrega el formulario de alta al panel de la HU 8 y el `POST`.
- Endpoint sugerido: `POST /api/afectados` con el nodo en el cuerpo o como parámetro (se agrega a `contracts/openapi.yaml`).
- Roles y seguridad: escritura solo para administrador, en servidor, con `sessionFromRequest(req)`, `requireRole(sesion, "administrador")` y `conHttp`. El literal `admin` del ejemplo oficial se adapta al `administrador` real. El técnico no ve el botón y no puede eludir la autorización con un `POST` directo. El registro de paneles no filtra por rol: el componente usa la sesión real y separa sus controles de lectura y escritura.
- Datos: sin migración propia (usa la tabla `nodo_usuarios` de la HU 8); sin semilla nueva. SQL solo en `repo.ts`, Zod y handlers delgados; sin Server Actions ni cambios al núcleo o a la página de la HU 4.

### E2E futuro (no ejecutado)

Preparación: aplicación y BD de prueba reales, migradas y con la semilla de la HU 8. N0 empieza sin afectados (total 0). El total y la lista esperados se declaran antes de consultar la aplicación.

1. El administrador abre la ficha de N0, agrega `Usuario demo 01` desde el panel y comprueba lista de una entrada y total 1. Recarga y verifica la persistencia.
2. En una sesión real separada, el técnico ve la lista pero no el botón de agregar; un `POST` directo con datos válidos devuelve 403 y N0 no cambia.

Cobertura del recorrido: **CA-1** y **CA-4**. **CA-2** y **CA-3** se cubren con pruebas de integración del handler.

## Decisiones de la HU 4 que aplican

- **Borrado en cascada (decisión 5):** la tabla `nodo_usuarios` referencia al nodo con borrado en cascada.
- **El técnico solo consulta (decisión 6):** crear, editar y eliminar es solo del administrador; coincide con CA-4.
- **Nombres sin unicidad (decisión 8):** el nodo se identifica por su identificador.

## Dependencias

- HU 8 ([#25](https://github.com/CristhianArce/procesos-modernos-software/issues/25)): tabla `nodo_usuarios`, consulta y panel de afectados.
- HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)): nodos, ficha y registro de paneles.
- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20)): login y roles.
- Sin dependencias de las HU 6, 7, 9 ni 10.

## Preguntas abiertas

Ninguna. Se heredan las decisiones de la HU 8 (alias único dato, duplicados permitidos).

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.

## Criterios numerados

- CA-1: Dado un nodo y un administrador, cuando agrega un afectado con datos válidos desde el panel de la ficha, entonces el afectado aparece en la lista del panel y el total sube en uno.
- CA-2: Dados datos inválidos al agregar un afectado, cuando se llama a la API, entonces responde 400 por la validación de Zod y no guarda nada.
- CA-3: Dado un identificador de nodo que no existe, cuando se agrega un afectado, entonces la API responde 404 y no guarda nada.
- CA-4: Dado un usuario técnico, cuando abre la ficha del nodo, entonces no ve el botón de agregar, y si llama a la API de agregar recibe 403 y no se guarda nada.
