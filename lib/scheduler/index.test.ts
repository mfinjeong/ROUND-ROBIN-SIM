import { describe, expect, it } from "vitest";
import { simulateRoundRobin, type ProcessInput } from "./index";

const reference: ProcessInput[] = [
  { id: "P1", arrivalTime: 0, burstTime: 5 },
  { id: "P2", arrivalTime: 1, burstTime: 3 },
  { id: "P3", arrivalTime: 2, burstTime: 6 },
  { id: "P4", arrivalTime: 4, burstTime: 2 },
];

const labels = (result: ReturnType<typeof simulateRoundRobin>) =>
  result.gantt.map((block) => block.processId ?? "idle");

describe("mesin Round Robin", () => {
  it("menolak masukan editor yang tidak valid", () => {
    expect(() => simulateRoundRobin([{ id: "P1", arrivalTime: 0, burstTime: 0 }], 2)).toThrow(/Arrival|burst/);
    expect(() => simulateRoundRobin([{ id: "P1", arrivalTime: 31, burstTime: 1 }], 2)).toThrow(/Arrival/);
    expect(() => simulateRoundRobin([{ id: "P1", arrivalTime: 0, burstTime: 1 }, { id: "P1", arrivalTime: 0, burstTime: 1 }], 2)).toThrow(/unik/);
    expect(() => simulateRoundRobin(reference, 2, { contextSwitchCost: 3 })).toThrow(/context switch/);
    expect(() => simulateRoundRobin(Array.from({ length: 9 }, (_, index) => ({ id: `P${index + 1}`, arrivalTime: 0, burstTime: 1 })), 2)).toThrow(/8/);
  });
  it("menyediakan tepat satu snapshot tiap waktu saat context switch berbiaya", () => {
    const result = simulateRoundRobin([
      { id: "P1", arrivalTime: 0, burstTime: 1 },
      { id: "P2", arrivalTime: 0, burstTime: 2 },
      { id: "P3", arrivalTime: 2, burstTime: 1 },
    ], 2, { contextSwitchCost: 2 });
    expect(result.snapshots.map((snapshot) => snapshot.time)).toEqual(
      Array.from({ length: result.duration + 1 }, (_, index) => index),
    );
    const atTwo = result.snapshots[2];
    expect(atTwo.notArrived).not.toContain("P3");
    expect(atTwo.readyQueue).toContain("P3");
    expect(result.duration).toBe(8);
    expect(result.metrics.contextSwitches).toBe(2);
    expect(result.metrics.perProcess.P2.responseTime).toBe(3);
    expect(result.metrics.perProcess.P3.responseTime).toBe(5);
    for (const snapshot of result.snapshots) {
      expect(snapshot.gantt.every((block) => block.end <= snapshot.time)).toBe(true);
    }
  });
  it("menghasilkan contoh acuan PRD 7.1 secara persis", () => {
    const result = simulateRoundRobin(reference, 2);

    expect(labels(result)).toEqual(["P1", "P2", "P3", "P1", "P4", "P2", "P3", "P1", "P3"]);
    expect(result.gantt.map(({ start, end }) => [start, end])).toEqual([
      [0, 2], [2, 4], [4, 6], [6, 8], [8, 10], [10, 11], [11, 13], [13, 14], [14, 16],
    ]);
    expect(result.metrics.perProcess).toEqual({
      P1: { completionTime: 14, turnaroundTime: 14, waitingTime: 9, responseTime: 0 },
      P2: { completionTime: 11, turnaroundTime: 10, waitingTime: 7, responseTime: 1 },
      P3: { completionTime: 16, turnaroundTime: 14, waitingTime: 8, responseTime: 2 },
      P4: { completionTime: 10, turnaroundTime: 6, waitingTime: 4, responseTime: 4 },
    });
    expect(result.metrics.averages).toEqual({ turnaroundTime: 11, waitingTime: 7, responseTime: 1.75 });
    expect(result.metrics.contextSwitches).toBe(8);
  });

  it("menampilkan CPU idle ketika belum ada proses yang tiba", () => {
    const result = simulateRoundRobin([
      { id: "P1", arrivalTime: 2, burstTime: 1 },
      { id: "P2", arrivalTime: 4, burstTime: 1 },
    ], 2);

    expect(labels(result)).toEqual(["idle", "P1", "idle", "P2"]);
    expect(result.gantt.map(({ start, end }) => [start, end])).toEqual([[0, 2], [2, 3], [3, 4], [4, 5]]);
    expect(result.metrics.perProcess.P1.completionTime).toBe(3);
    expect(result.metrics.perProcess.P2.completionTime).toBe(5);
  });

  it("menguji kedua konvensi aturan seri", () => {
    const processes = [
      { id: "P1", arrivalTime: 0, burstTime: 3 },
      { id: "P2", arrivalTime: 2, burstTime: 1 },
    ];
    const arrivalsFirst = simulateRoundRobin(processes, 2, { tieBreaking: "arrivals-first" });
    const preemptedFirst = simulateRoundRobin(processes, 2, { tieBreaking: "preempted-first" });

    expect(labels(arrivalsFirst)).toEqual(["P1", "P2", "P1"]);
    // Pada konvensi ini P1 kembali lebih dulu dan langsung melanjutkan,
    // sehingga dua segmennya menyatu sebagai satu blok Gantt.
    expect(labels(preemptedFirst)).toEqual(["P1", "P2"]);
    expect(arrivalsFirst.metrics.perProcess.P2.responseTime).toBe(0);
    expect(preemptedFirst.metrics.perProcess.P2.responseTime).toBe(1);
    expect(arrivalsFirst.events.find((event) => event.type === "dispatch" && event.processId === "P2")?.time).toBe(2);
    expect(preemptedFirst.events.find((event) => event.type === "dispatch" && event.processId === "P2")?.time).toBe(3);
  });

  it("menangani quantum yang lebih besar atau sama dengan burst terbesar seperti FCFS", () => {
    const result = simulateRoundRobin([
      { id: "P1", arrivalTime: 0, burstTime: 3 },
      { id: "P2", arrivalTime: 0, burstTime: 2 },
      { id: "P3", arrivalTime: 1, burstTime: 1 },
    ], 3);

    expect(labels(result)).toEqual(["P1", "P2", "P3"]);
    expect(result.metrics.contextSwitches).toBe(2);
    expect(result.metrics.perProcess.P1.completionTime).toBe(3);
    expect(result.metrics.perProcess.P2.completionTime).toBe(5);
    expect(result.metrics.perProcess.P3.completionTime).toBe(6);
  });

  it("menangani satu proses tanpa context switch", () => {
    const result = simulateRoundRobin([{ id: "P1", arrivalTime: 0, burstTime: 5 }], 2);

    expect(labels(result)).toEqual(["P1"]);
    expect(result.metrics.perProcess.P1).toEqual({
      completionTime: 5,
      turnaroundTime: 5,
      waitingTime: 0,
      responseTime: 0,
    });
    expect(result.metrics.contextSwitches).toBe(0);
    expect(result.metrics.cpuUtilization).toBe(100);
  });
});
