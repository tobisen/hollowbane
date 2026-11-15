import { fromGround, onGround, type Navigation } from "./navigation";
import type { Point } from "./isometric";
import type { Walker } from "../simulation/locomotion";
import { VISUAL_WALK_STRIDE } from "./visual-warrior-motion";

export const VISUAL_SIZE = { x: 1280, y: 800 };
export const VISUAL_SPAWN = { x: 620, y: 495 };
export const VISUAL_SCALE = 0.5;
const points = (values: readonly (readonly [number, number])[]): Point[] =>
  values.map(([x, y]) => ({ x, y }));

/** Hand-authored from visible ground, never inferred from canopy opacity.
 * Coordinates are approved-image pixels; existing navigation owns clearance,
 * pathfinding and sliding. Hidden ground is deliberately not reconstructed.
 */
export const visualNavigation: Navigation = {
  clearance: 8,
  boundary: points([
    [85, 742],
    [145, 570],
    [210, 420],
    [180, 350],
    [260, 315],
    [395, 300],
    [480, 255],
    [610, 220],
    [720, 180],
    [835, 85],
    [980, 65],
    [1090, 70],
    [1195, 105],
    [1230, 245],
    [1190, 355],
    [1130, 420],
    [1100, 500],
    [1045, 575],
    [1020, 625],
    [1090, 715],
    [970, 752],
    [650, 765],
    [380, 765],
    [150, 765],
  ]),
  obstacles: [
    { x: 62, y: 385, rx: 55, ry: 24 },
    { x: 285, y: 286, rx: 42, ry: 18 },
    { x: 511, y: 156, rx: 24, ry: 13 },
    { x: 752, y: 154, rx: 20, ry: 11 },
    { x: 1158, y: 652, rx: 84, ry: 30 },
    // Visible wall footings: short overlapping ellipses follow each wall arm.
    ...[
      [824, 281],
      [855, 270],
      [886, 255],
      [916, 241],
      [947, 226],
      [978, 211],
      [1008, 196],
      [1037, 189],
      [1066, 207],
      [1094, 225],
      [1121, 242],
      [1148, 258],
      [1177, 275],
    ].map(([x, y]) => ({ x: x!, y: y!, rx: 22, ry: 10 })),
    { x: 953, y: 329, rx: 22, ry: 12 },
    { x: 1041, y: 320, rx: 18, ry: 9 },
    { x: 268, y: 334, rx: 24, ry: 10 },
  ],
};

export interface VisualOccluder {
  id: string;
  anchor: Point;
  polygon: Point[];
}
/** Conservative interior silhouettes, not perfect object extraction.
 * Each slice reuses identical registered plate pixels; the full plate remains
 * underneath. No hidden detail, alpha halos, moving objects or inpainting.
 */
export const visualOccluders: VisualOccluder[] = [
  {
    id: "left-trunk",
    anchor: { x: 62, y: 385 },
    polygon: points([
      [0, 240],
      [25, 235],
      [49, 261],
      [65, 293],
      [62, 325],
      [78, 351],
      [99, 368],
      [89, 389],
      [65, 382],
      [45, 410],
      [20, 407],
      [32, 369],
      [20, 336],
      [0, 330],
    ]),
  },
  {
    id: "left-oak",
    anchor: { x: 285, y: 286 },
    polygon: points([
      [245, 150],
      [274, 150],
      [292, 179],
      [285, 219],
      [298, 249],
      [329, 270],
      [321, 287],
      [291, 280],
      [267, 296],
      [248, 289],
      [267, 260],
      [259, 218],
    ]),
  },
  {
    id: "ruin-west",
    anchor: { x: 871, y: 265 },
    polygon: points([
      [795, 224],
      [820, 204],
      [841, 203],
      [851, 215],
      [880, 199],
      [894, 203],
      [915, 191],
      [935, 196],
      [938, 225],
      [916, 242],
      [885, 258],
      [853, 275],
      [825, 286],
      [808, 271],
    ]),
  },
  {
    id: "ruin-corner",
    anchor: { x: 1002, y: 202 },
    polygon: points([
      [936, 193],
      [964, 177],
      [980, 173],
      [1000, 151],
      [1003, 131],
      [1020, 118],
      [1031, 100],
      [1050, 99],
      [1055, 118],
      [1070, 124],
      [1076, 155],
      [1065, 180],
      [1035, 193],
      [1005, 204],
      [973, 219],
      [938, 234],
    ]),
  },
  {
    id: "ruin-east",
    anchor: { x: 1120, y: 245 },
    polygon: points([
      [1065, 170],
      [1084, 176],
      [1093, 190],
      [1110, 187],
      [1124, 206],
      [1143, 207],
      [1152, 227],
      [1171, 232],
      [1181, 245],
      [1210, 257],
      [1211, 278],
      [1185, 277],
      [1154, 258],
      [1125, 243],
      [1090, 225],
      [1060, 205],
    ]),
  },
  {
    id: "foreground-foliage",
    anchor: { x: 1100, y: 640 },
    polygon: points([
      [1023, 440],
      [1046, 420],
      [1063, 424],
      [1083, 409],
      [1105, 415],
      [1124, 404],
      [1140, 417],
      [1173, 419],
      [1182, 438],
      [1206, 435],
      [1215, 453],
      [1184, 459],
      [1167, 473],
      [1144, 464],
      [1125, 478],
      [1098, 462],
      [1078, 473],
      [1053, 458],
      [1033, 461],
    ]),
  },
  {
    id: "foreground-trunk",
    anchor: { x: 1158, y: 652 },
    polygon: points([
      [1280, 420],
      [1255, 438],
      [1233, 473],
      [1204, 510],
      [1170, 540],
      [1147, 571],
      [1120, 594],
      [1088, 619],
      [1059, 639],
      [1030, 660],
      [1009, 680],
      [1044, 674],
      [1082, 654],
      [1120, 636],
      [1173, 611],
      [1210, 585],
      [1246, 554],
      [1280, 532],
    ]),
  },
  {
    id: "ruin-rock",
    anchor: { x: 953, y: 329 },
    polygon: points([
      [940, 308],
      [953, 300],
      [966, 304],
      [972, 316],
      [968, 329],
      [945, 332],
    ]),
  },
];

export const visualReviewStops = {
  path: VISUAL_SPAWN,
  woodland: { x: 331, y: 330 },
  ruin: { x: 908, y: 291 },
  behind: { x: 1070, y: 491 },
  front: { x: 1032, y: 690 },
};

export function visualCamera(target: Point, viewport: Point): Point {
  return {
    x: Math.round(
      Math.max(
        0,
        Math.min(VISUAL_SIZE.x - viewport.x, target.x - viewport.x / 2),
      ),
    ),
    y: Math.round(
      Math.max(
        0,
        Math.min(VISUAL_SIZE.y - viewport.y, target.y - viewport.y / 2),
      ),
    ),
  };
}

export function visualActorFrame(walker: Walker, idleStart: number): number {
  return walker.walking
    ? 8 + Math.floor(((walker.distance / VISUAL_WALK_STRIDE) % 1) * 16)
    : Math.floor((walker.tick - idleStart) / 24) % 8;
}

export { fromGround as visualFromGround, onGround as visualOnGround };
