# Tasks

## 1. Módulo acerca

- [ ] 1.1 Crear `src/modulos/acerca/schema.ts` y `service.ts` con el texto y la versión, y verificar con una prueba unitaria (CA-1)
- [ ] 1.2 Crear `src/app/api/acerca/route.ts` con el envoltorio de `src/lib/http.ts` y `requireRole`, y verificar con pruebas de integración 200 y 401 (CA-1, CA-3)
- [ ] 1.3 Crear `src/app/(tablero)/acerca/page.tsx` y `src/modulos/acerca/menu.ts`, y verificar que el ítem aparece para un técnico (CA-2)
- [ ] 1.4 Agregar `GET /api/acerca` a `contracts/openapi.yaml` y verificar que el contrato valida (CA-1)
