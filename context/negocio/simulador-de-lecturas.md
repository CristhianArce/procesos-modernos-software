# simulador-de-lecturas

Comportamiento ya especificado: `vigente` (en `openspec/specs/`) o `en curso` (en un change sin archivar). Cada requisito va con su texto completo y los nombres de sus escenarios; si una versión en curso reemplaza a la vigente, queda la más reciente. Si la historia cambia uno, su delta usa `## MODIFIED Requirements` con el nombre exacto.

<!-- entrada: proposito -->
Genera lecturas simuladas de voltaje, corriente y potencia para los sensores de un nodo, por la API o por un botón de la ficha, y deja consultable la última lectura de cada sensor, para probar el tablero sin hardware real.
<!-- fin -->

<!-- entrada: requisito: Simulación de lecturas de un nodo -->
- **Simulación de lecturas de un nodo** (en curso (nodos-sensores-y-simulador)): `POST /api/simulador` SHALL registrar, para el nodo indicado en el cuerpo, una lectura nueva por cada sensor del nodo, con voltaje, corriente y potencia, y MUST responder 200 con las lecturas creadas. Si el nodo no tiene sensores SHALL responder 200 con cero lecturas. El simulador SHALL ejecutarse solo cuando se llama a la API o se pulsa el botón de la ficha (CA-6; Derivado: decisión #2, #7, #9, #10, #20).
  - Escenarios: Nodo con sensores (CA-6); Nodo sin sensores (CA-6); Botón de la interfaz (CA-6)
<!-- fin -->

<!-- entrada: requisito: Valores simulados -->
- **Valores simulados** (en curso (nodos-sensores-y-simulador)): Cada lectura simulada SHALL traer un voltaje entre 110 y 130 V, una corriente entre 0,5 y 20 A y una potencia igual al producto de ambos. Para un sensor con umbrales, alrededor de una de cada diez lecturas SHALL superar uno de sus umbrales entre un 5 % y un 20 %, para poder probar alertas (CA-6; Derivado: decisión #4, #15).
  - Escenarios: Lectura dentro del rango (CA-6); Lectura fuera del umbral (CA-6); Sensor sin umbrales (CA-6)
<!-- fin -->

<!-- entrada: requisito: Última lectura disponible -->
- **Última lectura disponible** (en curso (nodos-sensores-y-simulador)): La última lectura de cada sensor SHALL quedar disponible para consultarse: `GET /api/sensores` y `GET /api/sensores/{id}` MUST incluir en cada sensor su `ultimaLectura` (voltaje, corriente, potencia y fecha), o `null` si aún no tiene lecturas, y la ficha del nodo SHALL mostrarla (CA-6; Derivado: decisión #18).
  - Escenarios: Consultar la última lectura (CA-6); Sensor sin lecturas (CA-6)
<!-- fin -->

<!-- entrada: requisito: Acceso y validación del simulador -->
- **Acceso y validación del simulador** (en curso (nodos-sensores-y-simulador)): `POST /api/simulador` SHALL exigir sesión (401) y el rol `administrador` (403 para un técnico), MUST validar el cuerpo con Zod (400 si falta el identificador del nodo o el cuerpo no es JSON) y SHALL responder 404 si el nodo no existe. El técnico SHALL poder consultar la última lectura (CA-3, CA-4, CA-5, CA-6; Derivado: decisión #10, #11, #13).
  - Escenarios: El técnico no puede simular (CA-5); Cuerpo inválido (CA-3); Nodo inexistente (CA-4); El técnico consulta la última lectura (CA-5, CA-6)
<!-- fin -->
