import { expect, test, type Page } from "@playwright/test";

// Rediseño SCADA (rama ui/scada). Requiere la app levantada con la semilla cargada (npm run seed), que incluye
// db/seed/topologia.sql. No necesita el simulador continuo: el CA-2 usa el botón Simular (POST /api/simulador).

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}

const mimico = (page: Page) => page.getByRole("group", { name: "Mímico de la red eléctrica" });

test("ui-scada: CA-1 el dashboard muestra el mímico con 12 nodos o más unidos por enlaces con flujo y colores por estado", async ({ page }) => {
  await entrar(page, "tecnico", "Demo-Tecnico-2026");
  await page.goto("/dashboard");
  const nodos = mimico(page).locator(".mimico-nodo");
  await expect(nodos.first()).toBeVisible();
  expect(await nodos.count()).toBeGreaterThanOrEqual(12);
  expect(await mimico(page).locator(".mimico-enlace").count()).toBeGreaterThanOrEqual(11);
  expect(await mimico(page).locator(".mimico-flujo").count()).toBeGreaterThan(0);
  await expect(mimico(page).locator('.mimico-nodo[data-estado="desconectado"]')).toHaveCount(1);
  // El color sale del estado: el trazo del símbolo de un nodo normal es el verde del tema.
  const trazo = await mimico(page).locator('.mimico-nodo[data-estado="normal"] .mimico-simbolo > *').first().evaluate((e) => getComputedStyle(e).stroke);
  expect(trazo).toBe("rgb(52, 211, 153)");
  await expect(page.locator('[id^="S:"]')).toHaveCount(0); // ningún fragmento de streaming queda duplicado
});

test("ui-scada: CA-2 una lectura que supera un umbral deja el nodo en crítico en menos de 5 s y aparece en las alarmas", async ({ page }) => {
  await entrar(page, "admin", "Demo-Admin-2026");
  const nombre = `Nodo CA-2 ${Date.now()}`;
  const nodo = await (await page.request.post("/api/nodos", { data: { nombre } })).json();
  await page.request.put(`/api/topologia/nodos/${nodo.id}`, { data: { tipo: "carga", x: 1190, y: 140 } });
  await page.request.post("/api/sensores", { data: { nodoId: nodo.id, nombre: `Sensor ${nombre}`, umbralVoltaje: 1 } });
  await page.goto("/dashboard");
  await expect(mimico(page).getByRole("button", { name: new RegExp(`^${nombre}`) })).toHaveAttribute("data-estado", "sin-datos");

  expect((await page.request.post("/api/simulador", { data: { nodoId: nodo.id } })).status()).toBe(200);
  const inicio = Date.now();
  await expect(mimico(page).getByRole("button", { name: new RegExp(`^${nombre}`) })).toHaveAttribute("data-estado", "critico", { timeout: 5000 });
  await expect(page.getByTestId("alerta").filter({ hasText: nombre }).first()).toBeVisible({ timeout: 5000 - (Date.now() - inicio) });
  expect(Date.now() - inicio).toBeLessThan(5000);

  expect((await page.request.delete(`/api/nodos/${nodo.id}`)).status()).toBe(204);
});

test("ui-scada: CA-3 con el teclado se abre el panel del nodo con medidores y minigráficas y se cierra con Esc", async ({ page }) => {
  await entrar(page, "tecnico", "Demo-Tecnico-2026");
  await page.goto("/dashboard");
  const central = mimico(page).getByRole("button", { name: /^Central Hidráulica Oriente/ });
  await central.focus();
  await page.keyboard.press("Enter");

  const panel = page.getByRole("region", { name: "Central Hidráulica Oriente" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Central Hidráulica Oriente" })).toBeFocused();
  await expect(panel.getByRole("meter")).toHaveCount(6); // dos generadores × tensión, corriente y potencia
  expect(await panel.getByRole("img").count()).toBeGreaterThanOrEqual(6);
  await expect(panel.getByRole("link", { name: "Ver ficha completa" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(central).toBeFocused();
});

test("ui-scada: CA-3 un clic en un nodo abre su panel y el botón Cerrar lo cierra", async ({ page }) => {
  await entrar(page, "tecnico", "Demo-Tecnico-2026");
  await page.goto("/dashboard");
  await mimico(page).getByRole("button", { name: /^Hospital General/ }).click();
  const panel = page.getByRole("region", { name: "Hospital General" });
  await expect(panel.getByRole("meter").first()).toBeVisible();
  await panel.getByRole("button", { name: "Cerrar panel" }).click();
  await expect(panel).toHaveCount(0);
});

test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });

  test("ui-scada: CA-6 no hay animación de flujo ni parpadeo", async ({ page }) => {
    await entrar(page, "tecnico", "Demo-Tecnico-2026");
    await page.goto("/dashboard");
    const flujo = mimico(page).locator(".mimico-flujo").first();
    await expect(flujo).toBeAttached();
    expect(await flujo.evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
    // Un nodo que parpadearía (alerta nueva) tampoco se anima.
    const simbolo = mimico(page).locator(".mimico-simbolo").first();
    await simbolo.evaluate((e) => e.closest(".mimico-nodo")!.setAttribute("data-parpadeo", "true"));
    expect(await simbolo.evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
  });
});
