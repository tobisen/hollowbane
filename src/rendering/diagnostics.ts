export interface Diagnostics {
  engine: string;
  renderer: string;
  samples: number;
  fps: number;
  p95FrameMs: number;
  readyMs: number;
  heapBytes: number | null;
  drawCalls: number | null;
}
declare global {
  interface Window {
    hollowbaneDiagnostics?: Diagnostics;
  }
}
/** Frame timing is wall-clock presentation telemetry, never simulation input. */
export function createDiagnostics(engine: string, renderer: string) {
  const state: Diagnostics = {
    engine,
    renderer,
    samples: 0,
    fps: 0,
    p95FrameMs: 0,
    readyMs: performance.now(),
    heapBytes: null,
    drawCalls: null,
  };
  const frames: number[] = [];
  window.hollowbaneDiagnostics = state;
  return {
    state,
    sample(delta: number, fps: number): void {
      if (!Number.isFinite(delta) || delta <= 0) return;
      frames.push(delta);
      if (frames.length > 300) frames.shift();
      state.samples++;
      state.fps = fps;
      // The HUD refreshes every 30 frames; avoid sorting its window every frame.
      if (state.samples === 1 || state.samples % 30 === 0) {
        const sorted = [...frames].sort((a, b) => a - b);
        state.p95FrameMs =
          sorted[
            Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)
          ] ?? 0;
      }
      const memory = (
        performance as Performance & { memory?: { usedJSHeapSize: number } }
      ).memory;
      state.heapBytes = memory?.usedJSHeapSize ?? null;
    },
  };
}
/** Optional instrumented mode only: counts GL submission calls, not objects/batches. */
export function instrumentDrawCalls(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): { reset(): void; count(): number; restore(): void } {
  let count = 0;
  const arrays = gl.drawArrays;
  const elements = gl.drawElements;
  gl.drawArrays = function (...args: Parameters<typeof arrays>) {
    count++;
    arrays.apply(gl, args);
  };
  gl.drawElements = function (...args: Parameters<typeof elements>) {
    count++;
    elements.apply(gl, args);
  };
  return {
    reset: () => {
      count = 0;
    },
    count: () => count,
    restore: () => {
      gl.drawArrays = arrays;
      gl.drawElements = elements;
    },
  };
}
