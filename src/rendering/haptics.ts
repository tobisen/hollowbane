export type HapticResult =
  "disabled" | "unsupported" | "played" | "unavailable";
interface Actuator {
  playEffect?: (
    type: "dual-rumble",
    params: {
      duration: number;
      startDelay: number;
      strongMagnitude: number;
      weakMagnitude: number;
    },
  ) => Promise<unknown>;
  pulse?: (strength: number, duration: number) => Promise<boolean>;
  reset?: () => Promise<unknown>;
}
export function actuatorFor(pad: unknown): unknown {
  if (!pad || typeof pad !== "object") return null;
  const p = pad as { vibrationActuator?: unknown; hapticActuators?: unknown[] };
  return p.vibrationActuator ?? p.hapticActuators?.[0] ?? null;
}
export async function pulseHaptics(
  raw: unknown,
  enabled: boolean,
): Promise<HapticResult> {
  if (!enabled) return "disabled";
  if (!raw || typeof raw !== "object") return "unsupported";
  const a = raw as Actuator;
  try {
    if (typeof a.playEffect === "function") {
      await a.playEffect("dual-rumble", {
        duration: 45,
        startDelay: 0,
        strongMagnitude: 0.2,
        weakMagnitude: 0.35,
      });
      return "played";
    }
    if (typeof a.pulse === "function")
      return (await a.pulse(0.25, 45)) ? "played" : "unavailable";
  } catch {
    return "unavailable";
  }
  return "unsupported";
}
export function stopHaptics(raw: unknown): void {
  const a = raw as Actuator | null;
  try {
    if (typeof a?.reset === "function") void a.reset().catch(() => {});
  } catch {
    /* Optional hardware must not block input. */
  }
}
