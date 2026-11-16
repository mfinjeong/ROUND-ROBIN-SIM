import type { ProcessInput } from "@/lib/scheduler";

export const scenarios: { name: string; description: string; processes: ProcessInput[]; cost: number }[] = [
  {
    name: "Quantum terlalu kecil",
    description: "Dua proses panjang saling bergantian. Biaya pergantian membuat overhead quantum kecil terlihat.",
    processes: [{ id: "P1", arrivalTime: 0, burstTime: 12 }, { id: "P2", arrivalTime: 0, burstTime: 10 }],
    cost: 1,
  },
  {
    name: "Quantum terlalu besar",
    description: "Proses pendek menunggu proses panjang; quantum besar mendekati perilaku FCFS.",
    processes: [{ id: "P1", arrivalTime: 0, burstTime: 10 }, { id: "P2", arrivalTime: 0, burstTime: 2 }, { id: "P3", arrivalTime: 0, burstTime: 1 }],
    cost: 0,
  },
  {
    name: "Proses pendek di antara proses panjang",
    description: "Bandingkan seberapa cepat proses pendek pertama kali mendapat CPU.",
    processes: [{ id: "P1", arrivalTime: 0, burstTime: 12 }, { id: "P2", arrivalTime: 1, burstTime: 2 }, { id: "P3", arrivalTime: 2, burstTime: 10 }],
    cost: 0,
  },
  {
    name: "Kedatangan beruntun",
    description: "Contoh acuan: proses yang tiba tepat pada batas quantum masuk antrean lebih dulu.",
    processes: [{ id: "P1", arrivalTime: 0, burstTime: 5 }, { id: "P2", arrivalTime: 1, burstTime: 3 }, { id: "P3", arrivalTime: 2, burstTime: 6 }, { id: "P4", arrivalTime: 4, burstTime: 2 }],
    cost: 0,
  },
];
