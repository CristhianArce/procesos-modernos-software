# plantillas-y-etiquetas Specification

## Purpose

Da al equipo y al orquestador el mismo formato al abrir historias y PR, pide revisores por defecto y deja creadas las etiquetas que el flujo aplica con `gh`, que falla si una etiqueta no existe.

## Requirements

### Requirement: Plantillas de historia y de PR
El repositorio SHALL ofrecer una plantilla de historia de usuario con criterios `CA-n` y una plantilla de PR con `Closes #<n>`, la tabla de criterios, las migraciones, cómo probar y `Change:`, iguales a las que usan los skills `crear-hu` y `abrir-pr` (CA-7; Derivado: decisión #9).

#### Scenario: Plantillas disponibles (CA-7)
- **WHEN** se consultan los archivos de `.github/`
- **THEN** existen `ISSUE_TEMPLATE/historia.md` y `PULL_REQUEST_TEMPLATE.md`, y el cuerpo de cada una coincide con la plantilla de su skill

### Requirement: Etiquetas del flujo
El repositorio SHALL tener las etiquetas `historia`, `bloqueado`, `migracion`, `revision-especializada` y `escalado` (CA-7).

#### Scenario: Etiquetas creadas (CA-7)
- **WHEN** se ejecuta `gh label list`
- **THEN** la lista incluye `historia`, `bloqueado`, `migracion`, `revision-especializada` y `escalado`

### Requirement: Revisores por defecto
El repositorio SHALL declarar en `CODEOWNERS` los revisores por defecto de todos los archivos, y GitHub MUST aceptar el archivo sin errores (Derivado: decisión #9).

#### Scenario: CODEOWNERS válido (CA-7)
- **WHEN** se consulta `repos/{owner}/{repo}/codeowners/errors` en `main`
- **THEN** la lista de errores está vacía
