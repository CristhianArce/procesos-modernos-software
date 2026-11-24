# Spec Delta

## Purpose

Deja versionado y verificable el entorno de IA del repositorio: OpenSpec con las reglas mínimas del proyecto, las reglas que Claude Code carga en cada sesión, los permisos que hacen cumplir las prohibiciones de los agentes y un CI que valida esa configuración en cada PR.

## ADDED Requirements

### Requirement: Configuración de OpenSpec válida y sin claves duplicadas
El repositorio SHALL tener OpenSpec inicializado con una configuración de proyecto que se lee sin claves duplicadas y cuyas reglas por artefacto son todas texto, para que OpenSpec no las ignore en silencio (CA-1).

#### Scenario: Configuración sin claves duplicadas (CA-1)
- **WHEN** se analiza la configuración de OpenSpec exigiendo claves únicas
- **THEN** el análisis termina sin error y cada regla de cada artefacto es una cadena de texto

#### Scenario: OpenSpec no descarta reglas (CA-1)
- **WHEN** se piden las instrucciones de cualquier artefacto de un change
- **THEN** la salida no contiene la advertencia de reglas ignoradas y las reglas del proyecto aparecen en las instrucciones

### Requirement: Formato de specs exigido por la configuración
Las reglas de OpenSpec del proyecto SHALL exigir encabezados y palabras clave de specs en inglés, la cita de `CA-n` en requisitos, escenarios y tareas, y `## Purpose` en capacidades nuevas (CA-1).

#### Scenario: Change de ejemplo con formato correcto (CA-1)
- **WHEN** se valida en modo estricto un change de ejemplo que cumple el formato del proyecto
- **THEN** la validación termina con código 0

#### Scenario: Change de ejemplo con encabezados en español (CA-1)
- **WHEN** se valida en modo estricto un change de ejemplo con `### Requisito:` en lugar de `### Requirement:`
- **THEN** la validación falla

### Requirement: Reglas del proyecto disponibles en cada sesión
El repositorio SHALL incluir en su raíz las reglas del proyecto (stack, estructura, capas, datos, seguridad, SDD y reglas de agentes) en el archivo que Claude Code carga automáticamente al abrir una sesión allí (CA-1).

#### Scenario: Sesión nueva en la raíz (CA-1)
- **WHEN** un integrante abre Claude Code en la raíz de un clon limpio
- **THEN** las reglas del proyecto, incluidas las prohibiciones de los agentes, forman parte del contexto de la sesión sin pasos manuales

### Requirement: Comandos prohibidos rechazados por la configuración de permisos
La configuración de permisos del proyecto SHALL rechazar merge de PR, aprobación o solicitud de cambios en un PR, amend, rebase, reset, force push y la edición de `.github/` dentro de los worktrees de historia (CA-3).

#### Scenario: Comando prohibido (CA-3)
- **WHEN** una sesión de Claude Code intenta `gh pr merge`, `gh pr review --approve`, `git commit --amend`, `git rebase`, `git reset` o `git push --force`
- **THEN** el comando se rechaza sin ejecutarse

#### Scenario: Edición de CI desde un worktree (CA-3)
- **WHEN** una sesión intenta editar un archivo bajo `.github/` dentro de `.claude/worktrees/`
- **THEN** la edición se rechaza

#### Scenario: Lista de rechazo completa (CA-3)
- **WHEN** se verifica la configuración de permisos versionada
- **THEN** contiene una regla de rechazo para cada comando prohibido de la lista

### Requirement: Worktrees de historia sin confirmación y fuera de git
Crear y borrar un worktree de historia en `.claude/worktrees/` SHALL ejecutarse sin pedir confirmación, y esa carpeta y `.flujo/` SHALL quedar ignoradas por git (CA-3).

#### Scenario: Crear y borrar un worktree (CA-3)
- **WHEN** una sesión crea un worktree en `.claude/worktrees/` desde `origin/main` y luego lo borra
- **THEN** ninguna de las dos operaciones pide confirmación y `git status` del checkout principal no muestra la carpeta

### Requirement: CI que valida la configuración en cada PR
El repositorio SHALL ejecutar en cada PR y en cada push a `main` las pruebas de la configuración de IA y la validación estricta de OpenSpec, y fallar si alguna falla (CA-1, CA-3; Derivado: decisión #21).

#### Scenario: PR con configuración válida (CA-1)
- **WHEN** se abre un PR con la configuración y las pruebas en verde
- **THEN** el CI termina en verde

#### Scenario: PR que rompe la configuración (CA-1)
- **WHEN** un PR introduce una regla de OpenSpec mal formada o quita una regla de rechazo
- **THEN** el CI falla
