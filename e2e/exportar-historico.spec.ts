import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed), que incluye db/seed/historico.sql:
// «Nodo histórico demo» con «Medidor histórico A» (26 lecturas del 2026-01-10 al 2026-01-12, hora de Bogotá).
// La prueba solo lee: no crea ni cambia datos, y solo afirma filas acotadas por ese nodo, sensor y rango.
const NODO = "Nodo histórico demo";
const SENSOR_A = "Nodo histórico demo · Medidor histórico A";
const ENCABEZADO = "nodo,sensor,voltaje,corriente,potencia,fecha";
const NODO_ID = "b15e0000-0000-4000-8000-000000000901";
const SENSOR_A_ID = "b15e0000-0000-4000-8000-000000000911";

// Expectativa fija de la semilla: lectura n (1..26) = 2026-01-10 08:00 Bogotá (13:00 UTC) + (n - 1) * 2 h,
// voltaje 120 + n / 10, corriente 5, potencia 600. Más reciente primero.
const BASE_UTC = Date.UTC(2026, 0, 10, 13, 0, 0);
const ESPERADAS = Array.from({ length: 26 }, (_, i) => 26 - i).map((n) => ({
  nodo: NODO,
  sensor: "Medidor histórico A",
  voltaje: (1200 + n) / 10,
  corriente: 5,
  potencia: 600,
  fecha: new Date(BASE_UTC + (n - 1) * 2 * 3600 * 1000).toISOString(),
}));

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function filtrar(page: Page, desde: string, hasta: string) {
  const form = page.getByTestId("filtros-historico");
  await form.getByLabel("Nodo", { exact: true }).selectOption({ label: NODO });
  await form.getByLabel("Sensor", { exact: true }).selectOption({ label: SENSOR_A });
  await form.getByLabel("Desde", { exact: true }).fill(desde);
  await form.getByLabel("Hasta", { exact: true }).fill(hasta);
  await form.getByRole("button", { name: "Filtrar", exact: true }).click();
}

function lineas(csv: string): string[] {
  return csv.split("\r\n").filter((l) => l.length > 0);
}

test("#56 CA-1: el usuario filtra, exporta y descarga historico.csv con las 26 lecturas del filtro", async ({ page }) => {
  await entrar(page, "admin", "Demo-Admin-2026");
  await page.getByRole("link", { name: "Histórico", exact: true }).click();
  await expect(page).toHaveURL(/\/historico/);
  await filtrar(page, "2026-01-10", "2026-01-12");
  await expect(page.getByTestId("historico-total")).toHaveText("26");

  const enlace = page.getByTestId("exportar-csv");
  await expect(enlace).toContainText("Exportar CSV");
  const [descarga] = await Promise.all([page.waitForEvent("download"), enlace.click()]);
  expect(descarga.suggestedFilename()).toBe("historico.csv");

  const ruta = await descarga.path();
  const csv = await readFile(ruta, "utf8");
  const filas = lineas(csv);
  expect(filas[0]).toBe(ENCABEZADO);
  expect(filas.length).toBe(1 + ESPERADAS.length);

  const obtenidas = filas.slice(1).map((l) => {
    const [nodo, sensor, voltaje, corriente, potencia, fecha] = l.split(",");
    return { nodo, sensor, voltaje: Number(voltaje), corriente: Number(corriente), potencia: Number(potencia), fecha };
  });
  expect(obtenidas).toEqual(ESPERADAS);
});

test("#56 CA-2: un filtro sin resultados exportado por la API trae solo el encabezado", async ({ page }) => {
  await entrar(page, "tecnico", "Demo-Tecnico-2026");
  const res = await page.request.get(
    `/api/historico/exportar?nodoId=${NODO_ID}&sensorId=${SENSOR_A_ID}&desde=2026-02-01&hasta=2026-02-02`,
  );
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const texto = await res.text();
  expect(lineas(texto)).toEqual([ENCABEZADO]);
});

test("#56 CA-4: GET /api/historico/exportar sin sesión responde 401 en JSON", async ({ request }) => {
  const res = await request.get("/api/historico/exportar");
  expect(res.status()).toBe(401);
  expect(res.headers()["content-type"]).toContain("application/json");
});
