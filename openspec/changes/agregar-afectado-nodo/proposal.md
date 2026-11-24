# Proposal

## Why

La HU 8 dejó el panel «Afectados» de la ficha del nodo en solo lectura. El administrador necesita registrar a quién afecta una falla o un corte antes de actuar, y hoy no puede hacerlo ni desde la interfaz ni por la API (issue #54, HU 14; CA-1 a CA-4).

## What Changes

- `POST /api/afectados` con `{ nodoId, alias }`: solo el administrador; responde 201 con `{ id, alias }` (CA-1; Derivado: decisión #3).
- Validación del cuerpo con Zod: alias obligatorio, con recorte de espacios, de 1 a 80 caracteres; `nodoId` UUID. Un cuerpo inválido responde 400 y no guarda nada (CA-2; Derivado: decisión #1).
- Un UUID de nodo que no existe responde 404 y no guarda nada (CA-3).
- Un técnico recibe 403 y no se guarda nada; sin sesión, 401 (CA-4).
- El panel «Afectados» muestra a un administrador un formulario «Agregar afectado»; al guardar, la lista y el total se vuelven a leer del servidor y el total sube en uno. El técnico solo ve la lista (CA-1, CA-4).
- Sin migración ni semilla: se reutiliza la tabla `nodo_usuarios` de la HU 8, que ya limita el alias a 1–80 caracteres (Derivado: decisión #2, #4).
- Se agrega el `POST` a `contracts/openapi.yaml`, conservando las rutas existentes.

## Capabilities

### New Capabilities

- `agregar-afectado-nodo`: alta de un afectado en un nodo por la API y desde el panel de la ficha, restringida al administrador.

### Modified Capabilities

(ninguna: los requisitos de `afectados-de-nodos` no cambian; la consulta y el panel de lectura siguen igual)

## Impact

- Código: `src/modulos/afectados/` (`repo.ts`, `service.ts`, `schema.ts`, `ui/`) y `src/app/api/afectados/route.ts` (se agrega `POST`).
- Contrato: `contracts/openapi.yaml` (`POST /api/afectados` y el esquema `AfectadoCrear`).
- Datos: ninguno. No se tocan el núcleo, la página de la ficha ni `paneles.ts`.
- La HU 15 (quitar afectados) reutilizará el mismo `route.ts` y el mismo panel.
