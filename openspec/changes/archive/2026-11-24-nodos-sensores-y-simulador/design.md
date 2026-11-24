# Design

## Context

La HU 3 dejó la tabla `usuarios`, el login y las cuentas de demostración. El núcleo ya ofrece `conHttp` (`src/lib/http.ts`, traduce `ErrorHttp` y `ZodError` a JSON), `sessionFromRequest`, `requireRole` y `sesionActual` (`src/lib/dal.ts`), `db()` (`src/lib/db.ts`) y el registro de extensiones (`src/nav/registro.ts`), que descubre `menu.ts`, `paneles.ts` y `on-alerta.ts` de cada módulo con `import.meta.glob`. Hoy ningún módulo declara paneles ni existe una página que los muestre. `npm run seed` aplica los `db/seed/*.sql` en orden alfabético. No existen las tablas `nodos`, `sensores` ni `lecturas`. Ver `proposal.md` para el motivo.

Los números de las decisiones son los de `decisiones.md` de la historia: las #1 a #10 las tomó la persona y las #11 a #20 son supuestos del orquestador por revisar en el PR.

## Goals / Non-Goals

**Goals:**
- CRUD de nodos y sensores por la API, con validación, 404 y permisos por rol.
- Ficha del nodo que muestra los paneles registrados, sin que la página conozca a los módulos.
- Simulador que deja lecturas y la última lectura consultable.
- Datos de demostración para las historias siguientes.

**Non-Goals:**
- Cambiar el estado del nodo (HU 6), alertas y gráficas (HU 5), histórico y exportación (HU 9).
- Temporizador del simulador (decisión #7), contador `simulador_lecturas_total` (decisión #16), formularios de edición y eliminación (decisión #12).
- Cambiar el núcleo (`proxy.ts`, `src/lib/`, `src/nav/`, layout) o `scripts/seed.mjs`.

## Decisions

### Datos

- **Migración `db/migration/V202611222130__nodos_sensores_lecturas.sql`** (decisiones #1, #2, #3, #5). Solo agrega tablas, así que es compatible hacia atrás:
  - `nodos(id uuid primary key default gen_random_uuid(), nombre text not null, ubicacion text, estado text not null default 'conectado' check (estado in ('conectado', 'desconectado')), creado_en timestamptz not null default now())`. La columna `estado` existe desde ahora para que la HU 6 solo la cambie (RN-2).
  - `sensores(id uuid primary key default gen_random_uuid(), nodo_id uuid not null references nodos(id) on delete cascade, nombre text not null, umbral_voltaje double precision, umbral_corriente double precision, umbral_potencia double precision, creado_en timestamptz not null default now())`, con `check (umbral > 0)` en cada umbral e índice por `nodo_id`. Los umbrales son máximos y opcionales (decisión #3); la HU 5 los lee.
  - `lecturas(id uuid primary key default gen_random_uuid(), sensor_id uuid not null references sensores(id) on delete cascade, voltaje double precision not null, corriente double precision not null, potencia double precision not null, tomada_en timestamptz not null default now())`, con índice `(sensor_id, tomada_en desc)` para la última lectura.
  - `double precision` y no `numeric`: `pg` devuelve `numeric` como texto. Los `check` de longitud no se repiten en la base: la entrada ya pasa por Zod.
- **Semillas** (decisión #17). `db/seed/nodos.sql` inserta dos nodos y `db/seed/sensores.sql` sus sensores y, al final, una lectura por sensor. Usan identificadores fijos y `ON CONFLICT (id) DO NOTHING`, así que son repetibles. No hay `lecturas.sql`: por orden alfabético correría antes que `nodos.sql`.

### Módulos y capas

- **Cuatro módulos**, como sugiere el issue, cada uno dueño de su tabla y con su SQL solo en `repo.ts`:
  - `nodos`: `schema.ts`, `repo.ts`, `service.ts`, `menu.ts`, `ui/FormularioNodo.tsx`.
  - `sensores`: `schema.ts`, `repo.ts`, `service.ts`, `paneles.ts`, `ui/PanelSensores.tsx`, `ui/FormularioSensor.tsx`. Su servicio comprueba que el nodo exista con el servicio de `nodos` y agrega `ultimaLectura` con el servicio de `lecturas` (decisión #18).
  - `lecturas`: `repo.ts` (insertar varias en una sola sentencia; última por sensor con `DISTINCT ON (sensor_id)`) y `service.ts`. Sin ruta propia.
  - `simulador`: `schema.ts`, `generador.ts` (función pura con el azar inyectado), `service.ts`, `paneles.ts`, `ui/PanelSimulador.tsx`, `ui/BotonSimular.tsx`.
- **Handlers** en `src/app/api/{nodos,nodos/[id],sensores,sensores/[id],simulador}/route.ts`, todos con `conHttp` y `export const dynamic = "force-dynamic"`. Orden fijo: sesión (401), rol (403), Zod (400), servicio (404). Así un técnico recibe 403 aunque el cuerpo sea inválido (decisión #6). El cuerpo se lee con `req.json().catch(() => undefined)` para que un cuerpo que no es JSON sea 400 y no 500.
- **Identificadores** (decisión #13). El servicio valida el id con `z.uuid()`; si no es un UUID lanza `ErrorHttp(404)` sin consultar la base, y evita el error de Postgres por un UUID mal formado.
- **Validación** (decisiones #8, #14). `nombre`: texto recortado de 1 a 80 caracteres. `ubicacion`: opcional, hasta 120; `null` la borra al editar. Umbrales: número finito mayor que 0, opcional o `null`. Editar acepta un subconjunto y exige al menos un campo; `estado` y `nodoId` no son editables. `GET /api/sensores` exige el parámetro `nodoId`.
- **Respuestas** (decisión #20). Listas como arreglo, crear 201, editar 200, eliminar 204 y simulador 200 con `{ lecturas }`.

### Simulador

- **Generador** (decisiones #4, #15). `generarLectura(sensor, azar = Math.random)` devuelve voltaje en [110, 130], corriente en [0,5, 20] y potencia = voltaje × corriente, redondeados a dos decimales. Si el sensor tiene algún umbral y `azar() < 0,1`, una de las magnitudes con umbral toma `umbral × (1,05 a 1,20)`. El azar inyectado permite probar ambos casos sin depender de la suerte.
- **Servicio** (decisiones #9, #10, #11). `simular(nodoId)` comprueba el nodo (404), lista sus sensores, genera una lectura por sensor y las inserta en una sola sentencia; sin sensores devuelve una lista vacía sin tocar la base. Solo administrador.
- **Sin temporizador ni contador** (decisiones #7, #16). `conHttp` ya mide cada llamada a `/api/simulador`.

### Interfaz

- **`/nodos`** (`src/app/(tablero)/nodos/page.tsx`): Server Component dinámico que llama al servicio y muestra la lista con enlace a cada ficha; al administrador le muestra `FormularioNodo` (Client Component que llama a `POST /api/nodos` y refresca).
- **`/nodos/[id]`** (decisión #19): muestra los datos del nodo y recorre `registro.paneles`, pasando `nodoId` a cada `Componente`; si el nodo no existe llama a `notFound()`. No importa ningún módulo distinto de `nodos`, de modo que las historias siguientes agregan paneles sin editarla.
- **Paneles**: `sensores/paneles.ts` (orden 10) lista los sensores con su última lectura y, para el administrador, `FormularioSensor`; `simulador/paneles.ts` (orden 20) muestra `BotonSimular` solo al administrador. Cada panel lee la sesión con `sesionActual()`; ocultar un formulario es cosmético, porque la API verifica el rol.
- **Alcance de la interfaz** (decisión #12): crear nodo, agregar sensor y simular. Editar y eliminar quedan en la API.
- **Menú**: `nodos/menu.ts` con "Nodos", `/nodos`, ambos roles, orden 10.

### Pruebas

- Unitarias sin BD: esquemas, generador y servicios (con el repo simulado con `vi.mock`), y los formularios síncronos renderizados con `react-dom/server`.
- Integración con BD: migración (restricciones y cascada), repos, semillas y handlers con `Request` y una cookie firmada con `firmarSesion`. Cada prueba crea sus nodos y los elimina al terminar (la cascada limpia sensores y lecturas).
- Las páginas y los paneles son Server Components asíncronos: se prueban con Playwright en `e2e/nodos.spec.ts`.

### Contrato

- `contracts/openapi.yaml` suma `/api/nodos`, `/api/nodos/{id}`, `/api/sensores`, `/api/sensores/{id}` y `/api/simulador`, con los esquemas `Nodo`, `Sensor`, `Lectura` y `ErrorValidacion` en `components`, seguridad por cookie `sesion` y las respuestas 400, 401, 403 y 404. Se conservan las rutas existentes.

## Risks / Trade-offs

- [Eliminar un nodo borra en cascada sus lecturas, sin confirmación] → es la decisión #5; la interfaz no ofrece eliminar (decisión #12), solo la API para el administrador.
- [La tabla `lecturas` crece con cada simulación] → el simulador solo corre a pedido (decisión #7); el índice por sensor y fecha mantiene rápida la última lectura. El histórico es de la HU 9.
- [`sensores` depende de `nodos` y `lecturas`, y `simulador` de los tres] → las dependencias van en una sola dirección y por los servicios, no por SQL cruzado.
- [La HU 5 hereda umbrales solo máximos] → es la decisión #3; un mínimo pediría una migración nueva hacia adelante.
- [Las pruebas de integración comparten la BD de la corrida con la semilla] → usan filas propias y afirman "contiene", no conteos totales.
- [Varios supuestos del orquestador (#11 a #20)] → quedan listados en el PR para que el equipo los revise.

## Migration Plan

1. Al fusionar, el CD migra y siembra la base de Render antes de avisar al servicio: `V202611222130__nodos_sensores_lecturas.sql`, `db/seed/nodos.sql` y `db/seed/sensores.sql`.
2. Reversa: la migración solo agrega tablas, así que una imagen anterior sigue funcionando; para deshacer, una migración nueva hacia adelante las elimina.
