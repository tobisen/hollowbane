import type { WarriorPose } from "./warrior-pose";

export interface StaffHitView {
  readonly pose: Readonly<WarriorPose>;
  readonly variant: "guard" | "extended";
}

/** Observe the authoritative pose once per tick, including during legacy art.
 * Keep a forward-held weapon forward on interruption; repeated guarded hits
 * cannot reselect an entry or restart the existing six-pose recovery clock.
 */
export function observeStaffHit(
  previous: StaffHitView | null,
  pose: Readonly<WarriorPose>,
): StaffHitView {
  const old = previous?.pose;
  const frame = old ? old.frame % 12 : -1;
  const extended =
    old &&
    (old.set === "attacks" ||
      (old.set === "abilities" && old.clip === "iron-fan")) &&
    frame >= 3 &&
    frame <= 7;
  return {
    pose: { ...pose },
    variant:
      pose.set !== "hit"
        ? "guard"
        : old?.set === "hit"
          ? previous!.variant
          : extended
            ? "extended"
            : "guard",
  };
}
