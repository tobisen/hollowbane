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
