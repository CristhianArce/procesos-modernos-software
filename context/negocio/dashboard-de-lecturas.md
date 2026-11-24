# dashboard-de-lecturas

Comportamiento ya especificado: `vigente` (en `openspec/specs/`) o `en curso` (en un change sin archivar). Cada requisito va con su texto completo y los nombres de sus escenarios; si una versión en curso reemplaza a la vigente, queda la más reciente. Si la historia cambia uno, su delta usa `## MODIFIED Requirements` con el nombre exacto.

<!-- entrada: proposito -->
Muestra en un dashboard, a cualquier usuario con sesión, la última lectura y la gráfica de cada sensor y las alertas más recientes, para detectar de un vistazo qué parte de la red tiene problemas, y deja consultar las lecturas por la API.
<!-- fin -->

<!-- entrada: requisito: Última lectura de cada sensor en el dashboard -->
- **Última lectura de cada sensor en el dashboard** (en curso (dashboard-lecturas-y-alertas)): La página `/dashboard` SHALL mostrar, a un administrador o un técnico, una tarjeta por cada sensor con su nombre y su última lectura: el voltaje en V, la corriente en A, la potencia en W y la fecha en formato local es-CO, zona `America/Bogota`. Un sensor sin lecturas SHALL mostrar "Sin lecturas". El menú SHALL incluir la entrada "Dashboard" para ambos roles (CA-1; Derivado: decisión #3, #4, #7, #11, #12).
  - Escenarios: Sensores con lecturas (CA-1); Formato de la fecha y de los valores (CA-1)
<!-- fin -->

<!-- entrada: requisito: Gráfica de cada sensor -->
- **Gráfica de cada sensor** (en curso (dashboard-lecturas-y-alertas)): Cada sensor con lecturas SHALL mostrar en el dashboard un panel con tres gráficas pequeñas, una por magnitud (voltaje, corriente y potencia), cada una con su propio eje vertical, que trazan sus 50 lecturas más recientes ordenadas por fecha de la más antigua a la más reciente, sin selector ni otra interacción (CA-2; Derivado: decisión #12).
  - Escenarios: Las 50 lecturas más recientes (CA-2); Un trazo por magnitud con su escala (CA-2)
<!-- fin -->

<!-- entrada: requisito: Alertas en el dashboard -->
- **Alertas en el dashboard** (en curso (dashboard-lecturas-y-alertas)): El dashboard SHALL listar las 20 alertas más recientes, la más reciente primero, con la fecha, el sensor, la magnitud, el valor y el umbral con su unidad. Sin alertas SHALL mostrar "Sin alertas" (CA-4; Derivado: decisión #1, #11).
  - Escenarios: Alertas registradas (CA-4)
<!-- fin -->

<!-- entrada: requisito: Consulta de lecturas por la API -->
- **Consulta de lecturas por la API** (en curso (dashboard-lecturas-y-alertas)): `GET /api/lecturas` SHALL exigir sesión de administrador o técnico y MUST responder 401 en JSON sin sesión. SHALL aceptar `sensorId` (UUID, opcional) y `limite` (entero de 1 a 100, 50 por defecto), validados con Zod, y MUST responder 400 con el detalle si alguno es inválido. Con parámetros válidos SHALL responder 200 con las lecturas de la más reciente a la más antigua, filtradas por sensor si se indicó (CA-6, CA-7; Derivado: decisión #2, #8).
  - Escenarios: Visitante sin sesión (CA-6); Parámetros inválidos (CA-7); Lecturas de un sensor (CA-6)
<!-- fin -->
