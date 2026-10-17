import { afterEach, expect, it, vi } from "vitest";
import { createDiagnostics } from "./diagnostics";

afterEach(() => vi.unstubAllGlobals());

it("refreshes the rolling percentile at HUD cadence while counting every frame", () => {
  vi.stubGlobal("window", {});
  const diagnostics = createDiagnostics("4", "WebGL");
  diagnostics.sample(10, 60);
  expect(diagnostics.state.p95FrameMs).toBe(10);
  for (let i = 0; i < 28; i++) diagnostics.sample(40, 25);
  expect(diagnostics.state.samples).toBe(29);
  expect(diagnostics.state.p95FrameMs).toBe(10);
  diagnostics.sample(40, 25);
  expect(diagnostics.state.samples).toBe(30);
  expect(diagnostics.state.p95FrameMs).toBe(40);
  diagnostics.sample(Number.NaN, 0);
  expect(diagnostics.state.samples).toBe(30);
});
