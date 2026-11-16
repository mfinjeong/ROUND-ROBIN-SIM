import { memo } from "react";
import type { ProcessShapeName } from "@/lib/processes";

type ProcessShapeProps = {
  shape?: ProcessShapeName;
  color?: string;
  label?: string;
};

/** Bentuk proses, CPU, dan antrean dibuat sebagai SVG inline—tanpa aset generatif. */
export const ProcessShape = memo(function ProcessShape({ shape = "circle", color = "#f4a261", label = "P" }: ProcessShapeProps) {
  return (
    <svg viewBox="0 0 80 80" role="img" aria-label={`Proses ${label}`} className="h-16 w-16">
      {shape === "circle" && <circle cx="40" cy="40" r="28" fill={color} />}
      {shape === "square" && <rect x="12" y="12" width="56" height="56" rx="10" fill={color} />}
      {shape === "triangle" && <path d="M40 10 70 66H10Z" fill={color} />}
      {shape === "diamond" && <path d="M40 7 73 40 40 73 7 40Z" fill={color} />}
      {shape === "pentagon" && <path d="M40 8 72 31 60 69H20L8 31Z" fill={color} />}
      {shape === "hexagon" && <path d="M24 9H56L74 40 56 71H24L6 40Z" fill={color} />}
      {shape === "star" && <path d="M40 5 50 25 73 29 57 46 61 71 40 60 19 71 23 46 7 29 30 25Z" fill={color} />}
      {shape === "cross" && <path d="M27 7H53V27H73V53H53V73H27V53H7V27H27Z" fill={color} />}
      <circle cx="31" cy="37" r="3" fill="#183044" />
      <circle cx="49" cy="37" r="3" fill="#183044" />
      <path d="M30 49 Q40 57 50 49" fill="none" stroke="#183044" strokeWidth="3" />
    </svg>
  );
});

export function CpuIllustration() {
  return (
    <svg viewBox="0 0 180 120" role="img" aria-label="CPU" className="h-28 w-40">
      <rect x="35" y="20" width="110" height="80" rx="14" fill="#2a9d8f" stroke="#183044" strokeWidth="5" />
      <rect x="58" y="42" width="64" height="36" rx="6" fill="#fffaf0" />
      {[45, 70, 95, 120].map((x) => <path key={x} d={`M${x} 8v12M${x} 100v12`} stroke="#183044" strokeWidth="5" />)}
    </svg>
  );
}

export function QueueIllustration() {
  return (
    <svg viewBox="0 0 220 80" role="img" aria-label="Antrean siap" className="h-20 w-56">
      <path d="M8 65H212" stroke="#183044" strokeWidth="4" strokeLinecap="round" />
      {[35, 85, 135, 185].map((x, index) => (
        <rect key={x} x={x - 18} y="18" width="36" height="36" rx={index % 2 ? 18 : 6}
          fill={["#f4a261", "#e76f51", "#2a9d8f", "#8ab17d"][index]} />
      ))}
    </svg>
  );
}
