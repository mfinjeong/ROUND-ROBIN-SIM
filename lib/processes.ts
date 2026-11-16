import type { ProcessInput } from "./scheduler";

export const processShapes = ["circle", "square", "triangle", "diamond", "pentagon", "hexagon", "star", "cross"] as const;
export type ProcessShapeName = typeof processShapes[number];
export const processColors = ["#f4a261", "#e76f51", "#2a9d8f", "#8ab17d", "#e9c46a", "#577590", "#b56576", "#6d597a"];

export function processAppearance(id: string) {
  const index = Math.max(0, Number(id.replace("P", "")) - 1) % 8;
  return { shape: processShapes[index], color: processColors[index] };
}

export function nextProcessId(processes: readonly ProcessInput[]) {
  return Array.from({ length: 8 }, (_, index) => `P${index + 1}`)
    .find((id) => !processes.some((process) => process.id === id)) ?? null;
}

export function validateProcessValue(raw: string, field: "arrivalTime" | "burstTime") {
  const min = field === "arrivalTime" ? 0 : 1;
  const max = field === "arrivalTime" ? 30 : 20;
  const value = Number(raw);
  return raw.trim() !== "" && /^\d+$/.test(raw) && Number.isSafeInteger(value) && value >= min && value <= max
    ? { value, error: "" }
    : { value: null, error: `Masukkan bilangan bulat ${min}–${max}.` };
}
