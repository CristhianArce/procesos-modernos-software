# integracion-continua Specification

## Purpose

Detecta de forma automática, en cada PR y con poco tiempo de espera, que una historia rompió la calidad del proyecto o la imagen, y revisa secretos y vulnerabilidades al fusionar en `main`.

## Requirements

### Requirement: Validación de cada PR
El CI SHALL ejecutar en cada PR lint, typecheck, pruebas unitarias, pruebas de integración y build del proyecto, y marcar el check del PR en rojo si cualquiera falla (CA-3; Derivado: decisión #4).

#### Scenario: PR en verde (CA-3)
- **WHEN** se abre un PR cuyo código pasa lint, typecheck, pruebas y build
- **THEN** el job `proyecto` termina en verde y el PR puede fusionarse según los checks

#### Scenario: Un paso falla (CA-3)
- **WHEN** en un PR falla el lint, el typecheck, una prueba o el build
- **THEN** el job `proyecto` termina en rojo, los pasos siguientes no corren y el check del PR queda en rojo

### Requirement: La imagen se construye y arranca en cada PR
El CI SHALL construir la imagen de Docker en cada PR sin publicarla y comprobar que arranca y responde 200 en `/api/health` (CA-3; Derivado: decisión #5).

#### Scenario: Imagen que arranca (CA-3)
- **WHEN** se abre un PR y el job `imagen` construye la imagen y la ejecuta con valores de relleno para las variables
- **THEN** `GET /api/health` responde 200 antes de 30 intentos y el job termina en verde sin publicar nada

#### Scenario: Imagen que no arranca (CA-3)
- **WHEN** la imagen no responde 200 en `/api/health` tras 30 intentos
- **THEN** el job muestra los logs del contenedor y termina en rojo

### Requirement: Controles de seguridad solo al fusionar en main
El CI SHALL ejecutar gitleaks sobre el historial y `npm audit` con nivel alto o crítico en cada push a `main`, y fallar si encuentra un secreto o una vulnerabilidad de ese nivel; en un PR esos controles MUST NOT correr (CA-4; Derivado: decisión #4).

#### Scenario: Push a main (CA-4)
- **WHEN** se fusiona un PR en `main`
- **THEN** el job `seguridad` corre gitleaks sobre el historial completo y `npm audit --audit-level=high`, y termina en verde si no hay hallazgos

#### Scenario: Hallazgo de seguridad (CA-4)
- **WHEN** gitleaks detecta un secreto o `npm audit` una vulnerabilidad alta o crítica en un push a `main`
- **THEN** el job `seguridad` termina en rojo

#### Scenario: PR sin controles de seguridad (CA-4)
- **WHEN** corre el CI de un PR
- **THEN** el job `seguridad` no se ejecuta
