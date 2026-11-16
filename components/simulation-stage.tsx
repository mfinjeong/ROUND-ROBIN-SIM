"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { CpuIllustration, ProcessShape } from "@/components/visuals/core-assets";
import { eventsAt } from "@/lib/narration";
import { processAppearance } from "@/lib/processes";
import type { ProcessInput } from "@/lib/scheduler";
import { usePlayback, useProgressMotion, useSimulation, useSimulationMotion, type MotionKind } from "./simulation-context";

export const SimulationStage = memo(function SimulationStage({ processes, quantum }: { processes: ProcessInput[]; quantum: number }) {
  return <section className="paper-panel stage-shell" aria-label="Panggung simulasi">
    <div className="stage-grid">
      <ProcessZone title="Kolam kedatangan" zone="notArrived" processes={processes} />
      <ProcessZone title="Antrean siap" zone="readyQueue" processes={processes} />
      <Cpu quantum={quantum} processes={processes} />
      <ProcessZone title="Selesai" zone="completed" processes={processes} />
    </div>
  </section>;
});

type Zone = "notArrived" | "readyQueue" | "completed";
const ProcessZone = memo(function ProcessZone({ title, zone, processes }: { title: string; zone: Zone; processes: ProcessInput[] }) {
  const ids = useSimulation((state) => state.result.snapshots[state.cursor][zone].join(","));
  return <section className="stage-zone" aria-label={title} data-zone={zone}>
    <h2>{title}</h2>
    <div className="zone-tokens">
      {ids ? ids.split(",").map((id, index) => zone === "readyQueue" ? <QueueToken key={id} id={id} position={index} /> : <ProcessToken key={id} id={id} zone={zone} />) :
        <p className="muted">{zone === "notArrived" ? "Semua proses sudah tiba." : zone === "completed" ? "Belum ada proses selesai." : "Antrean kosong."}</p>}
    </div>
    {zone === "completed" && <p className="muted">{ids ? ids.split(",").length : 0}/{processes.length} proses</p>}
  </section>;
});

const QueueToken = memo(function QueueToken({ id, position }: { id: string; position: number }) {
  const store = usePlayback();
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef<DOMRect | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const before = previous.current;
    previous.current = rect;
    if (!before || store.getState().movement === "seek" || !node.animate) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animation = node.animate(reduced ? [{ opacity: 0.65 }, { opacity: 1 }] :
      [{ transform: `translate(${before.x - rect.x}px,${before.y - rect.y}px)` }, { transform: "translate(0,0)" }],
    { duration: reduced ? 120 : 350, easing: "ease-out" });
    return store.register(animation);
  }, [store, position]);
  return <div ref={ref}><ProcessToken id={id} zone="readyQueue" /></div>;
});

const ProcessToken = memo(function ProcessToken({ id, zone }: { id: string; zone: Zone | "cpu" }) {
  const store = usePlayback();
  const eventKey = useSimulation((state) => {
    const time = state.result.snapshots[state.cursor].time;
    const relevant = eventsAt(state.result, time, id).filter((event) => event.type !== "execute");
    return relevant.length ? `${time}:${relevant.map((event) => event.type).join(",")}` : "";
  });
  const state = store.getState();
  const eventTypes = eventKey.split(":")[1] ?? "";
  const kind: MotionKind = zone === "completed" ? "complete" : eventTypes.includes("preempt") && zone === "readyQueue" ? "preempt" : eventTypes.includes("arrival") && zone === "readyQueue" ? "arrival" : "dispatch";
  const ref = useSimulationMotion(kind, eventKey);
  const appearance = processAppearance(id);
  const completedAt = zone === "completed" ? state.result.snapshots[state.cursor].metrics.perProcess[id]?.completionTime : null;
  return <div ref={ref} className="process-token" data-process={id}>
    <ProcessShape {...appearance} label={id} />
    <span>{id}{completedAt !== null && <small>✓ t = {completedAt}</small>}</span>
  </div>;
});

const CpuFrame = memo(CpuIllustration);
function Cpu({ quantum, processes }: { quantum: number; processes: ProcessInput[] }) {
  const snapshot = useSimulation((state) => state.result.snapshots[state.cursor]);
  const store = usePlayback();
  const events = eventsAt(store.getState().result, snapshot.time);
  const switching = events.some((event) => event.type === "context-switch");
  const kind = switching ? "context-switch" : snapshot.cpu ? "execute" : "idle";
  const motion = useSimulationMotion(kind, snapshot.time);
  const ringMotion = useSimulationMotion("preempt-ring", events.some((event) => event.type === "preempt") ? snapshot.time : "");
  const id = snapshot.cpu;
  const process = processes.find((item) => item.id === id);
  const used = snapshot.gantt.filter((block) => block.processId === id).reduce((sum, block) => sum + block.end - block.start, 0);
  const remaining = process ? process.burstTime - used : 0;
  const dispatch = store.getState().result.events.filter((event) => event.type === "dispatch" && event.processId === id && event.time <= snapshot.time).at(-1);
  const quantumLeft = id ? Math.min(quantum - (snapshot.time - (dispatch?.time ?? 0)), remaining) : 0;
  const ringTransform = `scale(${Math.max(quantumLeft / quantum, 0.1)})`;
  const burstTransform = `scaleX(${remaining / (process?.burstTime ?? 1)})`;
  const ringRef = useProgressMotion<SVGCircleElement>(ringTransform);
  const burstRef = useProgressMotion<HTMLDivElement>(burstTransform);
  return <section className="stage-zone cpu-zone" aria-label="CPU" data-time={snapshot.time} data-cpu={id ?? ""}>
    <h2>CPU</h2>
    <div className="cpu-frame"><CpuFrame /></div>
    <div ref={motion} className="cpu-content">
      {id ? <ProcessToken key={id} id={id} zone="cpu" /> : <p className="muted">{switching ? "Pergantian proses" : snapshot.completed.length === processes.length ? "Semua proses selesai" : "CPU menganggur (idle)"}</p>}
    </div>
    {id && <div className="cpu-progress">
      <div ref={ringMotion} className="quantum-indicator" aria-label={`Sisa quantum ${quantumLeft} dari ${quantum}`}>
        <svg viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="20" fill="none" stroke="#cbd5e1" strokeWidth="4" /><circle ref={ringRef} className="quantum-scale" cx="25" cy="25" r="20" fill="none" stroke="#14675c" strokeWidth="4" style={{ transform: ringTransform }} /></svg>
        <span>Quantum: {quantumLeft}</span>
      </div>
      <p>Sisa burst: <strong>{remaining}</strong></p>
      <div className="burst-track" aria-hidden="true"><div ref={burstRef} style={{ transform: burstTransform }} /></div>
    </div>}
  </section>;
}

export function Gantt({ quantum }: { quantum: number }) {
  const snapshot = useSimulation((state) => state.result.snapshots[state.cursor]);
  const store = usePlayback();
  const duration = store.getState().result.duration;
  return <section className="paper-panel" data-time={snapshot.time} aria-label="Gantt chart">
    <h2>Gantt chart <small className="muted">· quantum {quantum}</small></h2>
    <div className="horizontal-scroll" tabIndex={0} role="region" aria-label="Gantt, dapat digulir mendatar">
      <div className="gantt-track" style={{ width: Math.max(duration * 36, 520) }}>
        <div className="gantt-blocks">
          {snapshot.gantt.map((block) => <GanttSegment key={block.start} start={block.start} end={block.end} processId={block.processId} />)}
          <div className="gantt-marker" style={{ transform: `translateX(${snapshot.time * 36}px)` }}><span>t = {snapshot.time}</span></div>
        </div>
        <div className="gantt-ticks">{Array.from({ length: duration + 1 }, (_, time) => <span key={time} style={{ left: time * 36 }}>{time}</span>)}</div>
      </div>
    </div>
    <p className="muted">Blok abu-abu: idle atau biaya context switch. Waktu saat ini: {snapshot.time}.</p>
  </section>;
}

const GanttSegment = memo(function GanttSegment({ start, end, processId }: { start: number; end: number; processId: string | null }) {
  const ref = useSimulationMotion("gantt", end);
  return <div ref={ref} className="gantt-block" data-start={start} data-end={end} data-process={processId ?? "idle"}
    style={{ left: start * 36, width: (end - start) * 36, backgroundColor: processId ? processAppearance(processId).color : "#e2e8f0" }}>
    <span className="gantt-label">{processId ?? "idle"}</span>
  </div>;
});
