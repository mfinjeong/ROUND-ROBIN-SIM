"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scenarios } from "@/lib/scenarios";
import { simulateRoundRobin } from "@/lib/scheduler";
import { ProcessShape } from "@/components/visuals/core-assets";
import { processAppearance } from "@/lib/processes";
import { LazyQuantumChart } from "@/components/lazy-quantum-chart";

const palette = ["#f4a261", "#e76f51", "#2a9d8f", "#8ab17d"];

export default function QuantumLab() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [quanta, setQuanta] = useState([1, 2, 8]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const scenario = scenarios[scenarioIndex];
  // Semua panel dan grafik menggunakan mesin yang sama, bukan algoritma baru.
  const sweep = useMemo(() => Array.from({ length: 10 }, (_, index) => {
    const quantum = index + 1;
    const result = simulateRoundRobin(scenario.processes, quantum, { contextSwitchCost: scenario.cost });
    return { quantum, result, waiting: result.metrics.averages.waitingTime, response: result.metrics.averages.responseTime, switches: result.metrics.contextSwitches };
  }), [scenario]);
  const chartData = useMemo(() => sweep.map(({ quantum, waiting, response, switches }) => ({ quantum, waiting, response, switches })), [sweep]);
  const comparisons = quanta.map((quantum) => sweep[quantum - 1]);
  const duration = Math.max(...comparisons.map(({ result }) => result.duration));
  useEffect(() => {
    if (!playing || time >= duration) return;
    const timer = window.setTimeout(() => setTime((value) => Math.min(value + 1, duration)), 650);
    return () => window.clearTimeout(timer);
  }, [playing, time, duration]);
  const reset = () => { setTime(0); setPlaying(false); };

  return <main className="content-page">
    <p className="eyebrow">Eksperimen tanpa penilaian</p>
    <h1>Laboratorium Quantum</h1>
    <p className="page-lede">Proses yang sama, jatah waktu berbeda. Amati perubahan antrean, respons, dan biaya pergantian CPU.</p>
    <section className="paper-panel">
      <label className="field-label">Skenario bawaan
        <select value={scenarioIndex} onChange={(event) => { setScenarioIndex(Number(event.target.value)); reset(); }} className="lab-select">
          {scenarios.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}
        </select>
      </label>
      <p className="mt-3 text-slate-700">{scenario.description}</p>
      <p className="mt-2 text-sm">Biaya context switch: <strong>{scenario.cost}</strong> satuan. Aturan seri: kedatangan lebih dulu.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="simple-table"><caption>Himpunan proses bersama</caption><thead><tr><th>Proses</th><th>Kedatangan</th><th>Burst</th></tr></thead><tbody>{scenario.processes.map((process) => <tr key={process.id}><th>{process.id}</th><td>{process.arrivalTime}</td><td>{process.burstTime}</td></tr>)}</tbody></table>
      </div>
    </section>
    <section className="paper-panel">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => { if (time >= duration) { setTime(0); setPlaying(true); } else setPlaying((value) => !value); }}>{playing && time < duration ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}{playing && time < duration ? "Jeda" : "Putar bersama"}</Button>
        <Button variant="outline" onClick={reset}><RotateCcw size={16} /> Ulang</Button>
        <span className="font-mono" aria-live="off">t = {time} / {duration}</span>
      </div>
      <label className="mt-4 block">Waktu perbandingan
        <input aria-label="Waktu perbandingan" className="mt-2 w-full accent-teal" type="range" min={0} max={duration} value={time} onChange={(event) => { setTime(Number(event.target.value)); setPlaying(false); }} />
      </label>
    </section>
    <div className="lab-comparisons">
      {comparisons.map(({ result, quantum }, index) => {
        const snapshot = result.snapshots.findLast((item) => item.time <= time) ?? result.snapshots[0];
        return <section className="paper-panel" key={index}>
          <label className="field-label">Quantum panel {index + 1}
            <select aria-label={`Quantum panel ${index + 1}`} value={quantum} className="lab-select" onChange={(event) => { setQuanta((items) => items.map((item, i) => i === index ? Number(event.target.value) : item)); reset(); }}>
              {sweep.map((item) => <option key={item.quantum} value={item.quantum}>{item.quantum} satuan</option>)}
            </select>
          </label>
          <div className="mt-4 rounded-xl bg-cream p-3">
            <p className="text-sm font-bold">CPU · {time >= result.duration ? "Selesai" : snapshot.cpu ?? "Idle / pergantian"}</p>
            {snapshot.cpu && <ProcessShape label={snapshot.cpu} {...processAppearance(snapshot.cpu)} />}
            <p className="mt-2 text-sm">Antrean: {snapshot.readyQueue.join(" → ") || "kosong"}</p>
            <p className="mt-2 text-sm">Selesai: {snapshot.completed.join(", ") || "belum ada"}</p>
          </div>
          <dl className="lab-stats">
            <div><dt>Waktu tunggu rata-rata</dt><dd>{result.metrics.averages.waitingTime}</dd></div>
            <div><dt>Waktu respons rata-rata</dt><dd>{result.metrics.averages.responseTime}</dd></div>
            <div><dt>Context switch</dt><dd>{result.metrics.contextSwitches}</dd></div>
          </dl>
          <p className="text-xs text-slate-600">Metrik di atas adalah hasil akhir untuk perbandingan.</p>
        </section>;
      })}
    </div>
    <section className="paper-panel">
      <h2>Gantt bertumpuk</h2>
      <p className="mb-5 text-sm text-slate-600">Skala waktu sama pada setiap baris. Arsiran kosong berarti CPU tidak mengeksekusi proses.</p>
      <div className="overflow-x-auto pb-8" tabIndex={0} role="region" aria-label="Gantt perbandingan, dapat digulir mendatar">
        <div style={{ minWidth: Math.max(duration * 26, 600) }}>
          {comparisons.map(({ quantum, result }, index) => <div key={index} className="mb-5">
            <p className="mb-2 font-mono text-sm">Panel {index + 1} · q = {quantum}</p>
            <div className="relative h-12 border-b border-ink/20">
              {result.gantt.map((block) => <div key={block.start} className="absolute h-10 overflow-hidden rounded border border-ink/60" style={{ left: `${block.start / duration * 100}%`, width: `${(block.end - block.start) / duration * 100}%`, background: block.start >= time ? "#f1f5f9" : block.processId ? palette[Number(block.processId.slice(1)) - 1] : "#e2e8f0" }} title={`${block.processId ?? "Idle / context switch"}: ${block.start}–${block.end}`}><span className="gantt-label">{block.processId ?? "—"}</span></div>)}
              <span className="pointer-events-none absolute -top-1 left-0 h-14 w-full" style={{ transform: `translateX(${time / duration * 100}%)` }}><span className="block h-full w-0.5 bg-ink" /></span>
            </div>
          </div>)}
          <div className="relative h-5 font-mono text-xs">{Array.from({ length: duration + 1 }, (_, index) => index).filter((value) => value % 5 === 0 || value === duration).map((value) => <span className="absolute" style={{ left: `${value / duration * 100}%`, transform: value === duration ? "translateX(-100%)" : undefined }} key={value}>{value}</span>)}</div>
        </div>
      </div>
    </section>
    <section className="paper-panel">
      <h2>Pengaruh quantum, dari 1 sampai 10</h2>
      <p className="mb-5 text-sm text-slate-600">Sumbu X: quantum. Sumbu Y: waktu (satuan) atau jumlah pergantian. Tabel menyediakan alternatif teks grafik.</p>
      <LazyQuantumChart data={chartData} />
      <details className="mt-4"><summary className="cursor-pointer font-semibold">Lihat data grafik</summary>
        <div className="overflow-x-auto"><table className="simple-table"><thead><tr><th>Quantum</th><th>Waktu tunggu rata-rata</th><th>Waktu respons rata-rata</th><th>Context switch</th></tr></thead><tbody>{sweep.map((item) => <tr key={item.quantum}><th>{item.quantum}</th><td>{item.waiting}</td><td>{item.response}</td><td>{item.switches}</td></tr>)}</tbody></table></div>
      </details>
    </section>
  </main>;
}
