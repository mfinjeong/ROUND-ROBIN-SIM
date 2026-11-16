import { afterEach, describe, expect, it, vi } from "vitest";
import { createPlayback } from "./playback";
import { simulateRoundRobin } from "./scheduler";

const result = simulateRoundRobin([
  { id: "P1", arrivalTime: 0, burstTime: 5 },
  { id: "P2", arrivalTime: 1, burstTime: 3 },
], 2);
afterEach(() => vi.useRealTimers());

describe("jam playback bersama", () => {
  it("putar/jeda menjaga sisa tick dan mengubah kecepatan di tengah interval", () => {
    vi.useFakeTimers();
    const store = createPlayback(result);
    store.toggle();
    vi.advanceTimersByTime(400);
    store.toggle();
    vi.advanceTimersByTime(5000);
    expect(store.getState().cursor).toBe(0);
    store.toggle();
    store.setSpeed(2);
    vi.advanceTimersByTime(299);
    expect(store.getState().cursor).toBe(0);
    vi.advanceTimersByTime(1);
    expect(store.getState().cursor).toBe(1);
    store.dispose();
  });
  it("scrub cepat, maju/mundur membatalkan tick lama dan memakai snapshot yang sama", () => {
    vi.useFakeTimers();
    const store = createPlayback(result);
    store.toggle();
    [4, 1, 6, 2, 0, 5].forEach((cursor) => store.seek(cursor));
    vi.advanceTimersByTime(10000);
    expect(store.getState().cursor).toBe(5);
    expect(store.getState().playing).toBe(false);
    store.seek(4, "step");
    expect(store.getState().result.snapshots[store.getState().cursor].time).toBe(4);
    store.seek(5, "step");
    expect(store.getState().result.snapshots[store.getState().cursor].gantt.at(-1)?.end).toBe(5);
    store.dispose();
  });
  it("berhenti di akhir dan bisa diputar ulang", () => {
    vi.useFakeTimers();
    const store = createPlayback(result);
    store.toggle();
    vi.advanceTimersByTime(100000);
    expect(store.getState().cursor).toBe(result.duration);
    expect(store.getState().playing).toBe(false);
    store.toggle();
    expect(store.getState().cursor).toBe(0);
    expect(store.getState().playing).toBe(true);
    store.dispose();
  });
  it("mengubah playbackRate animasi aktif dan membatalkannya saat seek", () => {
    const store = createPlayback(result);
    const animation = { updatePlaybackRate: vi.fn(), cancel: vi.fn(), finished: Promise.resolve() } as unknown as Animation;
    store.register(animation);
    store.setSpeed(4);
    expect(animation.updatePlaybackRate).toHaveBeenLastCalledWith(4);
    store.seek(2);
    expect(animation.cancel).toHaveBeenCalled();
    store.dispose();
  });
});
