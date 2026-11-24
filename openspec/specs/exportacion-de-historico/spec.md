# exportacion-de-historico Specification

## Purpose

Permite que un usuario con sesión descargue en CSV las lecturas del histórico que cumplen el filtro aplicado (nodo, sensor y rango de días), para analizarlas fuera del tablero sin que el archivo ejecute fórmulas al abrirse en una hoja de cálculo.

## Requirements

### Requirement: Exportar a CSV las lecturas que cumplen el filtro
La API SHALL responder 200 con un archivo CSV para descargar que contiene las lecturas que cumplen el filtro, con el mismo significado del filtro que la consulta del histórico, de la más reciente a la más antigua. La interfaz del histórico SHALL ofrecer un enlace «Exportar CSV» que exporta los filtros aplicados (CA-1; Derivado: decisión #3, #6).

#### Scenario: Exportar con un filtro aplicado (CA-1)
- **WHEN** un usuario con sesión exporta el histórico con un filtro de nodo, sensor y rango de días
- **THEN** la API responde 200 con un CSV que trae una fila por cada lectura que cumple ese filtro, la más reciente primero, y ninguna otra

#### Scenario: Descarga desde el histórico (CA-1)
- **WHEN** un usuario filtra el histórico y pulsa «Exportar CSV»
- **THEN** el navegador descarga `historico.csv` con las lecturas de ese filtro

### Requirement: Formato del archivo CSV
El CSV SHALL tener la fila de encabezado `nodo,sensor,voltaje,corriente,potencia,fecha`, separada por comas, y una fila por lectura en ese orden de columnas, con el nombre del nodo y del sensor y la fecha en ISO 8601 en UTC (CA-1, CA-2; Derivado: decisión #1, #2, #5).

#### Scenario: Columnas de cada fila (CA-1)
- **WHEN** se exporta un filtro con resultados
- **THEN** cada fila trae el nombre del nodo, el nombre del sensor, el voltaje, la corriente, la potencia y la fecha ISO 8601 en UTC, en ese orden

#### Scenario: Filtro sin resultados (CA-2)
- **WHEN** se exporta un filtro que no coincide con ninguna lectura
- **THEN** la API responde 200 con un CSV que trae solo la fila de encabezado

### Requirement: Valores que no se ejecutan como fórmula
Un valor del CSV que empiece por `=`, `+`, `-` o `@` MUST exportarse precedido de un apóstrofo para que una hoja de cálculo no lo ejecute como fórmula, y un valor con coma, comillas o salto de línea MUST ir entre comillas dobles sin romper las columnas (CA-1; Derivado: RN-2, decisión #4).

#### Scenario: Nombre que parece una fórmula (CA-1)
- **WHEN** se exporta una lectura de un sensor cuyo nombre empieza por `=`
- **THEN** la celda del sensor empieza por `'=` y la fila conserva sus seis columnas

#### Scenario: Nombre con coma o comillas (CA-1)
- **WHEN** se exporta una lectura de un nodo cuyo nombre contiene una coma o comillas
- **THEN** la celda va entre comillas dobles y la fila conserva sus seis columnas

### Requirement: Tope de lecturas exportadas
La exportación SHALL devolver como máximo las 10 000 lecturas más recientes que cumplen el filtro, sin aviso en la interfaz (CA-1; Derivado: RN-4, decisión #7).

#### Scenario: Más lecturas que el tope (CA-1)
- **WHEN** el filtro coincide con más de 10 000 lecturas
- **THEN** el CSV trae solo las 10 000 más recientes

### Requirement: Validación del filtro de exportación
La API MUST responder 400 con el detalle de Zod cuando una fecha está mal formada o la fecha inicial es posterior a la final, y MUST NOT devolver un CSV en ese caso (CA-3; Derivado: decisión #3).

#### Scenario: Fecha mal formada (CA-3)
- **WHEN** se exporta con `desde` que no tiene el formato AAAA-MM-DD
- **THEN** la API responde 400 en JSON con el detalle del campo

#### Scenario: Rango invertido (CA-3)
- **WHEN** se exporta con `desde` posterior a `hasta`
- **THEN** la API responde 400 en JSON con el detalle del campo

### Requirement: Exportar exige sesión
La API MUST responder 401 en JSON a un visitante sin sesión y MUST NOT devolver ninguna lectura; administradores y técnicos SHALL poder exportar (CA-4; Derivado: decisión #3).

#### Scenario: Visitante sin sesión (CA-4)
- **WHEN** un visitante sin sesión exporta el histórico por la API
- **THEN** la API responde 401 con `{ "error": "No autenticado" }`

#### Scenario: Técnico con sesión (CA-4)
- **WHEN** un técnico con sesión exporta el histórico
- **THEN** la API responde 200 con el CSV
