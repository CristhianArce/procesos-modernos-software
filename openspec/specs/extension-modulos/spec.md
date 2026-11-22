# extension-modulos Specification

## Purpose

Deja que cada historia agregue su ítem de menú, su panel en la ficha del nodo y su suscriptor de alertas declarándolos en su propio módulo, sin editar el núcleo ni los archivos de otras historias.

## Requirements

### Requirement: Descubrimiento de extensiones por módulo
El registro de extensiones SHALL descubrir los ítems de menú, los paneles de la ficha del nodo y los suscriptores de alertas que declara cada módulo en su carpeta, sin que agregar un módulo requiera editar archivos del núcleo (CA-4).

#### Scenario: Módulo de prueba con las tres extensiones (CA-4)
- **WHEN** existe un módulo de prueba que declara un ítem de menú, un panel de la ficha del nodo y un suscriptor de alertas, y se consulta el registro
- **THEN** el registro devuelve el ítem, el panel y el suscriptor del módulo, y ningún archivo del núcleo nombra ese módulo

#### Scenario: Orden del menú (CA-4)
- **WHEN** dos módulos declaran ítems de menú con distinto `orden`
- **THEN** el registro los devuelve ordenados por `orden` ascendente

### Requirement: Menú filtrado por rol
El registro SHALL devolver para un rol solo los ítems de menú que incluyen ese rol (CA-4).

#### Scenario: Ítem restringido a otro rol (CA-4)
- **WHEN** un módulo declara un ítem de menú solo para `administrador` y se pide el menú del rol `tecnico`
- **THEN** el ítem no aparece en el menú del rol `tecnico` y sí en el de `administrador`
