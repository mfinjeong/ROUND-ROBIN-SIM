import { describe, expect, it } from "vitest";
import { nextProcessId, processShapes, validateProcessValue } from "./processes";
import { narrate } from "./narration";
import { simulateRoundRobin } from "./scheduler";

describe("kasus tepi pemolesan", () => {
  it("ID setelah hapus/tambah tetap unik dan ada delapan bentuk", () => {
    expect(nextProcessId([{ id: "P1", arrivalTime: 0, burstTime: 1 }, { id: "P3", arrivalTime: 0, burstTime: 1 }])).toBe("P2");
    expect(new Set(processShapes).size).toBe(8);
  });
  it("menolak kosong, pecahan, negatif, tak hingga, eksponen dan nilai di luar batas", () => {
    for (const raw of ["", "-1", "1.5", "Infinity", "1e2", "31", "NaN"]) expect(validateProcessValue(raw, "arrivalTime").value).toBeNull();
    for (const raw of ["0", "21", "1.5"]) expect(validateProcessValue(raw, "burstTime").value).toBeNull();
    expect(validateProcessValue("30", "arrivalTime").value).toBe(30);
    expect(validateProcessValue("20", "burstTime").value).toBe(20);
  });
  it("narasi seri mempertahankan preempsi dan kedua konvensi", () => {
    const processes = [{ id: "P1", arrivalTime: 0, burstTime: 3 }, { id: "P2", arrivalTime: 2, burstTime: 1 }];
    for (const convention of ["arrivals-first", "preempted-first"] as const) {
      const result = simulateRoundRobin(processes, 2, { tieBreaking: convention });
      const message = narrate(result, 2, convention);
      expect(message).toContain("lebih dulu");
      expect(message).toContain("di-preempt");
      expect(message).toContain("P2 tiba");
      expect(message).toContain(convention === "arrivals-first" ? "baru tiba" : "kembali ke antrean");
    }
  });
  it("delapan proses serentak tetap FIFO dan quantum besar menyerupai FCFS", () => {
    const processes = Array.from({ length: 8 }, (_, index) => ({ id: `P${index + 1}`, arrivalTime: 0, burstTime: 2 }));
    const result = simulateRoundRobin([...processes].reverse(), 10);
    expect(result.gantt.map((block) => block.processId)).toEqual(processes.map((process) => process.id));
    expect(result.metrics.contextSwitches).toBe(7);
    expect(result.snapshots.at(-1)?.completed).toHaveLength(8);
  });
  it("satu proses tiba setelah jeda panjang memiliki idle 0–30", () => {
    const result = simulateRoundRobin([{ id: "P1", arrivalTime: 30, burstTime: 1 }], 10);
    expect(result.gantt).toEqual([{ processId: null, start: 0, end: 30 }, { processId: "P1", start: 30, end: 31 }]);
    expect(result.metrics.perProcess.P1.responseTime).toBe(0);
    expect(result.metrics.contextSwitches).toBe(0);
  });
  it("semua kombinasi biaya/konvensi menjaga partisi proses dan waktu Gantt", () => {
    const processes = Array.from({ length: 8 }, (_, index) => ({ id: `P${index + 1}`, arrivalTime: index * 3, burstTime: index + 1 }));
    for (const tieBreaking of ["arrivals-first", "preempted-first"] as const) for (const contextSwitchCost of [0, 1, 2]) {
      const result = simulateRoundRobin(processes, 2, { tieBreaking, contextSwitchCost });
      for (const snapshot of result.snapshots) {
        // Reserved process during switching is the only one absent from these areas.
        const ids = [...snapshot.notArrived, ...snapshot.readyQueue, ...snapshot.completed, ...(snapshot.cpu ? [snapshot.cpu] : [])];
        expect(new Set(ids).size).toBe(ids.length);
        expect(snapshot.gantt.every((block) => block.end <= snapshot.time)).toBe(true);
      }
    }
  });
});
