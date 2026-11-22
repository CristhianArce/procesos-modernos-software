## Historia

Como administrador quiero registrar qué usuarios o dispositivos dependen de un nodo para saber a quién afecta una falla o un corte antes de actuar.

## Contexto

**HU 8: Registrar los usuarios o dispositivos afectados por un nodo**, fila 8 de [la propuesta](../propuesta.md), §5. Fuente canónica: [#25](https://github.com/CristhianArce/procesos-modernos-software/issues/25); documento canónico: `docs/backlog/hu-08-registrar-los-usuarios-o-dispositivos-afectados-por-un-nodo.md` ([main fijado](https://github.com/CristhianArce/procesos-modernos-software/blob/6134fcef5867ad08149450e024b5069a3a761843/docs/backlog/hu-08-registrar-los-usuarios-o-dispositivos-afectados-por-un-nodo.md)).
Se conservan los seis CA publicados: agregar/quitar por administrador, total/lista y lectura del técnico. El refinamiento documenta persistencia y permisos sin restringir ese alcance.
Se conserva la definición local acordada para esta contribución: usuarios ficticios asociados, con un alias por asociación, sin contacto, datos personales reales, cuentas de acceso ni catálogo global. La red es simulada: estas asociaciones registradas no calculan impacto eléctrico ni exigen aislamiento.

## Criterios de aceptación

- **CA-1:** Dado un nodo y un administrador, cuando agrega un afectado con datos válidos desde el panel de la ficha, entonces el afectado aparece en la lista del panel.
- **CA-2:** Dado un afectado registrado en un nodo, cuando el administrador lo quita, entonces desaparece de la lista y los afectados de otros nodos no cambian.
- **CA-3:** Dado un nodo con afectados, cuando se abre su ficha, entonces el panel muestra el total de afectados y su lista.
- **CA-4:** Dado un usuario técnico, cuando abre la ficha del nodo, entonces ve la lista pero no los botones de agregar o quitar, y si llama a la API de agregar o quitar recibe 403.
- **CA-5:** Dados datos inválidos al agregar un afectado, cuando se llama a la API, entonces responde 400 por la validación de Zod y no guarda nada.
- **CA-6:** Dado un identificador de nodo que no existe, cuando se consulta, agrega o quita un afectado, entonces la API responde 404.

## Reglas de negocio

- **RN-1:** Cada afectado pertenece a un solo nodo; quitarlo de un nodo no lo borra de otros.
- **RN-2:** El panel se enchufa por `paneles.ts`: no se edita la página de la ficha de la HU 4.

## Fuera de alcance

- Notificar a los afectados.
- Calcular automáticamente los afectados a partir de la topología de la red.
- Importar afectados desde un archivo.
- Datos personales reales en la demo, inferencia de impacto eléctrico o requisito de aislamiento previo.

## Notas técnicas (no vinculantes)

- Módulo oficial `src/modulos/afectados/`, panel propio mediante `paneles.ts` en la ficha de HU 4. Endpoints sugeridos oficiales: `GET|POST /api/afectados` con nodo como parámetro y `DELETE /api/afectados/{id}`; se documentarían posteriormente en `contracts/openapi.yaml`.
- Roles y seguridad: lecturas para administrador y técnico conforme a CA-3/CA-4; escrituras solo administrador en servidor, con `sessionFromRequest(req)`, `requireRole(sesion, "administrador")` y `conHttp`. El literal `admin` del ejemplo oficial se adapta al `administrador` real, sin cambiar los CA. El técnico no ve botones y no puede eludir la autorización usando POST/DELETE directos. El registro de paneles no tiene filtrado automático de roles; el componente debe usar la sesión real y separar sus controles de lectura/escritura.
- Datos y propiedad: tabla propia `nodo_usuarios`, migración Flyway y semilla `db/seed/afectados.sql`, como prevé la fuente. Se conserva el alias ficticio por asociación ya acordado localmente; no se añaden contacto, tipo, catálogo ni enlace con cuentas de acceso por inferencia. El responsable de HU 8 debe validar el mapeo al contrato real sin cambiar los CA (PA-1/PA-3). Se lee `nodos` de HU 4 sin modificarla. RN-1 se mantiene literal, sin inferir una identidad global entre nodos. SQL solo en `repo.ts`, Zod y handlers delgados; sin Server Actions ni cambios al núcleo o la página de HU 4.
- Semilla de prueba: administrador A y técnico T reales de HU 3; N0/N1 ficticios de HU 4. N0 empieza sin afectados (total 0) y N1 contiene `Usuario demo 02` (total 1). El caso crea `Usuario demo 01` en N0 mediante su panel, usando el alias válido del contrato acordado y ningún campo nuevo. Las expectativas fijas son N0 `0 → 1 → 0` y N1 siempre con su único registro. No se usa contacto, identidad de personas reales ni la semilla para sustituir las acciones de agregar/quitar.
- Estado y trazabilidad: no están implementados en el checkout ni el árbol remoto fijado el login real, la ficha/API/tablas de nodos o el montaje efectivo del panel. Sí existen los ayudantes generales y el registro, que no sustituyen esos contratos. Se mantiene la definición local de alias ficticio y el alcance publicado de escritura del administrador y lectura del técnico. No se ha implementado ni ejecutado ninguna prueba.

### E2E futuro (no ejecutado)

Preparar aplicación/servidor y BD de prueba reales, migrados y con la semilla conocida descrita arriba; usar autenticación real. El total y la lista esperados se declaran a partir de esos datos antes de consultar la aplicación, sin usar el cálculo de producción como oráculo.

1. A abre la ficha de N0: total 0 y lista vacía. Agrega `Usuario demo 01` desde el panel, comprueba lista de una entrada/total 1 y recarga para verificar persistencia.
2. En una sesión real separada, T puede consultar esa lista/total, pero no tiene botones de agregar/quitar. Intentar por API agregar un alias ficticio distinto y quitar el existente, con datos válidos: ambas solicitudes devuelven 403 y no alteran N0.
3. A quita el registro recién creado desde la interfaz: lista vacía y total 0. Recargar y volver a comprobar ambos valores.
4. N1 conserva `Usuario demo 02` y total 1; los datos del nodo no cambian. No se ejecuta un corte ni se usa HU 6 para habilitar la consulta.

Cobertura principal diseñada: **CA-1 a CA-4**. **CA-5** conserva una prueba específica pendiente de datos inválidos → 400 sin inserción; **CA-6**, pruebas de nodo inexistente → 404 en consulta/agregar/quitar. Mantener asimismo un caso de vacío válido separado del error de nodo inexistente y los controles generales de sesión. Usar handlers/BD reales y componentes de presentación cuando corresponda; sin mocks, código de prueba implementado ni pruebas ejecutadas.

## Dependencias

- HU 4 ([#21](https://github.com/CristhianArce/procesos-modernos-software/issues/21)): nodos/ficha y su contrato, dependencia expresa de #25.
- HU 3 ([#20](https://github.com/CristhianArce/procesos-modernos-software/issues/20)) para login/roles reales de la línea base y entorno de prueba aislado de HU 2. No se afirma que estén implementados o aceptados los contratos adicionales.
- Sin dependencias de HU 6, HU 7, HU 9 o HU 10; no se requiere que el nodo haya sido aislado.

## Preguntas abiertas

- **PA-1:** Definición local resuelta: usuario ficticio asociado con un alias, sin catálogo global ni cuenta de acceso. El issue aún plantea persona/equipo o cuenta existente y asume la primera alternativa; el responsable de HU 8 y el equipo deben validar cómo encaja el alias acordado en el contrato real. Si exigiera cambiar un CA, se elevará para revisión, sin modificarlo silenciosamente.
- **PA-2:** ¿Se evita duplicar el mismo afectado en un nodo? — opciones oficiales: 409 si ya existe / permitirlo. Lo resuelven el equipo y el responsable de HU 8; no se impone unicidad global.
- **PA-3:** Los datos locales de esta demo ya están acotados a un alias ficticio. La fuente todavía pregunta por nombre/tipo/contacto; validar con el responsable de HU 8 el mapeo, sin introducir nuevos campos o PII real en esta contribución. La decisión local no sustituye la validación del contrato por el equipo ni cambia el texto de los CA.
- **PA-4:** ¿Qué contrato real de HU 4 permite verificar identidad/existencia del nodo, montar el panel y enlazar los dos nodos de prueba? — opciones: reutilizar la implementación / coordinarla antes. Lo resuelven los responsables de HU 4/HU 8, sin atribuirles una entrega aceptada ni inferir de RN-1 un catálogo global.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
