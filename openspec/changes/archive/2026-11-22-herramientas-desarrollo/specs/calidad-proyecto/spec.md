# Spec Delta

## Purpose

Garantiza que cualquier integrante o agente pueda instalar el proyecto desde un clon limpio y correr lint, typecheck, pruebas y build con el mismo resultado, sin que el trabajo en curso de otras historias lo afecte.

## ADDED Requirements

### Requirement: Comandos de calidad en verde desde un clon limpio
El proyecto SHALL ofrecer comandos de lint, typecheck, pruebas unitarias y build que, tras instalar las dependencias en un clon limpio, terminan con código 0 (CA-1).

#### Scenario: Clon limpio en verde (CA-1)
- **WHEN** se instalan las dependencias de un clon limpio y se ejecutan lint, typecheck, pruebas unitarias y build
- **THEN** los cuatro comandos terminan con código 0

#### Scenario: Error de tipos detectado (CA-1)
- **WHEN** se agrega a `src/` un archivo con un error de tipos y se ejecuta typecheck
- **THEN** typecheck termina con código distinto de 0 e indica el archivo y la línea

### Requirement: Carpetas de trabajo de los agentes ignoradas
Lint, typecheck y pruebas SHALL ignorar los worktrees de historia en `.claude/worktrees/` y el trabajo de cada issue en `.flujo/`, para que el código en curso de otra historia no rompa el checkout principal (CA-7).

#### Scenario: Worktree con código roto (CA-7)
- **WHEN** existe un worktree en `.claude/worktrees/` con código que no compila y archivos en `.flujo/`, y se ejecutan typecheck, lint y pruebas en el checkout principal
- **THEN** los tres comandos terminan con código 0 y ninguno reporta archivos de esas carpetas
