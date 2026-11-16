"use client";

import { memo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type QuantumPoint = { quantum: number; waiting: number; response: number; switches: number };
export default memo(function QuantumChart({ data }: { data: QuantumPoint[] }) {
  return <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 12, right: 20, bottom: 20, left: 0 }} accessibilityLayer>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="quantum" tick={{ fill: "#183044" }} label={{ value: "Quantum", position: "insideBottom", offset: -12 }} />
      <YAxis tick={{ fill: "#183044" }} />
      <Tooltip isAnimationActive={false} /><Legend verticalAlign="top" />
      <Line type="linear" dataKey="waiting" name="Rata-rata waktu tunggu" stroke="#183044" strokeWidth={2} isAnimationActive={false} />
      <Line type="linear" dataKey="response" name="Rata-rata waktu respons" stroke="#a53c28" strokeWidth={2} strokeDasharray="5 4" isAnimationActive={false} />
      <Line type="linear" dataKey="switches" name="Context switch" stroke="#14675c" strokeWidth={2} strokeDasharray="2 3" isAnimationActive={false} />
    </LineChart>
  </ResponsiveContainer>;
});
