# Fixtures del flujo SDD

Datos fijos para las pruebas de `.claude/tests/` y para las corridas reproducibles de los agentes (HU 1a, change `configuracion-ia-sdd`). Usan una historia ficticia, "Página Acerca de", con criterios CA-1 a CA-3. No forman parte de la app: lint, typecheck, Vitest y build las excluyen.

| Carpeta o archivo | Para qué |
|---|---|
| `change-ok/` | Change de OpenSpec correcto: pasa `openspec validate --strict`, y G2 debe dar `APROBADO` |
| `change-espanol/` | El mismo change con `### Requisito:`: `--strict` falla, y G2 debe dar `CORREGIR` |
| `parche-violaciones.diff` | SQL en un `service.ts` y `fetch` a la propia API en una página: `revisor-reglas` debe dar 2 `CRITICAL` |
| `trabajo-ejemplo/` | `<trabajo>` lleno (`estado.md`, `issue.md`, `agentes-log.md`, …) para los scripts del orquestador |
| `repo-ejemplo/` | Migraciones, módulos, semilla, contrato y `openspec/` (una capacidad especificada y un change activo) para `contexto.mjs` y `migracion-timestamp.mjs` |
