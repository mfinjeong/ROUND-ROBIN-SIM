import { describe, expect, it } from "vitest";
import { assetCredits } from "./assets";

describe("kredit aset", () => {
  it("menyediakan kredit lengkap tanpa membaca Markdown saat build", () => {
    expect(assetCredits.length).toBeGreaterThanOrEqual(5);
    expect(assetCredits.every((asset) => asset.filename && asset.author && asset.source && asset.license && asset.date)).toBe(true);
    expect(assetCredits.some((asset) => asset.source.includes("github.com/recharts"))).toBe(true);
  });
});
