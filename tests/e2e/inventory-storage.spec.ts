import { test, expect } from "@playwright/test";
import { build } from "vite";
import { createInventorySession } from "../../src/simulation/inventory-world";
import { inventoryItem } from "../../src/simulation/inventory-test-helper";
import { serializeCharacter } from "../../src/simulation/inventory-save";
let code = "";
test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: { entry: "src/rendering/inventory-storage.ts", formats: ["es"] },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  if (!output || !("output" in output))
    throw Error("Missing storage test bundle");
  const chunk = output.output.find((c) => c.type === "chunk");
  if (!chunk || chunk.type !== "chunk") throw Error("Missing storage module");
  code = chunk.code;
});
test("IndexedDB atomic current/backup, stale-tab conflict and explicit corrupt-save recovery", async ({
  page,
}) => {
  await page.route("**/__inventory-storage-test.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: code }),
  );
  await page.goto("./?inventory=1&training=1");
  const session = createInventorySession();
  session.character.grid.items.push({
    item: inventoryItem("ash-blade"),
    x: 0,
    y: 0,
  });
  const text = serializeCharacter(session);
  const result = await page.evaluate(async (text) => {
    const url = new URL("__inventory-storage-test.js", location.href).href;
    const { InventoryStorage } = (await import(
      url
    )) as typeof import("../../src/rendering/inventory-storage");
    const name = "inventory-test-atomic";
    const a = new InventoryStorage(undefined, name),
      b = new InventoryStorage(undefined, name);
    const empty = await a.load();
    const session = JSON.parse(text).body as {
      character: import("../../src/simulation/equipment").CharacterInventory;
      loot: Omit<import("../../src/simulation/world-loot").LootWorld, "deaths">;
    };
    const s = {
      ...session,
      loot: { ...session.loot, deaths: new Set<number>() },
    };
    await a.save(s);
    const first = await b.load();
    s.character.revision++;
    await a.save(s);
    let conflict = "";
    try {
      await b.save(s);
    } catch (e) {
      conflict = String(e);
    }
    const read = await b.load();
    a.close();
    b.close();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open(name);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("snapshots", "readwrite");
      tx.objectStore("snapshots").put(
        { revision: 2, text: "corrupt" },
        "current",
      );
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    const recovered = new InventoryStorage(undefined, name),
      offered = await recovered.load();
    let blocked = "";
    try {
      await recovered.save(s);
    } catch (e) {
      blocked = String(e);
    }
    const restored = await recovered.recover(),
      final = await recovered.load();
    recovered.close();
    const inspectDb = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open(name);
      r.onsuccess = () => resolve(r.result);
    });
    const quarantine = await new Promise<unknown>((resolve) => {
      const tx = inspectDb.transaction("snapshots");
      const r = tx.objectStore("snapshots").get("quarantine");
      r.onsuccess = () => resolve(r.result);
    });
    inspectDb.close();
    return {
      empty: empty.kind,
      first: first.kind,
      conflict,
      read: read.kind,
      offered: offered.kind,
      blocked,
      restored: restored.character.grid.items[0]?.item.id,
      final: final.kind,
      quarantine,
    };
  }, text);
  expect(result).toMatchObject({
    empty: "empty",
    first: "valid",
    read: "valid",
    offered: "recoverable",
    final: "valid",
    restored: session.character.grid.items[0]!.item.id,
    quarantine: { revision: 2, text: "corrupt" },
  });
  expect(result.conflict).toContain("another tab");
  expect(result.blocked).toContain("recover");
});
