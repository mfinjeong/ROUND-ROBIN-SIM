import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/browser-results.json" }]],
  use: { baseURL: process.env.TEST_BASE_URL ?? "http://localhost:3003", channel: "msedge", headless: true },
  webServer: process.env.TEST_BASE_URL ? undefined : {
    command: "npm run start -- --port 3003",
    url: "http://localhost:3003",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
