import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README y sensores de demostración.

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("#22 CA-1, CA-2: el técnico ve en el dashboard la última lectura y las tres gráficas de cada sensor", async ({ page }) => {
  await entrar(page, "tecnico", "Demo-Tecnico-2026");
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const tarjeta = page.locator("article", { has: page.getByRole("heading", { name: "Transformador principal" }) });
  await expect(tarjeta.getByTestId("ultima-lectura")).toHaveText(/V · .* A · .* W · \d{1,2}\/\d{1,2}\/\d{2,4}/);
  for (const titulo of ["Voltaje (V)", "Corriente (A)", "Potencia (W)"]) {
    await expect(tarjeta.getByText(titulo)).toBeVisible();
  }
  await expect(tarjeta.locator("figure svg[role=img]")).toHaveCount(3); // ui-scada: gráficas en SVG propio, sin Recharts
});

test("#22 CA-4: tras simular un sensor con umbral de voltaje 1, su alerta aparece primero en el dashboard", async ({ page }) => {
  const nombre = `Sensor alerta e2e ${Date.now()}`;
  await entrar(page, "admin", "Demo-Admin-2026");
  // Un nodo propio con un solo sensor: la simulación crea una sola alerta, sin empatar en fecha con otras.
  const nodo = await (await page.request.post("/api/nodos", { data: { nombre: `Nodo ${nombre}` } })).json();
  const creado = await page.request.post("/api/sensores", { data: { nodoId: nodo.id, nombre, umbralVoltaje: 1 } });
  expect(creado.status()).toBe(201);
  expect((await page.request.post("/api/simulador", { data: { nodoId: nodo.id } })).status()).toBe(200);

  await page.goto("/dashboard");

  const primera = page.getByTestId("alerta").first();
  await expect(primera).toContainText(nombre);
  await expect(primera).toContainText("voltaje");
  await expect(primera).toContainText("1 V");
});

test("#22 CA-6: sin sesión, la API de lecturas y la de alertas responden 401 en JSON", async ({ request }) => {
  for (const ruta of ["/api/lecturas", "/api/alertas"]) {
    const res = await request.get(ruta);
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: "No autenticado" });
  }
});
