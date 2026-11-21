import { expect, test } from "@playwright/test";

test("#2 CA-2: @smoke la app responde en /api/health", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ status: "ok" });
});
