"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useSyncExternalStore } from "react";
import type { Playback, PlaybackState } from "@/lib/playback";

export const SimulationContext = createContext<Playback | null>(null);
export function usePlayback() {
  const store = useContext(SimulationContext);
  if (!store) throw new Error("State simulasi tidak tersedia.");
  return store;
}

/** Seleksi stabil: komponen yang datanya tidak berubah tidak dirender ulang. */
export function useSimulation<T>(selector: (state: PlaybackState) => T): T {
  const store = usePlayback();
  const cache = useRef<{ state: PlaybackState; value: T } | null>(null);
  const getSnapshot = useCallback(() => {
    const state = store.getState();
    const value = selector(state);
    if (cache.current && Object.is(cache.current.value, value)) return cache.current.value;
    cache.current = { state, value };
    return value;
  }, [store, selector]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export type MotionKind = "arrival" | "dispatch" | "execute" | "preempt" | "preempt-ring" | "complete" | "context-switch" | "idle" | "gantt";
const frames: Record<MotionKind, Keyframe[]> = {
  arrival: [{ transform: "translateY(-32px)", opacity: 0 }, { transform: "translateY(4px)", opacity: 1, offset: 0.8 }, { transform: "translateY(0)", opacity: 1 }],
  dispatch: [{ transform: "translateX(-32px)", opacity: 0.3 }, { transform: "translateX(0)", opacity: 1 }],
  execute: [{ transform: "rotate(-3deg)" }, { transform: "rotate(3deg)", offset: 0.5 }, { transform: "rotate(0)" }],
  preempt: [{ transform: "translate(30px,-24px)", opacity: 0.4 }, { transform: "translate(15px,-12px)", opacity: 0.8, offset: 0.5 }, { transform: "translate(0,0)", opacity: 1 }],
  "preempt-ring": [{ opacity: 1 }, { opacity: 0.3, offset: 0.5 }, { opacity: 1 }],
  complete: [{ transform: "translateX(-28px)", opacity: 0.4 }, { transform: "translateX(0)", opacity: 1 }],
  "context-switch": [{ opacity: 0.4 }, { opacity: 1 }],
  idle: [{ opacity: 0.6 }, { opacity: 1 }],
  gantt: [{ transform: "scaleX(0.85)", opacity: 0.5 }, { transform: "scaleX(1)", opacity: 1 }],
};
const durations: Record<MotionKind, number> = { arrival: 400, dispatch: 350, execute: 1000, preempt: 500, "preempt-ring": 500, complete: 450, "context-switch": 200, idle: 1000, gantt: 350 };

export function useSimulationMotion(kind: MotionKind, key: string | number) {
  const ref = useRef<HTMLDivElement>(null);
  const store = usePlayback();
  useEffect(() => {
    const node = ref.current;
    if (!node || key === "" || store.getState().movement === "seek" || !node.animate) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animation = node.animate(reduced.matches ? [{ opacity: 0.6 }, { opacity: 1 }] : frames[kind], {
      duration: reduced.matches ? 120 : durations[kind],
      easing: "ease-out",
    });
    const cleanup = store.register(animation);
    const preferenceChanged = () => animation.cancel();
    reduced.addEventListener("change", preferenceChanged);
    return () => { reduced.removeEventListener("change", preferenceChanged); cleanup(); };
  }, [store, kind, key]);
  return ref;
}

/** Transform perubahan nilai ikut jam animasi yang sama (jeda/kecepatan/scrub). */
export function useProgressMotion<T extends Element>(transform: string) {
  const ref = useRef<T>(null);
  const previous = useRef(transform);
  const store = usePlayback();
  useEffect(() => {
    const from = previous.current;
    previous.current = transform;
    const node = ref.current;
    if (!node || from === transform || store.getState().movement === "seek") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return store.register(node.animate(reduced ? [{ opacity: 0.6 }, { opacity: 1 }] : [{ transform: from }, { transform }], { duration: reduced ? 120 : 350, easing: "ease-out" }));
  }, [store, transform]);
  return ref;
}
