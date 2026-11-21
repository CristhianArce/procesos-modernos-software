import { defineConfig } from "@playwright/test";

// Smoke contra una app ya levantada (npm start o docker compose): BASE_URL=http://localhost:<puerto> npm run e2e
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000" },
});
