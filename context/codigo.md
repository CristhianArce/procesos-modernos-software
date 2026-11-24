# Código existente

Patrón a seguir y nombres reales para no explorar el repo. El módulo de referencia son rutas, no contenido: léelas antes de escribir y no copies lo que no aplique. Las firmas son la primera línea de cada `export`; abre el archivo solo si la firma no alcanza. Lo compartido se reutiliza y no se edita (un componente reutilizable nuevo va en `src/modulos/ui/`).

<!-- entrada: modulo de referencia -->
- Módulo de referencia: `topologia`
  - Repo: `src/modulos/topologia/repo.ts`
  - Service: `src/modulos/topologia/service.ts`
  - Schema: `src/modulos/topologia/schema.ts`
  - Handler: `src/app/api/topologia/route.ts`
  - Prueba de integración del handler: `src/app/api/__tests__/topologia.int.test.ts`
  - Prueba de integración del repo: `src/modulos/topologia/__tests__/semilla.int.test.ts`
  - Prueba de componente: `src/modulos/topologia/__tests__/barra-editor.test.ts`
  - Componente de ui: `src/modulos/topologia/ui/BarraEditor.tsx`
  - Helpers de prueba: `src/test/api.ts`
<!-- fin -->

<!-- entrada: firmas aislamiento/schema.ts -->
- `aislamiento/schema.ts`
  - `export const cambiarEstadoSchema`
<!-- fin -->

<!-- entrada: firmas aislamiento/repo.ts -->
- `aislamiento/repo.ts`
  - `export async function cambiarEstado(id: string, estado: EstadoNodo): Promise<CambioEstado | null>`
<!-- fin -->

<!-- entrada: firmas aislamiento/service.ts -->
- `aislamiento/service.ts`
  - `export async function cambiarEstadoNodo(id: string, estado: CambioEstado["estado"]): Promise<CambioEstado>`
<!-- fin -->

<!-- entrada: firmas alertas/schema.ts -->
- `alertas/schema.ts`
  - `export const alertasConsultaSchema`
<!-- fin -->

<!-- entrada: firmas alertas/repo.ts -->
- `alertas/repo.ts`
  - `export async function insertar(alertas: AlertaNueva[]): Promise<Alerta[]>`
  - `export async function recientes({ sensorId, limite }: ConsultaRecientes): Promise<Alerta[]>`
<!-- fin -->

<!-- entrada: firmas alertas/service.ts -->
- `alertas/service.ts`
  - `export function excesos(lectura: Lectura, sensor: Umbrales): AlertaNueva[]`
  - `export async function registrarAlertas(lecturas: Lectura[], sensores: Umbrales[]): Promise<Alerta[]>`
  - `export const listarAlertas = (consulta: ConsultaRecientes): Promise<Alerta[]> => repo.recientes(consulta);`
<!-- fin -->

<!-- entrada: firmas auth/schema.ts -->
- `auth/schema.ts`
  - `export const loginSchema`
<!-- fin -->

<!-- entrada: firmas auth/repo.ts -->
- `auth/repo.ts`
  - `export async function buscarPorNombre(nombreUsuario: string): Promise<Usuario | null>`
<!-- fin -->

<!-- entrada: firmas auth/service.ts -->
- `auth/service.ts`
  - `export const MENSAJE_CREDENCIALES`
  - `export class LimiteExcedido extends ErrorHttp`
  - `export async function iniciarSesion(…)`
<!-- fin -->

<!-- entrada: firmas estado/repo.ts -->
- `estado/repo.ts`
  - `export async function filasSensores(): Promise<FilaSensor[]>`
  - `export async function alertasActivasPorNodo(minutos: number): Promise<Map<string, number>>`
  - `export async function tendencia(minutos: number, pasoS: number): Promise<PuntoTendencia[]>`
  - `export async function alertasRecientes({ limite, nodoId }: { limite: number; nodoId?: string }): Promise<AlertaReciente[]>`
<!-- fin -->

<!-- entrada: firmas estado/service.ts -->
- `estado/service.ts`
  - `export const VENTANA_ALERTAS_MIN`
  - `export const PASO_TENDENCIA_S`
  - `export const ALERTAS_EN_INSTANTANEA`
  - `export const LECTURAS_EN_DETALLE`
  - `export const ALERTAS_EN_DETALLE`
  - `export async function instantanea(): Promise<Instantanea>`
  - `export async function instantaneaViva(): Promise<InstantaneaViva>`
  - `export async function detalleNodo(id: string): Promise<DetalleNodo>`
  - `export const filasDeSensores = () => repo.filasSensores();`
<!-- fin -->

<!-- entrada: firmas lecturas/schema.ts -->
- `lecturas/schema.ts`
  - `export const consultaRecientesSchema = (limitePorDefecto: number) =>`
  - `export const lecturasConsultaSchema`
<!-- fin -->

<!-- entrada: firmas lecturas/repo.ts -->
- `lecturas/repo.ts`
  - `export async function insertar(lecturas: LecturaNueva[]): Promise<Lectura[]>`
  - `export async function ultimasPorSensor(sensorIds: string[]): Promise<Lectura[]>`
  - `export async function recientes({ sensorId, limite }: ConsultaRecientes): Promise<Lectura[]>`
  - `export async function recientesPorSensor(sensorIds: string[], limite: number): Promise<Lectura[]>`
  - `export async function podar(minutos: number): Promise<number>`
<!-- fin -->

<!-- entrada: firmas lecturas/service.ts -->
- `lecturas/service.ts`
  - `export async function registrarLecturas(nuevas: LecturaNueva[]): Promise<Lectura[]>`
  - `export async function ultimasLecturas(sensorIds: string[]): Promise<Map<string, Lectura>>`
  - `export const listarLecturas = (consulta: ConsultaRecientes): Promise<Lectura[]> => repo.recientes(consulta);`
  - `export async function lecturasRecientesPorSensor(sensorIds: string[], limite: number): Promise<Map<string, Lectura[]>>`
  - `export const podarLecturas = (minutos: number): Promise<number> => repo.podar(minutos);`
<!-- fin -->

<!-- entrada: firmas nodos/schema.ts -->
- `nodos/schema.ts`
  - `export const esUuid = (id: string) => z.guid().safeParse(id).success;`
  - `export const nombreSchema`
  - `export const alMenosUnCampo = (datos: Record<string, unknown>) => Object.values(datos).some((v) => v !== undefined);`
  - `export const MENSAJE_SIN_CAMPOS`
  - `export const nodoCrearSchema`
  - `export const nodoEditarSchema`
<!-- fin -->

<!-- entrada: firmas nodos/repo.ts -->
- `nodos/repo.ts`
  - `export async function crear({ nombre, ubicacion }: NodoCrear): Promise<Nodo>`
  - `export async function listar(): Promise<Nodo[]>`
  - `export async function buscar(id: string): Promise<Nodo | null>`
  - `export async function actualizar(id: string, cambios: NodoEditar): Promise<Nodo | null>`
  - `export async function eliminar(id: string): Promise<boolean>`
<!-- fin -->

<!-- entrada: firmas nodos/service.ts -->
- `nodos/service.ts`
  - `export const listarNodos = (): Promise<Nodo[]> => repo.listar();`
  - `export const crearNodo = (entrada: NodoCrear): Promise<Nodo> => repo.crear(entrada);`
  - `export async function buscarNodo(id: string): Promise<Nodo | null>`
  - `export async function obtenerNodo(id: string): Promise<Nodo>`
  - `export async function editarNodo(id: string, cambios: NodoEditar): Promise<Nodo>`
  - `export async function eliminarNodo(id: string): Promise<void>`
<!-- fin -->

<!-- entrada: firmas sensores/schema.ts -->
- `sensores/schema.ts`
  - `export const sensorCrearSchema`
  - `export const sensorEditarSchema`
  - `export const sensoresConsultaSchema`
<!-- fin -->

<!-- entrada: firmas sensores/repo.ts -->
- `sensores/repo.ts`
  - `export async function crear(entrada: SensorCrear): Promise<Sensor>`
  - `export async function listarPorNodo(nodoId: string): Promise<Sensor[]>`
  - `export async function listarTodos(): Promise<Sensor[]>`
  - `export async function buscar(id: string): Promise<Sensor | null>`
  - `export async function actualizar(id: string, cambios: SensorEditar): Promise<Sensor | null>`
  - `export async function eliminar(id: string): Promise<boolean>`
<!-- fin -->

<!-- entrada: firmas sensores/service.ts -->
- `sensores/service.ts`
  - `export async function listarSensores(nodoId: string): Promise<SensorConLectura[]>`
  - `export const listarTodosLosSensores = (): Promise<Sensor[]> => repo.listarTodos();`
  - `export async function crearSensor(entrada: SensorCrear): Promise<SensorConLectura>`
  - `export async function obtenerSensor(id: string): Promise<SensorConLectura>`
  - `export async function editarSensor(id: string, cambios: SensorEditar): Promise<SensorConLectura>`
  - `export async function eliminarSensor(id: string): Promise<void>`
<!-- fin -->

<!-- entrada: firmas simulador/schema.ts -->
- `simulador/schema.ts`
  - `export const simularSchema`
<!-- fin -->

<!-- entrada: firmas simulador/service.ts -->
- `simulador/service.ts`
  - `export async function simular(nodoId: string, azar: () => number = Math.random): Promise<Lectura[]>`
<!-- fin -->

<!-- entrada: firmas topologia/schema.ts -->
- `topologia/schema.ts`
  - `export const posicionSchema`
  - `export const enlaceCrearSchema`
<!-- fin -->

<!-- entrada: firmas topologia/repo.ts -->
- `topologia/repo.ts`
  - `export async function listarNodos(): Promise<NodoTopologia[]>`
  - `export async function listarEnlaces(): Promise<Enlace[]>`
  - `export async function guardarPosicion(nodoId: string, { tipo, x, y }: Posicion): Promise<PosicionGuardada>`
  - `export async function crearEnlace({ origenId, destinoId }: EnlaceCrear): Promise<Enlace | null>`
  - `export async function eliminarEnlace(id: string): Promise<boolean>`
<!-- fin -->

<!-- entrada: firmas topologia/service.ts -->
- `topologia/service.ts`
  - `export async function obtenerTopologia(): Promise<Topologia>`
  - `export async function posicionarNodo(nodoId: string, posicion: Posicion): Promise<PosicionGuardada>`
  - `export async function crearEnlace(entrada: EnlaceCrear): Promise<Enlace>`
  - `export async function eliminarEnlace(id: string): Promise<void>`
<!-- fin -->

<!-- entrada: compartido src/lib/dal.ts -->
- Compartido `src/lib/dal.ts`
  - `export async function sessionFromRequest(req: Request): Promise<Sesion>`
  - `export function requireRole(sesion: Sesion, ...roles: Rol[]): Sesion`
  - `export async function sesionActual(): Promise<Sesion | null>`
<!-- fin -->

<!-- entrada: compartido src/lib/db.ts -->
- Compartido `src/lib/db.ts`
  - `export function db(): TipoPool`
<!-- fin -->

<!-- entrada: compartido src/lib/errores.ts -->
- Compartido `src/lib/errores.ts`
  - `export class ErrorHttp extends Error`
<!-- fin -->

<!-- entrada: compartido src/lib/http.ts -->
- Compartido `src/lib/http.ts`
  - `export const errorJson = (estado: number, error: string) => Response.json({ error }, { status: estado });`
  - `export function conHttp<C = unknown>(…)`
<!-- fin -->

<!-- entrada: compartido src/lib/logger.ts -->
- Compartido `src/lib/logger.ts`
  - `export function crearLogger(destino?: DestinationStream, nivel = process.env.LOG_LEVEL ?? "info")`
  - `export const logger`
<!-- fin -->

<!-- entrada: compartido src/lib/metrics.ts -->
- Compartido `src/lib/metrics.ts`
  - `export const metricas`
  - `export function registrarPeticion(metodo: string, ruta: string, estado: number, segundos: number)`
<!-- fin -->

<!-- entrada: compartido src/lib/session.ts -->
- Compartido `src/lib/session.ts`
  - `export const ROLES`
  - `export const COOKIE_SESION`
  - `export const DURACION_SESION_S`
  - `export function firmarSesion(sesion: Sesion, ahora = Math.floor(Date.now() / 1000))`
  - `export async function verificarSesion(token: string | undefined): Promise<Sesion | null>`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/Cargando.tsx -->
- Compartido `src/modulos/ui/Cargando.tsx`
  - `export function Cargando({ etiqueta = "Cargando…" }: { etiqueta?: string })`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/EstadoError.tsx -->
- Compartido `src/modulos/ui/EstadoError.tsx`
  - `export function EstadoError({ titulo = "No se pudo cargar esta pantalla", detalle, onReintentar }: Props)`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/EstadoVacio.tsx -->
- Compartido `src/modulos/ui/EstadoVacio.tsx`
  - `export function EstadoVacio({ titulo, children, accion, icono = "nodos" }: Props)`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/GraficaLinea.tsx -->
- Compartido `src/modulos/ui/GraficaLinea.tsx`
  - `export function GraficaLinea({ valores, etiqueta, ancho = 220, alto = 100 }: Props)`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/Icono.tsx -->
- Compartido `src/modulos/ui/Icono.tsx`
  - `export function Icono({ nombre, tamano = 20, className }: { nombre: NombreIcono; tamano?: number; className?: string })`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/IconoEstado.tsx -->
- Compartido `src/modulos/ui/IconoEstado.tsx`
  - `export function IconoEstado({ estado, tamano = 14 }: { estado: Estado; tamano?: number })`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/IndicadorEstado.tsx -->
- Compartido `src/modulos/ui/IndicadorEstado.tsx`
  - `export function IndicadorEstado({ estado, etiqueta }: { estado: Estado; etiqueta?: string })`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/Insignia.tsx -->
- Compartido `src/modulos/ui/Insignia.tsx`
  - `export function Insignia({ tono, children }: { tono: Tono; children: ReactNode })`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/Medidor.tsx -->
- Compartido `src/modulos/ui/Medidor.tsx`
  - `export function Medidor({ etiqueta, valor, umbral, unidad }: Props)`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/Sparkline.tsx -->
- Compartido `src/modulos/ui/Sparkline.tsx`
  - `export function Sparkline({ valores, etiqueta, ancho = 120, alto = 28, className = "text-acento" }: Props)`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/Tarjeta.tsx -->
- Compartido `src/modulos/ui/Tarjeta.tsx`
  - `export function Tarjeta({ titulo, acciones, children, className = "" }: Props)`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/escala-medidor.ts -->
- Compartido `src/modulos/ui/escala-medidor.ts`
  - `export function escalaMedidor(valor: number | null, umbral: number | null): EscalaMedidor`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/estado.ts -->
- Compartido `src/modulos/ui/estado.ts`
  - `export const ORDEN_ESTADOS`
  - `export const ESTADOS`
  - `export const FRACCION_ADVERTENCIA`
  - `export function nivelFrenteAUmbral(valor: number | null, umbral: number | null): Estado`
  - `export const peorEstado = (estados: readonly Estado[]): Estado =>`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/formato.ts -->
- Compartido `src/modulos/ui/formato.ts`
  - `export const formatoPotencia`
  - `export const formatoTension`
  - `export const formatoCorriente`
  - `export const cifraConUnidad = (valor: number, unidad: string) => `${N2.format(valor)} ${unidad}`;`
<!-- fin -->

<!-- entrada: compartido src/modulos/ui/trazo-sparkline.ts -->
- Compartido `src/modulos/ui/trazo-sparkline.ts`
  - `export function trazoSparkline(valores: readonly number[], ancho: number, alto: number): string`
<!-- fin -->

<!-- entrada: compartido src/test/api.ts -->
- Compartido `src/test/api.ts`
  - `export async function peticion(metodo: string, ruta: string, { rol, cuerpo, crudo }: Opciones = {}): Promise<Request>`
  - `export const conId = (id: string) => ({ params: Promise.resolve({ id }) });`
<!-- fin -->
