import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import assets from "../src/rendering/warrior-assets.json";

/** Publish the approved pixels without duplicating or editing source atlases.
 * Only this allowlist is exposed by the dev server; no arbitrary file paths.
 */
export function warriorProductionAssets(): Plugin {
  const entries = Object.values(assets).flatMap((set) =>
    Object.entries(set.views).map(([direction, view]) => ({
      ...view,
      source: new URL(
        `../public/dev/${set.source}/${direction}.png`,
        import.meta.url,
      ),
    })),
  );
  return {
    name: "warrior-production-assets",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split("?")[0];
        const entry = entries.find(
          (e) => path === `/${e.file}` || path === `/hollowbane/${e.file}`,
        );
        if (!entry) return next();
        response.setHeader("Content-Type", "image/png");
        response.end(readFileSync(entry.source));
      });
    },
    buildStart() {
      for (const entry of entries) {
        const source = readFileSync(entry.source);
        if (
          source.length !== entry.bytes ||
          createHash("sha256").update(source).digest("hex") !== entry.sha256
        )
          throw Error(`Approved Warrior atlas changed: ${entry.source}`);
        this.emitFile({ type: "asset", fileName: entry.file, source });
      }
    },
  };
}
