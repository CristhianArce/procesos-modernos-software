import { expect, test, type Page } from "@playwright/test";
import { Pool } from "pg";

// Requiere la app levantada con la semilla cargada y DATABASE_URL de la BD de prueba (aislada del CI).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let sensor = "";

async function comoTecnico(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("tecnico");
  await page.getByLabel("Contraseña").fill("Demo-Tecnico-2026");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function noLeidas(page: Page): Promise<number> {
  const texto = (await page.getByTestId("no-leidas").textContent()) ?? "";
  const coincide = /(\d+)\s+sin leer/.exec(texto);
  expect(coincide).not.toBeNull();
  return Number(coincide![1]);
}

test.afterEach(async () => {
  if (sensor) await pool.query("DELETE FROM notificaciones WHERE sensor = $1", [sensor]);
  sensor = "";
});

test.afterAll(async () => {
  await pool.end();
});

test("#53 CA-1: el técnico marca una notificación como leída, sigue en la lista, el contador baja en uno y se conserva al recargar", async ({
  page,
}) => {
  sensor = `E2E HU13 ${Date.now()}`;
  await pool.query(
    `INSERT INTO notificaciones (destinatario_id, sensor, magnitud, valor, creada_en, leida)
     SELECT id, $1, 'voltaje', 133.7, now(), false FROM usuarios WHERE nombre_usuario = 'tecnico'`,
    [sensor],
  );

  await comoTecnico(page);
  await page.getByRole("link", { name: "Notificaciones", exact: true }).click();
  await expect(page).toHaveURL(/\/notificaciones$/);

  const fila = page.getByTestId("notificacion").filter({ hasText: sensor });
  await expect(fila).toHaveCount(1);
  await expect(fila).toContainText("Sin leer");
  const antes = await noLeidas(page);

  await fila.getByRole("button", { name: "Marcar como leída", exact: true }).click();

  await expect(fila).toContainText("Leída");
  await expect(fila).not.toContainText("Sin leer");
  await expect(fila.getByRole("button", { name: "Marcar como leída", exact: true })).toHaveCount(0);
  await expect(page.getByTestId("no-leidas")).toContainText(`${antes - 1} sin leer`);

  await page.reload();
  const recargada = page.getByTestId("notificacion").filter({ hasText: sensor });
  await expect(recargada).toHaveCount(1);
  await expect(recargada).toContainText("Leída");
  await expect(recargada.getByRole("button", { name: "Marcar como leída", exact: true })).toHaveCount(0);
  await expect(page.getByTestId("no-leidas")).toContainText(`${antes - 1} sin leer`);
});
