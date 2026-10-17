import { expect, it } from "vitest";
import { clientToGround, groundToClient } from "./view";
it("round trips targets across zoom, camera offsets, CSS scale and canvas offsets", () => {
  for (const width of [960, 1280, 1920])
    for (const zoom of [0.8, 1.25, 1.6]) {
      const canvas = { x: 17, y: 23, width, height: 800 },
        view = { x: 345.5, y: 170.25, width: width / zoom, height: 800 / zoom },
        p = { x: 800.75, y: 500.125 };
      const result = clientToGround(
        groundToClient(p, canvas, view),
        canvas,
        view,
      );
      expect(result.x).toBeCloseTo(p.x, 10);
      expect(result.y).toBeCloseTo(p.y, 10);
    }
});
