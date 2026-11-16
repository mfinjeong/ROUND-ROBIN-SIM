import type { SimulationResult } from "./scheduler";

export type PlaybackState = {
  result: SimulationResult;
  cursor: number;
  playing: boolean;
  speed: number;
  movement: "seek" | "step" | "play";
};

/** Satu jam untuk seluruh tampilan. Pergantian kecepatan mempertahankan sisa tick. */
export function createPlayback(result: SimulationResult) {
  let state: PlaybackState = { result, cursor: 0, playing: false, speed: 1, movement: "seek" };
  const listeners = new Set<() => void>();
  const animations = new Set<Animation>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let startedAt = 0;
  let remaining = 1000;
  const emit = () => listeners.forEach((listener) => listener());
  const stopTimer = () => {
    if (timer !== undefined) {
      remaining = Math.max(0, remaining - (Date.now() - startedAt) * state.speed);
      clearTimeout(timer);
      timer = undefined;
    }
  };
  const cancelAnimations = () => {
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  };
  const schedule = () => {
    if (!state.playing) return;
    startedAt = Date.now();
    timer = setTimeout(() => {
      timer = undefined;
      remaining = 1000;
      const cursor = Math.min(state.cursor + 1, result.snapshots.length - 1);
      state = { ...state, cursor, playing: cursor < result.snapshots.length - 1, movement: "play" };
      emit();
      schedule();
    }, remaining / state.speed);
  };
  return {
    getState: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    toggle() {
      stopTimer();
      if (state.playing) {
        state = { ...state, playing: false };
        animations.forEach((animation) => animation.pause());
      } else {
        const ended = state.cursor >= result.snapshots.length - 1;
        if (ended) { remaining = 1000; cancelAnimations(); }
        state = { ...state, playing: true, cursor: ended ? 0 : state.cursor, movement: "play" };
        animations.forEach((animation) => animation.play());
      }
      emit();
      schedule();
    },
    seek(cursor: number, movement: "seek" | "step" = "seek") {
      stopTimer();
      cancelAnimations();
      remaining = 1000;
      state = { ...state, cursor: Math.max(0, Math.min(cursor, result.snapshots.length - 1)), playing: false, movement };
      emit();
    },
    setSpeed(speed: number) {
      if (![0.5, 1, 2, 4].includes(speed)) return;
      stopTimer();
      state = { ...state, speed };
      animations.forEach((animation) => animation.updatePlaybackRate(speed));
      emit();
      schedule();
    },
    register(animation: Animation) {
      animation.updatePlaybackRate(state.speed);
      animations.add(animation);
      void animation.finished.catch(() => {}).finally(() => animations.delete(animation));
      return () => { animation.cancel(); animations.delete(animation); };
    },
    dispose() { stopTimer(); cancelAnimations(); },
  };
}

export type Playback = ReturnType<typeof createPlayback>;
