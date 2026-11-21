# Spec Delta

## Purpose

Define los agentes de Claude Code que preparan un issue y vigilan la calidad del flujo SDD: qué reciben, qué veredicto o hallazgos devuelven y qué tienen prohibido, para que el orquestador los combine de forma predecible.

## ADDED Requirements

### Requirement: Agentes imprescindibles disponibles en un clon limpio
Un clon limpio del repositorio SHALL ofrecer, sin instalar nada más, los agentes `preparador`, `revisor-salida`, `revisor-reglas` y `trazabilidad` (CA-2).

#### Scenario: Clon limpio (CA-2)
- **WHEN** un integrante abre Claude Code en la raíz de un clon limpio
- **THEN** los cuatro agentes aparecen disponibles para ser lanzados

### Requirement: Ningún agente lanza subagentes
Cada agente del flujo SDD SHALL declarar que no puede usar la herramienta de lanzar agentes (CA-2).

#### Scenario: Definición de los agentes (CA-2)
- **WHEN** se verifica la definición versionada de cada agente
- **THEN** todas declaran como herramienta no permitida la de lanzar agentes, y todas tienen una sección de prohibiciones con las reglas globales de los agentes

### Requirement: Puerta G2 rechaza specs con formato inválido
El `revisor-salida` SHALL devolver `CORREGIR`, con al menos un hallazgo de formato, cuando evalúa la puerta G2 sobre un change cuyos encabezados de requisitos están en español (CA-4).

#### Scenario: Change con encabezados en español (CA-4)
- **WHEN** el `revisor-salida` evalúa G2 sobre el change de ejemplo con `### Requisito:`
- **THEN** devuelve `CORREGIR` con un hallazgo de formato que señala el encabezado

### Requirement: Puerta G2 aprueba specs correctas
El `revisor-salida` SHALL devolver `APROBADO` en G2 cuando el change cumple el formato y cada requisito cita su `CA-n` (CA-4).

#### Scenario: Change correcto (CA-4)
- **WHEN** el `revisor-salida` evalúa G2 sobre el change de ejemplo correcto
- **THEN** devuelve `APROBADO`

#### Scenario: Salida lista para el registro de puertas (CA-4)
- **WHEN** el `revisor-salida` termina una evaluación
- **THEN** su salida empieza con la cabecera `## G2 — intento <n>` y usa solo los veredictos `APROBADO`, `CORREGIR` o `BLOQUEAR`

### Requirement: Revisor de reglas marca violaciones de capas como críticas
El `revisor-reglas` SHALL devolver al menos un hallazgo `CRITICAL` por cada violación de capas que encuentre (SQL fuera de la capa de repositorio, página que llama a la propia API), usando solo la escala `CRITICAL`/`WARNING`/`SUGGESTION` (CA-5).

#### Scenario: Parche con dos violaciones (CA-5)
- **WHEN** el `revisor-reglas` revisa el parche de ejemplo con SQL fuera de la capa de repositorio y un `fetch` a la propia API desde una página
- **THEN** devuelve al menos dos hallazgos `CRITICAL`, uno por violación, cada uno con archivo y línea

#### Scenario: Escala de severidad (CA-5)
- **WHEN** el `revisor-reglas` devuelve hallazgos
- **THEN** cada hallazgo tiene una severidad `CRITICAL`, `WARNING` o `SUGGESTION`, y ninguna otra

### Requirement: Preparador bloquea issues resueltos
El `preparador` SHALL devolver `BLOQUEAR: ya resuelto` cuando el issue está cerrado, sin crear rama, worktree ni PR (CA-7).

#### Scenario: Issue cerrado (CA-7)
- **WHEN** el `preparador` recibe un issue cerrado
- **THEN** devuelve `BLOQUEAR: ya resuelto` y no existe ninguna rama, worktree ni PR nuevos para ese issue

### Requirement: Preparador deja el issue listo para el flujo
Para un issue abierto, el `preparador` SHALL crear (o reutilizar si ya existe) la rama de la historia y escribir en `<trabajo>` el issue con sus criterios numerados `CA-n` (CA-6).

#### Scenario: Issue abierto en modo demo (CA-6)
- **WHEN** el `preparador` recibe un issue abierto en modo `demo`
- **THEN** existe la rama `feature/issue-<n>-<slug>` en el checkout principal y `.flujo/issue-<n>/issue.md` contiene los criterios `CA-n` del issue

#### Scenario: Segunda corrida (CA-6)
- **WHEN** el `preparador` corre de nuevo sobre el mismo issue
- **THEN** reutiliza la rama y el `<trabajo>` existentes sin duplicarlos

### Requirement: Agente de trazabilidad reporta cobertura de criterios
El agente `trazabilidad` SHALL reportar, para cada `CA-n` del issue, los requisitos, escenarios y tareas que lo citan, y SHALL señalar los criterios sin cobertura (CA-6).

#### Scenario: Change de ejemplo (CA-6)
- **WHEN** el agente `trazabilidad` analiza el change de ejemplo correcto
- **THEN** devuelve una tabla con una fila por `CA-n` con sus requisitos, escenarios y tareas, sin criterios sin cobertura
