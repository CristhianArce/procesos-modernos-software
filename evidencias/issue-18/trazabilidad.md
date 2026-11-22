# Trazabilidad HU 2 (#18) · Change: infraestructura-ci-cd

Los criterios de esta historia son de infraestructura: no hay pruebas de Vitest con nombre `#18 CA-n`. Cada criterio se verifica con una corrida de GitHub Actions o con un comando repetible (decisión #10 de `design.md`).

| CA | Requisito (spec) | Tareas | Archivos | Verificación |
|---|---|---|---|---|
| CA-1 | `entorno-local`: Arranque local completo; Puertos del host que no chocan | 1.1–1.6 | `Dockerfile`, `docker-compose.yml`, `db/migration/V202611211900__linea_base.sql`, `README.md` | Corrida manual del arranque en cuatro pasos y de dos entornos a la vez (tareas 1.4 y 1.5) |
| CA-2 | `entorno-local`: Variables obligatorias | 1.3 | `docker-compose.yml` | `docker compose config` sin `.env` falla nombrando `POSTGRES_USER`; sin `SESSION_SECRET` falla nombrándola |
| CA-3 | `integracion-continua`: Validación de cada PR; La imagen se construye y arranca en cada PR | 2.1, 2.2 | `.github/workflows/ci.yml` | Jobs `proyecto` e `imagen` del CI de los PR #13 y #15 |
| CA-4 | `integracion-continua`: Controles de seguridad solo al fusionar en main | 2.3 | `.github/workflows/ci.yml` | Job `seguridad` omitido en el PR #15 y en verde en la corrida de `main` tras el PR #16 (solo el camino sin hallazgos) |
| CA-5 | `publicacion-imagen`: Publicación al fusionar en main; Permisos mínimos del CD | 3.1, 3.2 | `.github/workflows/cd.yml` | Corrida del CD tras el PR #16 (etiquetas `latest` y `sha-6b816ff`); sin corridas para los PR #19 y #28, que solo tocaron `docs/` |
| CA-6 | `publicacion-imagen`: Imagen pública y ejecutable | 1.2, 3.3 | `Dockerfile`, `.github/workflows/cd.yml` | Token anónimo de `ghcr.io` (HTTP 200) y ejecución de la imagen publicada con `--platform linux/amd64` (`/api/health` responde 200) |
| CA-7 | `plantillas-y-etiquetas`: Plantillas de historia y de PR; Etiquetas del flujo | 4.1, 4.2 | `.github/ISSUE_TEMPLATE/historia.md`, `.github/PULL_REQUEST_TEMPLATE.md` | `diff` contra las plantillas de los skills y `gh label list` |

Derivados: decisión #9 (`CODEOWNERS`, verificado con `codeowners/errors` sin errores), #8 (imagen solo `amd64`).

No ejercitado: el camino con hallazgos de gitleaks o `npm audit` (CA-4) y el CD ante un fallo de publicación.
