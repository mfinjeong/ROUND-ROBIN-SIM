import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("audit WCAG A/AA seluruh halaman", async ({ page }) => {
  for (const route of ["/", "/simulator", "/lab", "/aturan", "/tentang"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), route).toEqual([]);
  }
});

test("sinkronisasi scrub cepat, maju/mundur, kecepatan dan putar/jeda", async ({ page }) => {
  await page.goto("/simulator");
  const timeline = page.getByRole("slider", { name: "Garis waktu", exact: true });
  for (const time of [2, 7, 1, 14, 4, 0, 16, 2]) {
    await timeline.fill(String(time));
    await expect(page.locator(".time-display")).toHaveText(`t = ${time}`);
    const times = await page.locator("[data-time]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-time")));
    expect(new Set(times)).toEqual(new Set([String(time)]));
    const ends = await page.locator(".gantt-block[data-end]").evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute("data-end"))));
    expect(ends.every((end) => end <= time)).toBe(true);
  }
  await expect(page.locator("[data-zone=readyQueue]")).toContainText("P1");
  await expect(page.locator("[data-cpu]")).toHaveAttribute("data-cpu", "P2");
  await expect(page.getByRole("status")).toContainText("di-preempt");
  await expect(page.getByRole("status")).toContainText("baru tiba");
  await page.getByRole("button", { name: "Langkah maju" }).press("Space");
  await expect(page.locator(".time-display")).toHaveText("t = 3");
  await expect(page.getByRole("button", { name: "Putar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Langkah mundur" }).press("Enter");
  await expect(page.locator(".time-display")).toHaveText("t = 2");
  await page.getByRole("button", { name: "Putar", exact: true }).click();
  await page.getByRole("combobox", { name: "Kecepatan simulasi" }).selectOption("4");
  await expect(page.locator(".time-display")).toHaveText("t = 3");
  await page.getByRole("button", { name: "Jeda", exact: true }).click();
  const paused = await timeline.inputValue();
  await page.waitForTimeout(450);
  await expect(timeline).toHaveValue(paused);
  await timeline.fill("16");
  await expect(page.locator("tbody tr").first()).toContainText("14");
  await expect(page.locator("tfoot")).toContainText("1,75");
  await page.getByRole("radio", { name: "Proses preempt lebih dulu" }).check();
  await timeline.fill("2");
  await expect(page.getByRole("status")).toContainText("kembali ke antrean lebih dulu");
});

test("validasi editor, ID unik, satu dan delapan proses, idle", async ({ page }) => {
  await page.goto("/simulator");
  await page.getByRole("spinbutton", { name: "Kedatangan (arrival) P1", exact: true }).fill("1.5");
  await expect(page.locator("[aria-invalid=true]")).toHaveCount(1);
  await expect(page.getByText(/Simulasi tetap memakai nilai valid terakhir/)).toBeVisible();
  await page.getByRole("spinbutton", { name: "Kedatangan (arrival) P1", exact: true }).fill("31");
  await expect(page.locator("[aria-invalid=true]")).toHaveCount(1);
  await page.getByRole("spinbutton", { name: "Kedatangan (arrival) P1", exact: true }).fill("0");
  await page.getByRole("button", { name: "Hapus P2", exact: true }).click();
  await page.getByRole("button", { name: "Tambah", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: "Kedatangan (arrival) P2", exact: true })).toHaveCount(1);
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Tambah", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tambah", exact: true })).toBeDisabled();
  await expect(page.locator(".process-editor")).toHaveCount(8);
  for (const id of ["P8", "P7", "P6", "P5", "P4", "P3", "P2"]) await page.getByRole("button", { name: `Hapus ${id}`, exact: true }).click();
  await expect(page.getByRole("button", { name: "Hapus P1", exact: true })).toBeDisabled();
  await page.getByRole("spinbutton", { name: "Kedatangan (arrival) P1", exact: true }).fill("30");
  await page.getByRole("slider", { name: "Garis waktu", exact: true }).fill("20");
  await expect(page.locator(".cpu-content")).toContainText("CPU menganggur");
  await expect(page.locator(".gantt-block")).toHaveAttribute("data-process", "idle");
});

test("ponsel: tab papan ketik, panggung dahulu, scroll Gantt; lebar semua halaman", async ({ page }) => {
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/simulator", "/lab", "/aturan", "/tentang"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} ${width}`).toBe(true);
    }
  }
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/simulator");
  await page.getByRole("tab", { name: "Proses", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Pengaturan", exact: true })).toBeFocused();
  await expect(page.getByRole("slider", { name: "Jatah waktu (quantum)" })).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Metrik", exact: true })).toBeFocused();
  await expect(page.getByRole("table")).toBeVisible();
  const scroll = page.getByRole("region", { name: "Gantt, dapat digulir mendatar", exact: true });
  await scroll.focus();
  await page.keyboard.press("ArrowRight");
  expect(await scroll.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
});

test("reduced motion fade dan keyframes hanya compositor", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/simulator");
  await page.getByRole("button", { name: "Langkah maju" }).click();
  const frames = await page.evaluate(() => document.getAnimations().flatMap((animation) => (animation.effect as KeyframeEffect).getKeyframes()));
  expect(frames.every((frame) => !("transform" in frame))).toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Langkah maju" }).click();
  const properties = await page.evaluate(() => document.getAnimations().flatMap((animation) => (animation.effect as KeyframeEffect).getKeyframes().flatMap(Object.keys)));
  expect(properties.filter((property) => !["opacity", "transform", "offset", "computedOffset", "easing", "composite"].includes(property))).toEqual([]);
});

async function tabTo(page: Page, name: string) {
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate((targetName) => {
      const el = document.activeElement;
      return el?.getAttribute("aria-label") === targetName || el?.textContent?.trim() === targetName;
    }, name)) return;
  }
  throw new Error(`Kontrol keyboard tidak ditemukan: ${name}`);
}

test("alur utama keyboard tanpa klik", async ({ page }) => {
  await page.goto("/");
  await tabTo(page, "Coba sendiri");
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toHaveText("Simulator Round Robin");
  await tabTo(page, "Putar");
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Jeda", exact: true })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Putar", exact: true })).toBeVisible();
  await tabTo(page, "Langkah maju");
  await page.keyboard.press("Space");
  await expect(page.locator(".time-display")).toHaveText("t = 1");
  await tabTo(page, "Lab quantum");
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toHaveText("Laboratorium Quantum");
  await tabTo(page, "Putar bersama");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Jeda", exact: true })).toBeVisible();
});

test("animasi aktif mengikuti kecepatan, jeda, dan dibatalkan scrub", async ({ page }) => {
  await page.goto("/simulator");
  await page.getByRole("button", { name: "Putar", exact: true }).click();
  await expect(page.locator(".time-display")).toHaveText("t = 1");
  await page.getByRole("combobox", { name: "Kecepatan simulasi" }).selectOption("0.5");
  const rates = await page.evaluate(async () => {
    const animations = document.getAnimations().filter((animation) => ((animation.effect as KeyframeEffect).target as Element)?.closest(".stage-shell,.gantt-track"));
    await Promise.all(animations.map((animation) => animation.ready));
    return animations.map((animation) => animation.playbackRate);
  });
  expect(rates.length).toBeGreaterThan(0);
  expect(rates.every((rate) => rate === 0.5)).toBe(true);
  await page.getByRole("button", { name: "Jeda", exact: true }).click();
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => ((animation.effect as KeyframeEffect).target as Element)?.closest(".stage-shell,.gantt-track")).every((animation) => animation.playState === "paused" || animation.playState === "finished"))).toBe(true);
  await page.getByRole("slider", { name: "Garis waktu", exact: true }).fill("7");
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running").length)).toBe(0);
});

test("grafik lazy dan kontras setelah grafik terlihat; audit ponsel", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.locator(".recharts-line")).toHaveCount(0);
  await page.getByRole("heading", { name: "Pengaruh quantum, dari 1 sampai 10" }).scrollIntoViewIfNeeded();
  await expect(page.locator(".recharts-line")).toHaveCount(3);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/simulator");
  for (const name of ["Proses", "Pengaturan", "Narasi", "Metrik"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), name).toEqual([]);
  }
});

test("SVG CPU statis tidak dimutasi tiap tick", async ({ page }) => {
  await page.goto("/simulator");
  await page.evaluate(() => {
    (window as unknown as { cpuMutations: number }).cpuMutations = 0;
    const node = document.querySelector(".cpu-frame")!;
    new MutationObserver((records) => { (window as unknown as { cpuMutations: number }).cpuMutations += records.length; }).observe(node, { attributes: true, childList: true, characterData: true, subtree: true });
  });
  await page.getByRole("slider", { name: "Garis waktu", exact: true }).fill("7");
  expect(await page.evaluate(() => (window as unknown as { cpuMutations: number }).cpuMutations)).toBe(0);
});

test("pengantar replay, editor, radio dan tab dapat dioperasikan keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Adegan 6", exact: true }).focus();
  expect(await page.getByRole("button", { name: "Adegan 6", exact: true }).evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Selesai setelah kebutuhannya terpenuhi" })).toBeVisible();
  await page.getByRole("button", { name: "Putar ulang pengantar", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Setiap penumpang adalah proses" })).toBeVisible();
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/simulator");
  await page.getByRole("spinbutton", { name: "Kedatangan (arrival) P1", exact: true }).focus();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("3");
  await expect(page.locator(".cpu-content")).toContainText("CPU menganggur");
  await page.getByRole("tab", { name: "Proses", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Tab");
  // Nilai slider dapat diubah tanpa pointer.
  await page.getByRole("slider", { name: "Jatah waktu (quantum)" }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("slider", { name: "Jatah waktu (quantum)" })).toHaveValue("10");
  await page.getByRole("radio", { name: "Proses baru tiba lebih dulu" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: "Proses preempt lebih dulu" })).toBeChecked();
  // Live region tetap ada walaupun tab Narasi tidak sedang ditampilkan.
  await expect(page.getByRole("status")).toContainText("t = 0");
});

test("laboratorium memakai tiga panel bersama dan tabel alternatif", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.locator(".lab-comparisons > section")).toHaveCount(3);
  await page.getByRole("combobox", { name: "Skenario bawaan" }).selectOption("3");
  await page.getByRole("slider", { name: "Waktu perbandingan" }).fill("16");
  const reference = page.locator(".lab-comparisons > section").nth(1);
  await expect(reference).toContainText("1.75");
  await expect(reference).toContainText("Context switch");
  await expect(reference.locator("dd").last()).toHaveText("8");
  await page.getByText("Lihat data grafik", { exact: true }).press("Enter");
  await expect(page.locator("details table tbody tr")).toHaveCount(10);
  await page.getByRole("button", { name: "Putar bersama", exact: true }).press("Space");
  await expect(page.getByRole("button", { name: "Jeda", exact: true })).toBeVisible();
});
