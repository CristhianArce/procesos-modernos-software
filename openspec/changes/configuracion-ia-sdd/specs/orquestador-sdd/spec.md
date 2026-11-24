# Spec Delta

## Purpose

Lleva una historia de usuario desde su issue hasta un PR en borrador con evidencias en 5 minutos o menos, en un solo modo, combinando OpenSpec, los agentes del flujo y los skills de compilación, commit y PR, con salidas de error claras cuando algo no se puede continuar.

## ADDED Requirements

### Requirement: Skills imprescindibles disponibles en un clon limpio
Un clon limpio del repositorio SHALL ofrecer, sin instalar nada más, los skills `orquestador`, `build-test`, `commit` y `abrir-pr`, además de los skills de OpenSpec (CA-2).

#### Scenario: Clon limpio (CA-2)
- **WHEN** un integrante abre Claude Code en la raíz de un clon limpio
- **THEN** los cuatro skills y los seis skills de OpenSpec aparecen disponibles

### Requirement: El orquestador solo lo invoca la persona
El skill `orquestador` SHALL declarar que el modelo no puede invocarlo por su cuenta, de modo que solo arranca cuando la persona lo pide (CA-2).

#### Scenario: Definición del orquestador (CA-2)
- **WHEN** se verifica la definición versionada del skill `orquestador`
- **THEN** declara que la invocación por el modelo está deshabilitada

### Requirement: Orquestación de punta a punta en 5 minutos
Con un issue abierto, Docker en marcha y las credenciales de la base de datos en `.env`, `/orquestador <n>` SHALL terminar en 5 minutos o menos con un único PR en borrador que cita el issue y el nombre del change, y con `evidencias/issue-<n>/` commiteado en su rama (CA-6).

#### Scenario: Issue de prueba (CA-6)
- **WHEN** la persona ejecuta `/orquestador <n>` sobre el issue de prueba abierto
- **THEN** en 5 minutos o menos existe un PR en borrador cuyo cuerpo cita `#<n>` y el change, y su rama contiene `evidencias/issue-<n>/` con la trazabilidad CA → requisito → tarea → código → prueba

### Requirement: Apertura de PR idempotente
El skill `abrir-pr` SHALL devolver el PR existente, sin crear otro, cuando ya hay un PR abierto para la rama de la historia (CA-6).

#### Scenario: Segunda apertura (CA-6)
- **WHEN** se invoca `abrir-pr` dos veces para el mismo issue
- **THEN** la segunda invocación devuelve el mismo número de PR y sigue existiendo un único PR

### Requirement: Fallos de compilación clasificados
El skill `build-test` SHALL clasificar cada fallo como **código** o **entorno**, y el orquestador SHALL detener el item ante un fallo de entorno (CA-7).

#### Scenario: Docker apagado (CA-7)
- **WHEN** `build-test` corre con Docker apagado
- **THEN** el fallo se clasifica como **entorno** y el orquestador detiene el item sin commitear

#### Scenario: Error de tipos (CA-7)
- **WHEN** `build-test` corre sobre código con un error de tipos
- **THEN** el fallo se clasifica como **código**

### Requirement: Commit solo con build verde reciente
El skill `commit` SHALL negarse a commitear si el estado del item no registra un build verde posterior al último cambio de código (CA-7).

#### Scenario: Sin build verde (CA-7)
- **WHEN** se invoca `commit` y el estado del item no tiene un build verde reciente
- **THEN** no se crea ningún commit y se informa el motivo

### Requirement: Estado y evidencias del item reproducibles
El orquestador SHALL guardar el estado de cada item en `.flujo/issue-<n>/` con las plantillas del proyecto y SHALL copiar a `evidencias/issue-<n>/` los archivos de evidencia sin logs pesados, generando el registro de agentes (CA-6).

#### Scenario: Copia de evidencias (CA-6)
- **WHEN** se copian las evidencias de un `<trabajo>` de ejemplo
- **THEN** `evidencias/issue-<n>/` contiene los archivos de evidencia y `agentes.md` generado desde el registro de agentes, y no contiene logs

### Requirement: Contexto del repositorio antes de proponer
Antes de proponer el change de una historia, el orquestador SHALL leer `context/contexto.md` y solo las partes que su paso indica, con el negocio y lo técnico del producto. La propuesta SHALL tratar como pregunta cualquier tabla o módulo que no figure ahí y MUST NOT repetir una pregunta que la persona ya decidió (CA-6).

#### Scenario: Decisión ya tomada (CA-6)
- **WHEN** la historia plantea una duda que la persona ya decidió en una historia construida
- **THEN** la propuesta cita esa decisión en lugar de preguntarla otra vez

### Requirement: Contexto ampliado fuera del flujo
El skill `actualizar-contexto` SHALL ampliar `context/` agregando lo nuevo y reemplazando solo la entrada que cambió, sin borrar nada, y MUST NOT escribir cuando no hay novedades; el orquestador MUST NOT generarlo (CA-6).

#### Scenario: Repositorio de ejemplo (CA-6)
- **WHEN** se amplía el contexto de un repositorio con una migración que crea una tabla y agrega una columna, y un módulo con ítem de menú
- **THEN** `context/inventario.md` lista la tabla con ambas columnas, el módulo con su ítem de menú, la semilla y las rutas del contrato

#### Scenario: Contexto ya al día (CA-6)
- **WHEN** se amplía el contexto dos veces sin cambios en las fuentes
- **THEN** la segunda vez no escribe ningún archivo

#### Scenario: Un cambio reemplaza solo su entrada (CA-6)
- **WHEN** cambia el texto de un requisito vigente y otra capacidad desaparece de las fuentes
- **THEN** se reemplaza la entrada de ese requisito y la capacidad que desapareció se conserva

### Requirement: Cobertura de criterios antes de G2
Antes de la puerta G2, el orquestador SHALL obtener con un script, sin agentes, los requisitos, escenarios y tareas que citan cada `CA-n` del issue y los criterios sin cobertura, y SHALL pasar ese resultado al `revisor-salida` (CA-6).

#### Scenario: Change de ejemplo con cobertura completa (CA-6)
- **WHEN** se analiza la cobertura del change de ejemplo correcto contra su issue
- **THEN** cada `CA-n` tiene requisito o escenario y tarea, y la lista de criterios sin cobertura está vacía

#### Scenario: Criterio sin cobertura (CA-6)
- **WHEN** el issue tiene un `CA-n` que ninguna spec ni tarea cita
- **THEN** ese criterio aparece en la lista de criterios sin cobertura
