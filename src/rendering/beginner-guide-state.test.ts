import { expect, test } from "vitest";
import {
  BEGINNER_HINTS,
  newBeginnerProgress,
  readBeginnerProgress,
  observeBeginnerProgress,
  beginnerHint,
  dismissBeginnerHint,
  type BeginnerObservation,
} from "./beginner-guide-state";
const camp: BeginnerObservation = {
  inCamp: true,
  moved: false,
  attacked: false,
  cast: false,
  collected: false,
  inventory: false,
  quests: false,
  lootAvailable: false,
  needsRecovery: false,
};
test("guidance is immutable, idempotent and advances only from actual observations", () => {
  const initial = newBeginnerProgress();
  expect(beginnerHint(initial, camp)).toBe("movement");
  const moved = observeBeginnerProgress(initial, { ...camp, moved: true });
  expect(beginnerHint(moved, camp)).toBe("quests");
  expect(initial.completed).toEqual([]);
  expect(observeBeginnerProgress(moved, camp)).toBe(moved);
  const learned = observeBeginnerProgress(moved, {
    ...camp,
    quests: true,
    inventory: true,
  });
  expect(beginnerHint(learned, camp)).toBeNull();
  const field = { ...camp, inCamp: false };
  const ventured = observeBeginnerProgress(learned, field);
  expect(beginnerHint(ventured, field)).toBe("attack");
  const attacked = observeBeginnerProgress(ventured, {
    ...field,
    attacked: true,
  });
  expect(beginnerHint(attacked, field)).toBe("skill");
  const cast = observeBeginnerProgress(attacked, { ...field, cast: true });
  expect(beginnerHint(cast, field)).toBe("resources");
  const recovered = dismissBeginnerHint(cast, "resources");
  expect(beginnerHint(recovered, { ...field, lootAvailable: true })).toBe(
    "loot",
  );
  const collected = observeBeginnerProgress(recovered, {
    ...field,
    collected: true,
  });
  expect(beginnerHint(collected, field)).toBe("return");
  const returned = observeBeginnerProgress(collected, camp);
  expect(beginnerHint(returned, camp)).toBeNull();
  expect(returned.completed).toContain("return");
});
test("dismiss, disable and replay never change earned progress or other character state", () => {
  const first = dismissBeginnerHint(newBeginnerProgress(), "movement");
  expect(dismissBeginnerHint(first, "movement")).toBe(first);
  expect(beginnerHint(first, camp)).toBe("quests");
  const disabled = { ...first, enabled: false };
  expect(beginnerHint(disabled, { ...camp, needsRecovery: true })).toBeNull();
  expect(readBeginnerProgress(JSON.stringify(disabled))).toEqual(disabled);
  expect(newBeginnerProgress().dismissed).toEqual([]);
  expect(first.dismissed).toEqual(["movement"]);
  expect(newBeginnerProgress().enabled).toBe(true);
});
test("bounded strict preferences reject corruption without touching gameplay saves", () => {
  for (const invalid of [
    null,
    "broken",
    "x".repeat(4097),
    JSON.stringify({ ...newBeginnerProgress(), version: 2 }),
    JSON.stringify({ ...newBeginnerProgress(), enabled: "false" }),
    JSON.stringify({
      ...newBeginnerProgress(),
      dismissed: ["movement", "movement"],
    }),
    JSON.stringify({ ...newBeginnerProgress(), completed: ["unknown"] }),
    JSON.stringify({ ...newBeginnerProgress(), extra: 1 }),
  ])
    expect(readBeginnerProgress(invalid)).toEqual(newBeginnerProgress());
  const p = {
    ...newBeginnerProgress(),
    completed: [...BEGINNER_HINTS],
    ventured: true,
  };
  expect(readBeginnerProgress(JSON.stringify(p))).toEqual(p);
});
