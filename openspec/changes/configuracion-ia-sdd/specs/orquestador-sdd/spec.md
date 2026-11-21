# Spec Delta

## Purpose

Lleva una historia de usuario desde su issue hasta un PR en borrador con evidencias, en modo `demo`, combinando OpenSpec, los agentes del flujo y los skills de compilación, entorno, commit y PR, con salidas de error claras cuando algo no se puede continuar.

## ADDED Requirements

### Requirement: Skills imprescindibles disponibles en un clon limpio
Un clon limpio del repositorio SHALL ofrecer, sin instalar nada más, los skills `orquestador`, `build-test`, `entorno-docker`, `commit` y `abrir-pr`, además de los skills de OpenSpec (CA-2).

#### Scenario: Clon limpio (CA-2)
- **WHEN** un integrante abre Claude Code en la raíz de un clon limpio
- **THEN** los cinco skills y los seis skills de OpenSpec aparecen disponibles

### Requirement: El orquestador solo lo invoca la persona
El skill `orquestador` SHALL declarar que el modelo no puede invocarlo por su cuenta, de modo que solo arranca cuando la persona lo pide (CA-2).

#### Scenario: Definición del orquestador (CA-2)
- **WHEN** se verifica la definición versionada del skill `orquestador`
- **THEN** declara que la invocación por el modelo está deshabilitada

### Requirement: Modo demo de punta a punta
Con un issue de práctica abierto y la base de datos levantada y migrada, `/orquestador <n> demo` SHALL terminar en 7 minutos o menos con un único PR en borrador que cita el issue y el nombre del change, y con `evidencias/issue-<n>/` commiteado en su rama (CA-6).

#### Scenario: Issue de práctica (CA-6)
- **WHEN** la persona ejecuta `/orquestador <n> demo` sobre un issue de práctica abierto
- **THEN** en 7 minutos o menos existe un PR en borrador cuyo cuerpo cita `#<n>` y el change, y su rama contiene `evidencias/issue-<n>/` con la trazabilidad CA → requisito → tarea → código → prueba

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

### Requirement: Entorno Docker por historia sin choques de puertos
El skill `entorno-docker` SHALL levantar el entorno de una historia con puertos efímeros, devolver su `BASE_URL` y dejar `docker ps` limpio al bajarlo (CA-6).

#### Scenario: Levantar y bajar (CA-6)
- **WHEN** se levanta el entorno de una historia y luego se baja
- **THEN** al levantar se obtiene un puerto asignado por Docker, y al bajar no queda ningún contenedor de esa historia
