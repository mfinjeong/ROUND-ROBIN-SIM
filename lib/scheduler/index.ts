export type ProcessInput = {
  id: string;
  arrivalTime: number;
  burstTime: number;
};

export type TieBreaking = "arrivals-first" | "preempted-first";

export type SchedulerOptions = {
  contextSwitchCost?: number;
  tieBreaking?: TieBreaking;
};

export type GanttBlock = {
  processId: string | null;
  start: number;
  end: number;
};

export type ProcessMetrics = {
  completionTime: number | null;
  turnaroundTime: number | null;
  waitingTime: number | null;
  responseTime: number | null;
};

export type SchedulerMetrics = {
  perProcess: Record<string, ProcessMetrics>;
  averages: {
    turnaroundTime: number;
    waitingTime: number;
    responseTime: number;
  };
  contextSwitches: number;
  cpuUtilization: number;
  throughput: number;
};

export type SchedulerEvent = {
  time: number;
  type:
    | "arrival"
    | "dispatch"
    | "execute"
    | "preempt"
    | "complete"
    | "context-switch"
    | "idle";
  processId?: string;
  message: string;
};

export type SchedulerSnapshot = {
  time: number;
  cpu: string | null;
  readyQueue: string[];
  notArrived: string[];
  completed: string[];
  gantt: GanttBlock[];
  metrics: SchedulerMetrics;
};

export type SimulationResult = {
  events: SchedulerEvent[];
  snapshots: SchedulerSnapshot[];
  gantt: GanttBlock[];
  metrics: SchedulerMetrics;
  duration: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

function makeMetrics(
  processes: ProcessInput[],
  remaining: Map<string, number>,
  completion: Map<string, number>,
  firstRun: Map<string, number>,
  contextSwitches: number,
  executionTime: number,
  duration: number,
): SchedulerMetrics {
  const perProcess = Object.fromEntries(
    processes.map((process) => {
      const completedAt = completion.get(process.id) ?? null;
      const turnaroundTime = completedAt === null ? null : completedAt - process.arrivalTime;
      const waitingTime = turnaroundTime === null ? null : turnaroundTime - process.burstTime;
      const responseTime = firstRun.has(process.id)
        ? (firstRun.get(process.id) as number) - process.arrivalTime
        : null;
      return [
        process.id,
        { completionTime: completedAt, turnaroundTime, waitingTime, responseTime },
      ];
    }),
  ) as Record<string, ProcessMetrics>;

  const complete = Object.values(perProcess).filter(
    (metric): metric is ProcessMetrics & {
      turnaroundTime: number;
      waitingTime: number;
      responseTime: number;
    } =>
      metric.turnaroundTime !== null &&
      metric.waitingTime !== null &&
      metric.responseTime !== null,
  );
  const average = (key: "turnaroundTime" | "waitingTime" | "responseTime") =>
    complete.length ? round(complete.reduce((sum, item) => sum + item[key], 0) / complete.length) : 0;

  // Reading remaining here keeps the function's state contract explicit and prevents
  // accidental metric calculation from mutating the simulation state.
  void remaining;
  return {
    perProcess,
    averages: {
      turnaroundTime: average("turnaroundTime"),
      waitingTime: average("waitingTime"),
      responseTime: average("responseTime"),
    },
    contextSwitches,
    cpuUtilization: duration ? round((executionTime / duration) * 100) : 0,
    throughput: duration ? round(complete.length / duration) : 0,
  };
}

/**
 * Simulates Round Robin in discrete time. The input is never mutated.
 * A snapshot exists at every integer time boundary, making it suitable for
 * play, pause, rewind, and scrubbing in the UI.
 */
export function simulateRoundRobin(
  input: readonly ProcessInput[],
  quantum: number,
  options: SchedulerOptions = {},
): SimulationResult {
  if (!Number.isInteger(quantum) || quantum < 1) {
    throw new Error("Quantum harus berupa bilangan bulat minimal 1.");
  }
  const ids = new Set<string>();
  if (input.length > 8) throw new Error("Maksimal 8 proses.");
  for (const process of input) {
    if (!process.id.trim() || ids.has(process.id)) throw new Error("ID proses harus unik dan tidak kosong.");
    ids.add(process.id);
    if (!Number.isInteger(process.arrivalTime) || process.arrivalTime < 0 || process.arrivalTime > 30 ||
      !Number.isInteger(process.burstTime) || process.burstTime < 1 || process.burstTime > 20) {
      throw new Error("Arrival harus bilangan bulat 0–30 dan burst 1–20.");
    }
  }
  if (options.contextSwitchCost !== undefined &&
    (!Number.isInteger(options.contextSwitchCost) || options.contextSwitchCost < 0 || options.contextSwitchCost > 2)) {
    throw new Error("Biaya context switch harus bilangan bulat 0–2.");
  }
  if (!input.length) {
    return {
      events: [],
      snapshots: [],
      gantt: [],
      metrics: makeMetrics([], new Map(), new Map(), new Map(), 0, 0, 0),
      duration: 0,
    };
  }

  const processes = input.map((process) => ({ ...process }));
  const tieBreaking = options.tieBreaking ?? "arrivals-first";
  const switchCost = Math.max(0, Math.floor(options.contextSwitchCost ?? 0));
  const future = [...processes].sort(
    (a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
  const remaining = new Map(processes.map((process) => [process.id, process.burstTime]));
  const completion = new Map<string, number>();
  const firstRun = new Map<string, number>();
  const queue: string[] = [];
  const events: SchedulerEvent[] = [];
  const snapshots: SchedulerSnapshot[] = [];
  const gantt: GanttBlock[] = [];
  const completed: string[] = [];
  let futureIndex = 0;
  let current: string | null = null;
  let sliceUsed = 0;
  let lastProcess: string | null = null;
  let contextSwitches = 0;
  let executionTime = 0;
  let time = 0;
  let switchingTo: string | null = null;
  let switchRemaining = 0;

  const addBlock = (processId: string | null, start: number, end: number) => {
    const previous = gantt[gantt.length - 1];
    if (previous && previous.processId === processId && previous.end === start) previous.end = end;
    else gantt.push({ processId, start, end });
  };
  const addEvent = (event: SchedulerEvent) => events.push(event);
  const addArrivals = () => {
    while (futureIndex < future.length && future[futureIndex].arrivalTime === time) {
      const process = future[futureIndex++];
      queue.push(process.id);
      addEvent({ time, type: "arrival", processId: process.id, message: `${process.id} tiba dan masuk antrean.` });
    }
  };
  const snapshot = () => {
    const metrics = makeMetrics(
      processes,
      remaining,
      completion,
      firstRun,
      contextSwitches,
      executionTime,
      time,
    );
    snapshots.push({
      time,
      cpu: current,
      readyQueue: [...queue],
      notArrived: future.slice(futureIndex).map((process) => process.id),
      completed: [...completed],
      gantt: gantt.map((block) => ({ ...block })),
      metrics,
    });
  };

  while (true) {
    const boundary = current !== null &&
      (remaining.get(current) === 0 || sliceUsed >= quantum);
    if (boundary && remaining.get(current as string)! > 0) {
      if (tieBreaking === "arrivals-first") addArrivals();
      const preempted = current as string;
      current = null;
      sliceUsed = 0;
      queue.push(preempted);
      addEvent({ time, type: "preempt", processId: preempted, message: `${preempted} di-preempt dan masuk ekor antrean.` });
      if (tieBreaking === "preempted-first") addArrivals();
    } else {
      addArrivals();
    }

    // Completion must be checked using the process that finished its previous unit.
    const finished = processes.find((process) => remaining.get(process.id) === 0 && !completed.includes(process.id));
    if (finished && completion.has(finished.id) === false && time > finished.arrivalTime) {
      // Only the process that was on CPU can finish at this boundary.
      if (lastProcess === finished.id || current === finished.id) {
        completion.set(finished.id, time);
        completed.push(finished.id);
        if (current === finished.id) current = null;
        addEvent({ time, type: "complete", processId: finished.id, message: `${finished.id} selesai.` });
      }
    }

    // A reserved process enters CPU only after the full switching cost.
    // Arrivals at this boundary have already joined the ready queue.
    if (switchingTo && switchRemaining === 0) {
      current = switchingTo;
      switchingTo = null;
      sliceUsed = 0;
      if (!firstRun.has(current)) firstRun.set(current, time);
      addEvent({ time, type: "dispatch", processId: current, message: `${current} masuk CPU.` });
    }

    if (current === null && switchingTo === null && queue.length) {
      const next = queue.shift() as string;
      if (lastProcess && lastProcess !== next) {
        contextSwitches += 1;
        addEvent({ time, type: "context-switch", processId: next, message: `Beralih dari ${lastProcess} ke ${next}.` });
        if (switchCost > 0) {
          switchingTo = next;
          switchRemaining = switchCost;
        } else {
          current = next;
          sliceUsed = 0;
          if (!firstRun.has(next)) firstRun.set(next, time);
          addEvent({ time, type: "dispatch", processId: next, message: `${next} masuk CPU.` });
        }
      } else {
        current = next;
        sliceUsed = 0;
        if (!firstRun.has(next)) firstRun.set(next, time);
        addEvent({ time, type: "dispatch", processId: next, message: `${next} masuk CPU.` });
      }
    }

    // Exactly one snapshot at t, followed by one unit of switching [t, t+1).
    if (switchRemaining > 0) {
      addEvent({ time, type: "context-switch", message: "Context switch sedang berlangsung." });
      snapshot();
      addBlock(null, time, time + 1);
      switchRemaining -= 1;
      time += 1;
      continue;
    }

    if (current === null && switchRemaining === 0 && queue.length === 0 && futureIndex < future.length) {
      addEvent({ time, type: "idle", message: "CPU menganggur menunggu proses berikutnya." });
      snapshot();
      addBlock(null, time, time + 1);
      time += 1;
      continue;
    }
    if (current === null && switchRemaining === 0 && queue.length === 0 && futureIndex >= future.length) {
      snapshot();
      break;
    }

    snapshot();
    if (current) {
      addBlock(current, time, time + 1);
      remaining.set(current, remaining.get(current)! - 1);
      sliceUsed += 1;
      executionTime += 1;
      lastProcess = current;
      addEvent({ time, type: "execute", processId: current, message: `${current} berjalan selama satu satuan waktu.` });
    }
    time += 1;
  }

  const metrics = makeMetrics(processes, remaining, completion, firstRun, contextSwitches, executionTime, time);
  return { events, snapshots, gantt, metrics, duration: time };
}

export const runRoundRobin = simulateRoundRobin;
