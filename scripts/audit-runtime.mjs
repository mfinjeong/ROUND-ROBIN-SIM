import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const browser = await chromium.launch({ channel: "msedge" });
const results = [];
try {
  for (const route of ["/", "/simulator", "/lab"]) {
    const context = await browser.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__lcp = null;
      new PerformanceObserver((list) => { window.__lcp = list.getEntries().at(-1).startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    await page.goto((process.env.TEST_BASE_URL ?? "http://localhost:3003") + route);
    await page.locator("h1").waitFor();
    await page.waitForTimeout(2500);
    const metrics = await page.evaluate(() => ({
      lcpMs: window.__lcp,
      // Network sizes include only scripts actually loaded, not lazy chunks.
      scriptTransferBytes: performance.getEntriesByType("resource").filter((entry) => entry.initiatorType === "script").reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      lcpUnder2500ms: window.__lcp !== null && window.__lcp < 2500,
    }));
    results.push({ route, environment: "Edge headless; 360×900; simulated 1.6 Mbps/150ms; CPU 4x", ...metrics });
    await context.close();
  }
} finally {
  await browser.close();
}
mkdirSync("test-results", { recursive: true });
writeFileSync("test-results/runtime-audit.json", JSON.stringify(results, null, 2));
console.table(results);
