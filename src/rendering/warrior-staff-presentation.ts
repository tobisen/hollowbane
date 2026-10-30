import type { WarriorPose } from "./warrior-pose";

export interface StaffFrame {
  readonly clip: string;
  readonly frame: number;
}
export interface StaffAttachment {
  readonly palm: readonly number[];
  readonly left: readonly number[];
  readonly tip: readonly number[];
}
export type StaffAttachments = Readonly<Record<string, StaffAttachment>>;
export interface StaffPresentation {
  readonly pose: Readonly<WarriorPose>;
  readonly frame: StaffFrame;
  readonly entry: StaffFrame | null;
}
export const staffFrameKey = (f: StaffFrame): string => `${f.clip}:${f.frame}`;
export function staffLogicalFrame(pose: Readonly<WarriorPose>): StaffFrame {
  return {
    clip:
      pose.set === "attacks"
        ? "primary"
        : pose.set === "movement"
          ? "movement"
          : pose.clip,
    frame:
      pose.set === "attacks" || pose.set === "abilities"
        ? pose.frame % 12
        : pose.frame,
  };
}
export function staffAttachmentStep(
  a: StaffFrame,
  b: StaffFrame,
  catalog: StaffAttachments,
): number {
  const x = catalog[staffFrameKey(a)],
    y = catalog[staffFrameKey(b)];
  if (!x || !y) throw Error("Missing reviewed staff attachment metadata");
  return Math.max(
    ...(["palm", "left", "tip"] as const).map((k) =>
      Math.hypot(...x[k].map((v, i) => v - y[k][i]!)),
    ),
  );
}
function closestReaction(
  frame: StaffFrame,
  catalog: StaffAttachments,
): StaffFrame {
  const entries: StaffFrame[] = [
    { clip: "hit", frame: 0 },
    ...[0, 1, 2, 3].map((frame) => ({ clip: "hit-extended", frame })),
  ];
  return entries.reduce((best, next) =>
    staffAttachmentStep(frame, next, catalog) <
    staffAttachmentStep(frame, best, catalog)
      ? next
      : best,
  );
}
/** Read-only candidate presentation: reuse reviewed reaction images to preserve
 * the incoming grip. Progress only with the authoritative hit/death pose; no
 * clock, gameplay callback, wall time or terminal restart. The optional forward
 * collapse uses reviewed death images with the approved lower body, never
 * standing reaction images. Enable only when that complete catalog is loaded.
 */
export function observeStaffPresentation(
  previous: StaffPresentation | null,
  pose: Readonly<WarriorPose>,
  catalog: StaffAttachments,
  forwardCollapse = false,
): StaffPresentation {
  let entry: StaffFrame | null = null;
  let frame = staffLogicalFrame(pose);
  if (pose.set === "hit") {
    entry =
      previous?.pose.set === "hit"
        ? previous.entry
        : previous
          ? closestReaction(previous.frame, catalog)
          : { clip: "hit", frame: 0 };
    if (entry)
      frame = {
        clip: entry.clip,
        frame: entry.frame + Math.floor(((5 - entry.frame) * pose.frame) / 5),
      };
  } else if (pose.set === "death" && forwardCollapse) {
    entry =
      previous?.pose.set === "death"
        ? previous.entry
        : previous &&
            staffAttachmentStep(
              previous.frame,
              { clip: "death-forward", frame: 0 },
              catalog,
            ) <
              staffAttachmentStep(
                previous.frame,
                { clip: "death", frame: 0 },
                catalog,
              )
          ? { clip: "death-forward", frame: 0 }
          : null;
    // Both entries share byte-identical fall/release/terminal images from4.
    if (entry && pose.frame < 4)
      frame = {
        clip: entry.clip,
        frame: pose.frame,
      };
  }
  return { pose: { ...pose }, frame, entry };
}
