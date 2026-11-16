import type { SchedulerEvent, SimulationResult, TieBreaking } from "./scheduler";

/** Semua kejadian pada batas waktu tetap terlihat, tidak ditimpa execute. */
export function narrate(result: SimulationResult, time: number, convention: TieBreaking) {
  const events = result.events.filter((event) => event.time === time);
  const messages = events.map((event) => event.message);
  if (events.some((event) => event.type === "preempt") && events.some((event) => event.type === "arrival")) {
    messages.unshift(convention === "arrivals-first"
      ? "Pada waktu seri ini, proses yang baru tiba masuk antrean lebih dulu."
      : "Pada waktu seri ini, proses yang di-preempt kembali ke antrean lebih dulu.");
  }
  if (!messages.length) messages.push("Seluruh proses telah selesai.");
  if (time > 0) messages.push(`Gantt mencatat penggunaan CPU hingga t = ${time}.`);
  return [...new Set(messages)].join(" ");
}

export function eventsAt(result: SimulationResult, time: number, processId?: string): SchedulerEvent[] {
  return result.events.filter((event) => event.time === time && (!processId || event.processId === processId));
}
