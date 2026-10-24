import { expect, it } from "vitest";
import { CombatAudio, soundRecipe } from "./combat-audio";
it("original spell recipes are distinct and safely bounded", () => {
  const ids = [
    "ember-lance",
    "rime-ring",
    "storm-thread",
    "iron-fan",
    "oath-echo",
    "briar-edge",
  ];
  const recipes = ids.map((skill) => soundRecipe({ kind: "spell", skill }));
  expect(new Set(recipes.map((r) => r.from)).size).toBe(6);
  expect(
    recipes.every((r) => r.gain <= 0.055 && r.duration < 0.4 && r.to > 0),
  ).toBe(true);
});
it("mute does not allocate context; unsupported audio is harmless", async () => {
  let calls = 0;
  const bank = new CombatAudio(() => {
    calls++;
    throw Error("unsupported");
  });
  bank.setMuted(true);
  await bank.unlock();
  bank.play({ kind: "impact" });
  expect(calls).toBe(0);
  bank.setMuted(false);
  await bank.unlock();
  expect(bank.status().state).toBe("unavailable");
  bank.play({ kind: "spell" });
  expect(bank.status().played).toBe(0);
});
it("voice budget is bounded and mute stops all voices", async () => {
  let stopped = 0;
  const context = {
    state: "running",
    currentTime: 0,
    destination: {},
    createOscillator: () => ({
      frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
      disconnect() {},
      start() {},
      stop() {
        stopped++;
      },
    }),
    createGain: () => ({
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
      disconnect() {},
    }),
  } as unknown as AudioContext;
  const bank = new CombatAudio(() => context);
  await bank.unlock();
  for (let i = 0; i < 12; i++) bank.play({ kind: "impact" });
  expect(bank.status().active).toBe(8);
  expect(bank.status().dropped).toBe(4);
  bank.setMuted(true);
  expect(bank.status().active).toBe(0);
  expect(stopped).toBeGreaterThanOrEqual(8);
});
it("loot quality cues are distinct and remain within the shared audio budget", () => {
  const recipes = (["normal", "magic", "rare", "unique"] as const).map(
    (quality) => soundRecipe({ kind: "loot", quality }),
  );
  expect(new Set(recipes.map((r) => r.from))).toHaveLength(4);
  expect(recipes.every((r) => r.gain <= 0.055 && r.duration < 0.4)).toBe(true);
});
it("effects volume scales actual gain, zero stays silent and invalid values are rejected", async () => {
  const peaks: number[] = [];
  let oscillators = 0;
  const context = {
    state: "running",
    currentTime: 0,
    destination: {},
    createOscillator: () => {
      oscillators++;
      return {
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        disconnect() {},
        start() {},
        stop() {},
      };
    },
    createGain: () => ({
      gain: {
        setValueAtTime() {},
        exponentialRampToValueAtTime(value: number, time: number) {
          if (time === 0.006) peaks.push(value);
        },
      },
      connect() {},
      disconnect() {},
    }),
  } as unknown as AudioContext;
  const bank = new CombatAudio(() => context);
  await bank.unlock();
  bank.setVolume(0.35);
  bank.play({ kind: "impact" });
  expect(peaks).toEqual([soundRecipe({ kind: "impact" }).gain * 0.35]);
  expect(bank.status().volume).toBe(0.35);
  bank.setVolume(0);
  bank.play({ kind: "impact" });
  expect(oscillators).toBe(1);
  expect(bank.status().active).toBe(0);
  for (const v of [-0.1, 1.1, NaN, Infinity])
    expect(() => bank.setVolume(v)).toThrow();
});
