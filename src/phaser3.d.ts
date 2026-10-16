/** Phaser 3 declares only module 'phaser'; comparison adapter exposes the shared subset.
 * Version-specific lighting is narrowed explicitly in observatory.ts. */
declare module "phaser3" {
  const Phaser3: typeof import("phaser");
  export default Phaser3;
}
