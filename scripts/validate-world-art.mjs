import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
/** Verify the reviewed source/export inventory; intentional art changes require a new audit. */
export function validateWorldArtInventory(registry) {
  const inventory = JSON.parse(
    readFileSync("docs/art/w3-inventory.json", "utf8"),
  );
  if (inventory.version !== 1) throw Error("Unknown W3 inventory version");
  let total = 0;
  let rgba = 2 * 128 * 64 * 4 + 128 * 128 * 4;
  for (const asset of inventory.assets) {
    const registered = registry.find((entry) => entry.id === asset.id);
    if (!registered || registered.provenance !== asset.provenance)
      throw Error(`Unregistered W3 provenance ${asset.id}`);
    for (const kind of ["source", "runtime"]) {
      const record = asset[kind];
      if (registered[kind] !== record.path)
        throw Error(`W3 path drift ${asset.id}`);
      const bytes = readFileSync(record.path);
      if (
        bytes.length !== record.bytes ||
        createHash("sha256").update(bytes).digest("hex") !== record.sha256
      )
        throw Error(`W3 ${kind} fingerprint drift ${asset.id}`);
    }
    if (asset.runtime.bytes > inventory.budgets.runtimeFileBytes)
      throw Error(`W3 texture file budget ${asset.id}`);
    total += asset.runtime.bytes;
    rgba +=
      registered.type === "environment" ? 1536 * 1024 * 4 : 1024 * 1024 * 4;
  }
  if (total > inventory.budgets.runtimeTotalBytes)
    throw Error("W3 total asset budget exceeded");
  if (rgba > inventory.budgets.nominalRgbaTextureBytes)
    throw Error("W3 nominal decoded texture budget exceeded");
  console.log(
    `Verified ${inventory.assets.length} W3 source/export fingerprints, ${total} runtime bytes.`,
  );
}
