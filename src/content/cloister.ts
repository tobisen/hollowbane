import type { Navigation } from "../world/navigation";
export const CLOISTER_NAV: Navigation = {
  boundary: [
    { x: 440, y: 365 },
    { x: 740, y: 270 },
    { x: 1050, y: 350 },
    { x: 1170, y: 500 },
    { x: 1030, y: 630 },
    { x: 850, y: 710 },
    { x: 630, y: 650 },
    { x: 425, y: 530 },
  ],
  obstacles: [
    { x: 1020, y: 480, rx: 35, ry: 17 },
    { x: 610, y: 590, rx: 62, ry: 25 },
    { x: 910, y: 610, rx: 22, ry: 12 },
    { x: 455, y: 465, rx: 30, ry: 18 },
  ],
};
export const CLOISTER_PROPS = [
  {
    id: 1,
    frame: 0,
    x: 1020,
    y: 480,
    width: 180,
    height: 180,
    occlusionWidth: 74,
  },
  {
    id: 2,
    frame: 1,
    x: 455,
    y: 465,
    width: 250,
    height: 250,
    occlusionWidth: 180,
  },
  {
    id: 3,
    frame: 2,
    x: 610,
    y: 590,
    width: 190,
    height: 135,
    occlusionWidth: 130,
  },
  {
    id: 4,
    frame: 3,
    x: 910,
    y: 610,
    width: 95,
    height: 105,
    occlusionWidth: 60,
  },
];
export const LANTERNS = [
  { x: 742, y: 182, radius: 180 },
  { x: 1283, y: 436, radius: 170 },
  { x: 341, y: 650, radius: 150 },
  { x: 910, y: 570, radius: 140 },
];
