import { it, expect, vi } from "vitest";
import { actuatorFor, pulseHaptics, stopHaptics } from "./haptics";
it("detects optional modern/legacy capability and handles absent/rejected hardware", async () => {
  const playEffect = vi.fn(async () => "complete"),
    reset = vi.fn(async () => "complete"),
    a = { playEffect, reset };
  expect(await pulseHaptics(a, false)).toBe("disabled");
  expect(playEffect).not.toHaveBeenCalled();
  expect(await pulseHaptics(actuatorFor({ vibrationActuator: a }), true)).toBe(
    "played",
  );
  expect(playEffect).toHaveBeenCalledWith(
    "dual-rumble",
    expect.objectContaining({ duration: 45 }),
  );
  stopHaptics(a);
  expect(reset).toHaveBeenCalled();
  expect(await pulseHaptics(null, true)).toBe("unsupported");
  expect(
    await pulseHaptics(
      {
        playEffect: async () => {
          throw new Error("denied");
        },
      },
      true,
    ),
  ).toBe("unavailable");
  expect(await pulseHaptics({ pulse: async () => true }, true)).toBe("played");
});
