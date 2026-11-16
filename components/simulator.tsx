"use client";

import { memo, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimulationContext, usePlayback, useSimulation } from "@/components/simulation-context";
import { SimulationStage, Gantt } from "@/components/simulation-stage";
import { ProcessShape } from "@/components/visuals/core-assets";
import { createPlayback } from "@/lib/playback";
import { narrate } from "@/lib/narration";
import { nextProcessId, processAppearance, validateProcessValue } from "@/lib/processes";
import { simulateRoundRobin, type ProcessInput, type TieBreaking } from "@/lib/scheduler";

const initialProcesses: ProcessInput[] = [
  { id: "P1", arrivalTime: 0, burstTime: 5 }, { id: "P2", arrivalTime: 1, burstTime: 3 },
  { id: "P3", arrivalTime: 2, burstTime: 6 }, { id: "P4", arrivalTime: 4, burstTime: 2 },
];
const tabs = [{ id: "proses", label: "Proses" }, { id: "pengaturan", label: "Pengaturan" }, { id: "narasi", label: "Narasi" }, { id: "metrik", label: "Metrik" }] as const;

export default function Simulator() {
  const [processes, setProcesses] = useState(initialProcesses);
  const [quantum, setQuantum] = useState(2);
  const [cost, setCost] = useState(0);
  const [convention, setConvention] = useState<TieBreaking>("arrivals-first");
  const [tab, setTab] = useState<string>("proses");
  const store = useMemo(() => createPlayback(simulateRoundRobin(processes, quantum, { contextSwitchCost: cost, tieBreaking: convention })), [processes, quantum, cost, convention]);
  useEffect(() => () => store.dispose(), [store]);

  const updateProcess = (id: string, field: "arrivalTime" | "burstTime", value: number) => {
    setProcesses((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };
  const addProcess = () => {
    const id = nextProcessId(processes);
    if (id) setProcesses((items) => [...items, { id, arrivalTime: 0, burstTime: 1 }]);
  };
  const removeProcess = (id: string) => {
    if (processes.length <= 1) return;
    setProcesses((items) => items.filter((item) => item.id !== id));
    document.getElementById("add-process")?.focus();
  };

  return <SimulationContext.Provider value={store}>
    <MotionBoundary>
      <header className="sim-heading">
        <div><p className="eyebrow">Putar SO · Eksplorasi penjadwalan CPU</p><h1>Simulator Round Robin</h1></div>
        <TimeDisplay />
      </header>
      <div className="sim-layout">
        <NarrationAnnouncer convention={convention} />
        <SimulationStage processes={processes} quantum={quantum} />
        <PlaybackControls />
        <Gantt quantum={quantum} />
        <div className="mobile-tabs" role="tablist" aria-label="Panel simulator">
          {tabs.map((item, index) => <button key={item.id} type="button" role="tab" id={`tab-${item.id}`}
            aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)} onKeyDown={(event) => {
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
              if (next === null) return;
              event.preventDefault();
              setTab(tabs[next].id);
              document.getElementById(`tab-${tabs[next].id}`)?.focus();
            }}>{item.label}</button>)}
        </div>
        <Panel id="proses" active={tab}>
          <div className="flex items-center justify-between gap-2"><h2>Proses</h2><Button id="add-process" variant="outline" onClick={addProcess} disabled={processes.length === 8}><Plus size={16} aria-hidden="true" /> Tambah</Button></div>
          <p className="muted">1–8 proses. Perubahan valid mengulang simulasi dari t = 0.</p>
          {processes.map((process) => <div className="process-editor" key={process.id}>
            <div className="flex items-center justify-between">
              <span className="process-identity"><ProcessShape {...processAppearance(process.id)} label={process.id} /> {process.id}</span>
              <button className="icon-button" type="button" aria-label={`Hapus ${process.id}`} disabled={processes.length === 1} onClick={() => removeProcess(process.id)}><Trash2 size={18} aria-hidden="true" /></button>
            </div>
            <div className="editor-fields">
              <ProcessField process={process} field="arrivalTime" label="Kedatangan (arrival)" onUpdate={updateProcess} />
              <ProcessField process={process} field="burstTime" label="Waktu CPU (burst)" onUpdate={updateProcess} />
            </div>
          </div>)}
        </Panel>
        <Panel id="pengaturan" active={tab}>
          <h2>Pengaturan</h2>
          <label htmlFor="quantum" className="field-label">Jatah waktu (quantum): {quantum}</label>
          <input id="quantum" aria-label="Jatah waktu (quantum)" className="range-input" type="range" min={1} max={10} value={quantum} onChange={(event) => setQuantum(Number(event.target.value))} />
          <label htmlFor="switch-cost" className="field-label">Biaya context switch: {cost}</label>
          <input id="switch-cost" aria-label="Biaya context switch" className="range-input" type="range" min={0} max={2} value={cost} onChange={(event) => setCost(Number(event.target.value))} />
          <fieldset className="mt-4"><legend className="mb-3 font-bold">Aturan seri</legend>
            <label className="radio-label"><input name="konvensi" type="radio" checked={convention === "arrivals-first"} onChange={() => setConvention("arrivals-first")} /> Proses baru tiba lebih dulu</label>
            <label className="radio-label"><input name="konvensi" type="radio" checked={convention === "preempted-first"} onChange={() => setConvention("preempted-first")} /> Proses preempt lebih dulu</label>
          </fieldset>
        </Panel>
        <Panel id="narasi" active={tab}><Narration convention={convention} /></Panel>
        <Panel id="metrik" active={tab}><Metrics processes={processes} /></Panel>
      </div>
    </MotionBoundary>
  </SimulationContext.Provider>;
}

function Panel({ id, active, children }: { id: string; active: string; children: ReactNode }) {
  return <section className={`paper-panel sim-panel panel-${id}`} id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} data-active={id === active} tabIndex={0}>{children}</section>;
}

function MotionBoundary({ children }: { children: ReactNode }) {
  const speed = useSimulation((state) => state.speed);
  const movement = useSimulation((state) => state.movement);
  return <main className={`simulator mode-${movement}`} style={{ "--motion-duration": `${350 / speed}ms` } as CSSProperties}>{children}</main>;
}

function TimeDisplay() {
  const time = useSimulation((state) => state.result.snapshots[state.cursor].time);
  return <p className="time-display" data-time={time}>t = {time}</p>;
}

function ProcessField({ process, field, label, onUpdate }: { process: ProcessInput; field: "arrivalTime" | "burstTime"; label: string; onUpdate: (id: string, field: "arrivalTime" | "burstTime", value: number) => void }) {
  const [raw, setRaw] = useState(String(process[field]));
  const { error } = validateProcessValue(raw, field);
  const id = `${process.id}-${field}`;
  return <div><label htmlFor={id}>{label}</label>
    <input id={id} className="number-input" aria-label={`${label} ${process.id}`} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
      type="number" inputMode="numeric" min={field === "arrivalTime" ? 0 : 1} max={field === "arrivalTime" ? 30 : 20} step={1} value={raw}
      onChange={(event) => {
        const value = event.target.value;
        setRaw(value);
        const validated = validateProcessValue(value, field);
        if (validated.value !== null) onUpdate(process.id, field, validated.value);
      }} />
    {error && <p id={`${id}-error`} role="status" className="input-error">{error} Simulasi tetap memakai nilai valid terakhir.</p>}
  </div>;
}

function PlaybackControls() {
  const store = usePlayback();
  const playing = useSimulation((state) => state.playing);
  const cursor = useSimulation((state) => state.cursor);
  const speed = useSimulation((state) => state.speed);
  const last = store.getState().result.snapshots.length - 1;
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey ||
        (event.target instanceof Element && event.target.closest("input,select,textarea,button,a,summary,[contenteditable=true],[role=tab]"))) return;
      const state = store.getState();
      if (event.code === "Space") { event.preventDefault(); store.toggle(); }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        store.seek(state.cursor + (event.key === "ArrowRight" ? 1 : -1), "step");
      }
      if (event.key.toLowerCase() === "r") { event.preventDefault(); store.seek(0); }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [store]);
  return <section className="paper-panel playback-controls" aria-label="Kendali pemutaran">
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => store.toggle()} aria-label={playing ? "Jeda" : "Putar"}>{playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}{playing ? "Jeda" : "Putar"}</Button>
      <Button variant="outline" aria-label="Langkah mundur" disabled={cursor === 0} onClick={() => store.seek(cursor - 1, "step")}><ChevronLeft size={18} aria-hidden="true" /> Mundur</Button>
      <Button variant="outline" aria-label="Langkah maju" disabled={cursor === last} onClick={() => store.seek(cursor + 1, "step")}>Maju <ChevronRight size={18} aria-hidden="true" /></Button>
      <Button variant="outline" aria-label="Ulang dari awal" onClick={() => store.seek(0)}><RotateCcw size={18} aria-hidden="true" /> Ulang</Button>
      <label className="speed-label">Kecepatan
        <select aria-label="Kecepatan simulasi" value={speed} onChange={(event) => store.setSpeed(Number(event.target.value))}>{[0.5, 1, 2, 4].map((value) => <option value={value} key={value}>{String(value).replace(".", ",")}×</option>)}</select>
      </label>
    </div>
    <label htmlFor="timeline" className="field-label mt-4">Garis waktu · {cursor} / {last}</label>
    <input id="timeline" aria-label="Garis waktu" type="range" className="range-input" min={0} max={last} value={cursor} onChange={(event) => store.seek(Number(event.target.value))} />
    <p className="muted">Spasi: putar/jeda · ← →: langkah · R: ulang. Pintasan tidak mengambil alih kontrol yang sedang fokus.</p>
  </section>;
}

function Narration({ convention }: { convention: TieBreaking }) {
  const snapshot = useSimulation((state) => state.result.snapshots[state.cursor]);
  const store = usePlayback();
  return <><h2>Narasi langkah</h2><div data-time={snapshot.time} className="narration">
    <p className="font-mono font-bold">t = {snapshot.time}</p>
    <p>{narrate(store.getState().result, snapshot.time, convention)}</p>
  </div></>;
}

function NarrationAnnouncer({ convention }: { convention: TieBreaking }) {
  const snapshot = useSimulation((state) => state.result.snapshots[state.cursor]);
  const store = usePlayback();
  return <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">t = {snapshot.time}. {narrate(store.getState().result, snapshot.time, convention)}</div>;
}

const MetricRow = memo(function MetricRow({ process, completion, turnaround, waiting, response }: { process: ProcessInput; completion: number | null; turnaround: number | null; waiting: number | null; response: number | null }) {
  return <tr data-process={process.id}><th scope="row">{process.id}</th>
    <td title="Waktu proses selesai">{completion ?? "—"}</td><td title="Completion − Arrival">{turnaround ?? "—"}</td>
    <td title="Turnaround − Burst">{waiting ?? "—"}</td><td title="Waktu pertama masuk CPU − Arrival">{response ?? "—"}</td></tr>;
});

function Metrics({ processes }: { processes: ProcessInput[] }) {
  const snapshot = useSimulation((state) => state.result.snapshots[state.cursor]);
  const metrics = snapshot.metrics;
  const average = (key: "completionTime" | "turnaroundTime" | "waitingTime" | "responseTime") => {
    const values = Object.values(metrics.perProcess).map((item) => item[key]).filter((value): value is number => value !== null);
    return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)).toLocaleString("id-ID") : "—";
  };
  return <div data-time={snapshot.time}><h2>Metrik</h2>
    <div className="horizontal-scroll" tabIndex={0} role="region" aria-label="Tabel metrik, dapat digulir mendatar">
      <table className="simple-table metrics-table"><caption>Metrik per proses pada t = {snapshot.time}</caption>
        <thead><tr>{["Proses", "Selesai (completion)", "Turnaround", "Tunggu (waiting)", "Respons (response)"].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{processes.map((process) => { const metric = metrics.perProcess[process.id]; return <MetricRow key={process.id} process={process} completion={metric.completionTime} turnaround={metric.turnaroundTime} waiting={metric.waitingTime} response={metric.responseTime} />; })}</tbody>
        <tfoot><tr><th scope="row">Rata-rata diketahui</th>{(["completionTime", "turnaroundTime", "waitingTime", "responseTime"] as const).map((key) => <td key={key}>{average(key)}</td>)}</tr></tfoot>
      </table>
    </div>
    <p className="muted">Rata-rata hanya memakai nilai yang sudah diketahui pada waktu ini; tanda — berarti belum tersedia.</p>
    <dl className="metrics-summary">
      <div><dt>Context switch</dt><dd>{metrics.contextSwitches}</dd></div>
      <div><dt>Utilisasi CPU</dt><dd>{metrics.cpuUtilization.toLocaleString("id-ID")}%</dd></div>
      <div><dt>Throughput</dt><dd>{metrics.throughput.toLocaleString("id-ID")} proses/satuan</dd></div>
    </dl>
  </div>;
}
