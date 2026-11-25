# agregar-afectado-nodo Specification

## Purpose
Permite que un administrador registre un usuario o dispositivo ficticio afectado por un nodo, por la API y desde el panel de la ficha, para saber a quién afecta una falla antes de actuar. El técnico solo consulta.

## Requirements

### Requirement: Agregar un afectado por la API
`POST /api/afectados` con `{ nodoId, alias }` SHALL crear el afectado en el nodo indicado y responder 201 con `{ id, alias }` (CA-1; Derivado: decisión #3). El afectado MUST pertenecer solo a ese nodo, y el alias puede repetirse dentro del nodo (CA-1).

#### Scenario: Agregar con datos válidos (CA-1)
- **WHEN** un administrador envía `POST /api/afectados` con un `nodoId` existente y el alias `Usuario demo 01`
- **THEN** la API responde 201 con el `id` y el alias, y `GET /api/afectados?nodoId=<id>` lo incluye y su `total` sube en uno

#### Scenario: El afectado es de un solo nodo (CA-1)
- **WHEN** un administrador agrega un afectado a un nodo
- **THEN** los afectados de los demás nodos no cambian

#### Scenario: Alias repetido en el nodo (CA-1)
- **WHEN** un administrador agrega dos veces el mismo alias al mismo nodo
- **THEN** la API responde 201 las dos veces y el nodo cuenta dos afectados

### Requirement: Validación del alta de un afectado
El cuerpo SHALL validarse con Zod: `alias` obligatorio, sin espacios en los extremos y de 1 a 80 caracteres, y `nodoId` un UUID. Un alias vacío, solo con espacios o de más de 80 caracteres, un `nodoId` que no es UUID o un cuerpo que no es JSON MUST responder 400 con el detalle de la validación y no guardar nada (CA-2; Derivado: decisión #1).

#### Scenario: Alias vacío o solo espacios (CA-2)
- **WHEN** un administrador envía el alta con alias `""` o `"   "`
- **THEN** la API responde 400 con `error` igual a `Datos inválidos` y el detalle del campo `alias`, y el nodo conserva su total

#### Scenario: Alias demasiado largo (CA-2; Derivado: decisión #1)
- **WHEN** un administrador envía un alias de 81 caracteres
- **THEN** la API responde 400 y no se guarda nada

#### Scenario: Alias con espacios en los extremos (CA-2; Derivado: decisión #1)
- **WHEN** un administrador envía el alias `"  Usuario demo  "`
- **THEN** la API responde 201 y el alias guardado es `Usuario demo`

#### Scenario: Identificador de nodo mal formado o cuerpo no JSON (CA-2)
- **WHEN** un administrador envía un `nodoId` que no es UUID, no lo envía o envía un cuerpo que no es JSON
- **THEN** la API responde 400 y no se guarda nada

### Requirement: Nodo inexistente al agregar un afectado
Si el `nodoId` es un UUID que no corresponde a ningún nodo, la API SHALL responder 404 en JSON y MUST NOT guardar el afectado (CA-3).

#### Scenario: Nodo que no existe (CA-3)
- **WHEN** un administrador envía el alta con un UUID que no corresponde a ningún nodo
- **THEN** la API responde 404 con un cuerpo JSON y no queda ningún afectado nuevo

### Requirement: Alta reservada al administrador
El alta SHALL responder 403 en JSON a un técnico y 401 en JSON sin sesión, antes de validar el cuerpo, y MUST NOT guardar nada en ninguno de los dos casos (CA-4).

#### Scenario: Técnico llama a la API (CA-4)
- **WHEN** un técnico envía `POST /api/afectados` con datos válidos o inválidos
- **THEN** la API responde 403 en JSON y el nodo conserva su total

#### Scenario: Sin sesión (CA-4)
- **WHEN** un visitante sin sesión envía `POST /api/afectados`
- **THEN** la API responde 401 en JSON y no se guarda nada

### Requirement: Formulario de alta en el panel de afectados
El panel «Afectados» SHALL mostrar al administrador un formulario «Agregar afectado» con el campo «Alias». Al guardar con la API en 200 o 201, el panel MUST volver a leer los datos del servidor: el afectado aparece en la lista, el total sube en uno y el campo queda vacío. Si la API falla, SHALL mostrar el error como alerta sin cambiar la lista (CA-1; Derivado: decisión #2).

#### Scenario: El administrador agrega desde el panel (CA-1)
- **WHEN** un administrador abre la ficha de un nodo sin afectados, escribe `Usuario demo 01` y pulsa «Agregar afectado»
- **THEN** la lista muestra una entrada con ese alias, el total pasa de 0 a 1 y el campo queda vacío

#### Scenario: El alta persiste al recargar (CA-1)
- **WHEN** el administrador recarga la ficha después de agregar el afectado
- **THEN** la lista conserva el afectado y el total

#### Scenario: Fallo de la API (CA-2)
- **WHEN** el administrador envía el formulario y la API responde con error
- **THEN** el panel muestra el mensaje de error como alerta y la lista no cambia

### Requirement: El técnico no ve el botón de agregar
El panel «Afectados» MUST NOT mostrar el formulario ni el botón «Agregar afectado» a un técnico, que sigue viendo la lista y el total. Ocultarlo es cosmético: la API exige el rol (CA-4).

#### Scenario: Técnico abre la ficha (CA-4)
- **WHEN** un técnico abre la ficha de un nodo
- **THEN** el panel «Afectados» muestra la lista y el total, y no muestra el botón «Agregar afectado»
