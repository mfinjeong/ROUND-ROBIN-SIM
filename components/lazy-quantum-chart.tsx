"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, useRef, useState } from "react";
import type { QuantumPoint } from "./quantum-chart";

const Chart = dynamic(() => import("./quantum-chart"), { ssr: false, loading: () => <p role="status">Memuat grafik… Data juga tersedia pada tabel di bawah.</p> });

export const LazyQuantumChart = memo(function LazyQuantumChart({ data }: { data: QuantumPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "100px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="h-80 w-full" aria-label="Grafik pengaruh quantum">{visible ? <Chart data={data} /> : <p className="muted">Grafik dimuat saat terlihat. Data tersedia pada tabel di bawah.</p>}</div>;
});
