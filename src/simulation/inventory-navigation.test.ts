import { it, expect } from "vitest";
import { inventoryNeighbor } from "./inventory-navigation";
it("navigates a two dimensional configurable grid without row wrapping", () => {
  expect(inventoryNeighbor(5, 2, "up", 10, 4)).toEqual({ x: 5, y: 1 });
  expect(inventoryNeighbor(5, 2, "right", 10, 4)).toEqual({ x: 6, y: 2 });
  expect(inventoryNeighbor(9, 2, "right", 10, 4)).toBeNull();
  expect(inventoryNeighbor(0, 2, "left", 10, 4)).toBeNull();
  expect(inventoryNeighbor(5, 3, "down", 10, 4)).toBeNull();
  expect(inventoryNeighbor(1, 0, "up", 2, 2)).toBeNull();
});
