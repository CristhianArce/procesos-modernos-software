# alertas-por-umbral

Comportamiento ya especificado: `vigente` (en `openspec/specs/`) o `en curso` (en un change sin archivar). Cada requisito va con su texto completo y los nombres de sus escenarios; si una versión en curso reemplaza a la vigente, queda la más reciente. Si la historia cambia uno, su delta usa `## MODIFIED Requirements` con el nombre exacto.

<!-- entrada: proposito -->
Registra una alerta cada vez que una lectura supera el umbral máximo de su sensor en una magnitud, avisa a los módulos suscritos sin que el fallo de uno impida guardar la alerta, y deja consultar las alertas por la API.
<!-- fin -->

<!-- entrada: requisito: Alerta por cada magnitud que supera su umbral -->
- **Alerta por cada magnitud que supera su umbral** (en curso (dashboard-lecturas-y-alertas)): Al registrarse una lectura, el sistema MUST crear una alerta (sensor, magnitud, valor, umbral y fecha de registro) por cada magnitud cuyo valor sea estrictamente mayor que el umbral máximo de esa magnitud en su sensor, y SHALL no crear ninguna para las magnitudes dentro del umbral o sin umbral (CA-3; Derivado: decisión #5, #9).
  - Escenarios: Lectura que supera un umbral (CA-3); Lectura dentro del umbral (CA-3); Magnitud sin umbral (CA-3); Dos magnitudes fuera de umbral (CA-3); El simulador genera alertas (CA-3)
<!-- fin -->

<!-- entrada: requisito: Aviso a los suscriptores de alertas -->
- **Aviso a los suscriptores de alertas** (en curso (dashboard-lecturas-y-alertas)): Después de guardar cada alerta, el servicio de alertas SHALL invocar a cada suscriptor de `registro.suscriptores` (los `on-alerta.ts` de los módulos) con el identificador, el sensor, la magnitud, el valor, el umbral y la fecha de la alerta. Si un suscriptor falla, el servicio MUST registrar el error en el log, conservar la alerta guardada y seguir avisando a los demás suscriptores (CA-5).
  - Escenarios: Suscriptor avisado (CA-5); Suscriptor que falla (CA-5)
<!-- fin -->

<!-- entrada: requisito: Consulta de alertas por la API -->
- **Consulta de alertas por la API** (en curso (dashboard-lecturas-y-alertas)): `GET /api/alertas` SHALL exigir sesión de administrador o técnico y MUST responder 401 en JSON sin sesión. SHALL aceptar `sensorId` (UUID, opcional) y `limite` (entero de 1 a 100, 20 por defecto), validados con Zod, y MUST responder 400 con el detalle si alguno es inválido. Con parámetros válidos SHALL responder 200 con las alertas de la más reciente a la más antigua, filtradas por sensor si se indicó (CA-4, CA-6, CA-7; Derivado: decisión #1, #2, #8).
  - Escenarios: Visitante sin sesión (CA-6); Parámetros inválidos (CA-7); Alertas de la más reciente a la más antigua (CA-4)
<!-- fin -->
