import type { Point } from "./isometric";
/** Bound fill cost on software graphics; native GPUs keep the full viewport. */
export function renderSize(
  viewport: Point,
  balanced: boolean,
): Point & { ratio: number } {
  const ratio = balanced ? Math.min(1, 960 / viewport.x, 600 / viewport.y) : 1;
  return {
    x: Math.round(viewport.x * ratio),
    y: Math.round(viewport.y * ratio),
    ratio,
  };
}

/** Ignore startup and respect an explicit player's detail choice. */
export function shouldBalanceDetail(
  frameMs: number[],
  elapsedMs: number,
  manual: boolean,
): boolean {
  if (manual || elapsedMs < 5000 || frameMs.length < 120) return false;
  const sorted = [...frameMs].sort((a, b) => a - b);
  return (sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0) > 25;
}
