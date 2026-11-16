"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CpuIllustration, ProcessShape, QueueIllustration } from "@/components/visuals/core-assets";

const scenes = [
  { title: "Setiap penumpang adalah proses", text: "Bayangkan CPU sebagai komidi putar. Setiap proses menunggu giliran untuk naik.", art: <ProcessShape shape="circle" color="#f4a261" label="P1" /> },
  { title: "Antrean siap bergerak maju", text: "Proses yang siap berada dalam antrean FIFO: yang datang duluan mendapat giliran lebih dulu.", art: <QueueIllustration /> },
  { title: "CPU memberi tumpangan", text: "Saat proses paling depan naik ke CPU, ia memakai kursinya untuk bekerja.", art: <CpuIllustration /> },
  { title: "Quantum adalah satu putaran", text: "Jatah waktu yang sama disebut time quantum. Setelah jatahnya habis, giliran berpindah.", art: <svg viewBox="0 0 180 180" role="img" aria-label="Jatah dua satuan waktu"><circle cx="90" cy="90" r="66" fill="none" stroke="#14675c" strokeWidth="16" /><text x="90" y="108" textAnchor="middle" fill="#183044" fontSize="54" fontFamily="monospace">2</text></svg> },
  { title: "Preempsi: kembali mengantre", text: "Jika belum selesai, proses turun dari CPU dan bergerak ke belakang antrean.", art: <div className="preempt-art"><ProcessShape shape="square" color="#e76f51" label="P1" /><ArrowRight size={40} /></div> },
  { title: "Selesai setelah kebutuhannya terpenuhi", text: "Proses yang burst-nya habis keluar dari putaran. Proses lain melanjutkan antrean.", art: <div className="done-art"><ProcessShape shape="triangle" color="#8ab17d" label="P1" /><span>✓</span></div> },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const story = document.getElementById("cerita");
      if (!story) return;
      const offset = Math.max(0, -story.getBoundingClientRect().top);
      setActive(Math.min(scenes.length - 1, Math.floor((offset + 2) / Math.max(window.innerHeight * 0.72, 1))));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [replayKey]);

  return (
    <main className="intro-page">
      <section className="intro-hero">
        <p className="eyebrow">Belajar dengan melihat</p>
        <h1>Round Robin seperti<br /><span>komidi putar.</span></h1>
        <p className="intro-lede">Setiap proses mendapat jatah putaran yang sama. Ikuti enam adegan singkat ini, lalu coba ubah sendiri quantum-nya.</p>
        <a href="#cerita" className="scroll-hint">Gulir untuk mulai ↓</a>
      </section>
      <section id="cerita" className="story">
        <div className="story-sticky">
          <div key={`${active}-${replayKey}`} className="story-art" aria-label={scenes[active].title}>{scenes[active].art}</div>
          <div className="story-copy">
            <p className="eyebrow">Adegan {active + 1} / {scenes.length}</p>
            <h2>{scenes[active].title}</h2>
            <p>{scenes[active].text}</p>
          </div>
          <div className="story-dots" aria-label="Kemajuan pengantar">
            {scenes.map((scene, index) => <button key={scene.title} className={index === active ? "active" : ""} aria-label={`Adegan ${index + 1}`} aria-current={index === active ? "step" : undefined} onClick={() => { setActive(index); window.scrollTo({ top: (document.getElementById("cerita")?.offsetTop ?? 0) + index * window.innerHeight * 0.72, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }} />)}
          </div>
        </div>
        <div className="story-steps" aria-hidden="true">{scenes.map((scene) => <div key={scene.title} />)}</div>
      </section>
      <section className="intro-end">
        <h2>Siap memutar proses?</h2>
        <p>Atur proses, jalankan satu langkah, dan amati akibatnya.</p>
        <Button size="lg" asChild><Link href="/simulator">Coba sendiri <ArrowRight size={18} /></Link></Button>
        <button className="replay-button" onClick={() => { setReplayKey((key) => key + 1); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}><RotateCcw size={16} /> Putar ulang pengantar</button>
      </section>
    </main>
  );
}
