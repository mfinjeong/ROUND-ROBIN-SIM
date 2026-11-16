import { describe, expect, it } from "vitest";
import { scenarios } from "./scenarios";
import { simulateRoundRobin } from "./scheduler";

describe("skenario Laboratorium Quantum", () => {
  it("menyediakan empat skenario yang valid untuk seluruh quantum 1–10", () => {
    expect(scenarios).toHaveLength(4);
    for (const scenario of scenarios) {
      for (let quantum = 1; quantum <= 10; quantum++) {
        const result = simulateRoundRobin(scenario.processes, quantum, { contextSwitchCost: scenario.cost });
        expect(result.snapshots.at(-1)?.completed).toHaveLength(scenario.processes.length);
        expect(result.snapshots.map((item) => item.time)).toEqual(
          Array.from({ length: result.duration + 1 }, (_, index) => index),
        );
        expect(result.snapshots.every((item) => item.gantt.every((block) => block.end <= item.time))).toBe(true);
        expect(result.gantt.filter((block) => block.processId).reduce((sum, block) => sum + block.end - block.start, 0))
          .toBe(scenario.processes.reduce((sum, process) => sum + process.burstTime, 0));
      }
    }
  });
  it("menunjukkan overhead lebih besar dengan quantum kecil", () => {
    const scenario = scenarios[0];
    const small = simulateRoundRobin(scenario.processes, 1, { contextSwitchCost: scenario.cost });
    const large = simulateRoundRobin(scenario.processes, 8, { contextSwitchCost: scenario.cost });
    expect(small.metrics.contextSwitches).toBeGreaterThan(large.metrics.contextSwitches);
    expect(small.duration).toBeGreaterThan(large.duration);
  });
});
