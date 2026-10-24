import { expect, test, type Page } from "@playwright/test";
import { readdirSync } from "node:fs";
import { serializeCharacter } from "../../src/simulation/inventory-save";
import {
  characterSlotFixture,
  historicalCharacter,
} from "../fixtures/character-slot";

declare global {
  interface Window {
    characterStorageModule: typeof import("../../src/rendering/character-storage");
  }
}
const texts = ["warrior", "sorcerer", "ranger"].map((id, index) =>
  serializeCharacter(
    characterSlotFixture(id as "warrior" | "sorcerer" | "ranger", 42 + index),
  ),
);
test.beforeEach(async ({ page, request }) => {
  // Exercise the published production entry, never a source bundle injected by the test.
  const files: string[] = process.env.PLAYWRIGHT_BASE_URL
    ? Object.keys((await (await request.get("./release.json")).json()).files)
    : readdirSync("dist/assets").map((f) => `assets/${f}`);
  const entry = files.find((file) =>
    /^assets\/character-storage-[\w-]+\.js$/.test(file),
  );
  if (!entry) throw Error("Published character storage entry is missing");
  await page.goto("./?controller=1");
  await page.evaluate(async (path) => {
    window.characterStorageModule = await import(
      new URL(path, location.href).href
    );
  }, entry);
});
async function raw(
  page: Page,
  database: string,
  store: string,
  key: string,
  value: unknown,
) {
  await page.evaluate(
    async ({ database, store, key, value }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open(database, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(store);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(store, "readwrite");
          tx.objectStore(store).put(value, key);
          tx.oncomplete = () => resolve();
          tx.onabort = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    },
    { database, store, key, value },
  );
}

test("eight atomic slots isolate full snapshots, enumerate metadata only, and reject a ninth concurrent creation", async ({
  page,
}) => {
  const result = await page.evaluate(async (texts) => {
    const { CharacterStorage, deserializeCharacter, serializeCharacter } =
      window.characterStorageModule;
    let serial = 0;
    const store = new CharacterStorage({
      database: "m1-b-capacity",
      newId: () =>
        `10000000-0000-4000-8000-${(++serial).toString(16).padStart(12, "0")}`,
      now: () => 100,
    });
    try {
      const attempts = await Promise.allSettled(
        Array.from({ length: 10 }, (_, i) =>
          store.create("Same name", deserializeCharacter(texts[i % 3]!)),
        ),
      );
      const list = await store.list();
      const states = await Promise.all(
        list.characters.map(async (m) => {
          const r = await store.load(m.id);
          if (r.kind !== "valid") throw Error("Invalid slot");
          return serializeCharacter(r.session);
        }),
      );
      const read = IDBObjectStore.prototype.get;
      let listed;
      try {
        IDBObjectStore.prototype.get = function (key) {
          if (this.name !== "registry")
            throw Error("Menu attempted full archive read");
          return read.call(this, key);
        };
        listed = await store.list();
      } finally {
        IDBObjectStore.prototype.get = read;
      }
      const loaded = await store.load(list.characters[0]!.id);
      if (loaded.kind !== "valid") throw Error("Missing first character");
      loaded.session.exploration!.containers!.gold = 0;
      const unchanged = await store.load(list.characters[0]!.id);
      return {
        successes: attempts.filter((a) => a.status === "fulfilled").length,
        failures: attempts
          .filter((a) => a.status === "rejected")
          .map((a) => String(a.reason)),
        list,
        states,
        listed,
        recent: await store.recent(),
        detached:
          unchanged.kind === "valid" &&
          unchanged.session.exploration!.containers!.gold === 123,
      };
    } finally {
      store.close();
    }
  }, texts);
  expect(result.successes).toBe(8);
  expect(result.failures).toHaveLength(2);
  expect(result.failures.every((f) => f.includes("eight"))).toBe(true);
  expect(new Set(result.list.characters.map((m) => m.id)).size).toBe(8);
  expect(new Set(result.list.characters.map((m) => m.name)).size).toBe(1);
  expect(result.listed).toEqual(result.list);
  expect(result.recent).toBeNull();
  expect(result.detached).toBe(true);
  for (const state of result.states) expect(texts).toContain(state);
  expect(new Set(result.states).size).toBe(3);
});

test("switching, stale writers, deletion and browser reload preserve owners, global settings and last-played identity", async ({
  page,
}) => {
  const result = await page.evaluate(async (texts) => {
    const { CharacterStorage, deserializeCharacter, serializeCharacter } =
      window.characterStorageModule;
    const database = "m1-b-switch",
      a = new CharacterStorage({ database }),
      b = new CharacterStorage({ database });
    localStorage.setItem("m1-b-global-settings", "retained");
    try {
      const first = await a.create("Ash", deserializeCharacter(texts[0]!)),
        second = await a.create("Snow", deserializeCharacter(texts[1]!));
      await a.activate(first.id, first.revision);
      await b.activate(second.id, second.revision);
      const loaded = await a.load(first.id),
        other = await b.load(second.id);
      if (loaded.kind !== "valid" || other.kind !== "valid")
        throw Error("Missing characters");
      loaded.session.exploration!.containers!.gold = 77;
      const updated = await a.update(first.id, first.revision, loaded.session);
      let stale = "";
      try {
        await b.update(first.id, first.revision, loaded.session);
      } catch (e) {
        stale = String(e);
      }
      other.session.exploration!.containers!.gold = 88;
      await Promise.all([
        a.update(first.id, updated.revision, loaded.session),
        b.update(second.id, second.revision, other.session),
      ]);
      const recent = await a.recent();
      if (recent?.kind !== "valid") throw Error("No recent character");
      const before = serializeCharacter(
        (
          (await b.load(first.id)) as Extract<
            Awaited<ReturnType<typeof b.load>>,
            { kind: "valid" }
          >
        ).session,
      );
      await a.delete(second.id, recent.metadata.revision);
      const archived = await a.archive(`deleted:${second.id}`);
      const copy = new CharacterStorage({ database, newId: () => second.id });
      let reused = "";
      try {
        await copy.create("Different name", deserializeCharacter(texts[2]!));
      } catch (e) {
        reused = String(e);
      } finally {
        copy.close();
      }
      return {
        stale,
        reused,
        recentId: recent.metadata.id,
        secondId: second.id,
        recentAfter: await a.recent(),
        firstId: first.id,
        before,
        firstAfter: await a.load(first.id),
        archived,
        setting: localStorage.getItem("m1-b-global-settings"),
      };
    } finally {
      a.close();
      b.close();
    }
  }, texts);
  expect(result.stale).toContain("changed in another session");
  expect(result.reused).toContain("already used");
  expect(result.recentId).toBe(result.secondId);
  expect(result.recentAfter).toBeNull();
  expect(result.archived).toBeTruthy();
  expect(result.setting).toBe("retained");
  await page.reload();
  // Reload the exact production entry using the same discovery as beforeEach.
  const files: string[] = process.env.PLAYWRIGHT_BASE_URL
    ? Object.keys(
        (await (await page.request.get("./release.json")).json()).files,
      )
    : readdirSync("dist/assets").map((f) => `assets/${f}`);
  const entry = files.find((f) =>
    /^assets\/character-storage-[\w-]+\.js$/.test(f),
  )!;
  const after = await page.evaluate(
    async ({ entry, id }) => {
      const m = (await import(
        new URL(entry, location.href).href
      )) as typeof window.characterStorageModule;
      const s = new m.CharacterStorage({ database: "m1-b-switch" });
      try {
        const r = await s.load(id);
        return r.kind === "valid" ? m.serializeCharacter(r.session) : r.kind;
      } finally {
        s.close();
      }
    },
    { entry, id: result.firstId },
  );
  expect(after).toBe(result.before);
});

test("corrupt recent character requires explicit same-owner recovery and never falls back to another slot", async ({
  page,
}) => {
  const ids = await page.evaluate(async (text) => {
    const m = window.characterStorageModule,
      s = new m.CharacterStorage({ database: "m1-b-recovery" });
    try {
      const a = await s.create("Ash", m.deserializeCharacter(text)),
        b = await s.create("Snow", m.deserializeCharacter(text));
      const r = await s.load(a.id);
      if (r.kind !== "valid") throw Error("Invalid source");
      await s.update(a.id, 1, r.session);
      await s.activate(a.id, 2);
      return { a, b };
    } finally {
      s.close();
    }
  }, texts[0]!);
  await raw(page, "m1-b-recovery", "characters", ids.a.id, {
    id: ids.a.id,
    revision: 2,
    text: "damaged current",
  });
  const result = await page.evaluate(async ({ a, b }) => {
    const m = window.characterStorageModule,
      s = new m.CharacterStorage({ database: "m1-b-recovery" });
    try {
      const recent = await s.recent(),
        other = await s.load(b.id);
      let activation = "",
        overwrite = "";
      try {
        await s.activate(a.id, 2);
      } catch (e) {
        activation = String(e);
      }
      if (recent?.kind === "recoverable")
        try {
          await s.update(a.id, 2, recent.session);
        } catch (e) {
          overwrite = String(e);
        }
      const restored = await s.recover(a.id, 2);
      return {
        recent,
        otherKind: other.kind,
        activation,
        overwrite,
        restored,
        archived: await s.archive(`recovery:${a.id}:2`),
        selected: (await s.recent())?.metadata.id,
      };
    } finally {
      s.close();
    }
  }, ids);
  expect(result.recent?.kind).toBe("recoverable");
  expect(result.recent?.metadata.id).toBe(ids.a.id);
  expect(result.otherKind).toBe("valid");
  expect(result.activation).toContain("cannot be activated");
  expect(result.overwrite).toContain("recovery");
  expect(result.restored.kind).toBe("valid");
  expect(result.restored.metadata.revision).toBe(3);
  expect(result.selected).toBe(ids.a.id);
  expect(result.archived).toMatchObject({
    current: { text: "damaged current" },
  });
});

test("quota failures abort complete create/update/delete operations; invalid duplicate ownership never writes", async ({
  page,
}) => {
  const result = await page.evaluate(async (text) => {
    const m = window.characterStorageModule,
      s = new m.CharacterStorage({ database: "m1-b-atomic" });
    const put = IDBObjectStore.prototype.put;
    const fail = () => {
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === "registry")
          throw new DOMException(
            "Injected quota exhaustion",
            "QuotaExceededError",
          );
        return put.call(this, value, key);
      };
    };
    const messages: string[] = [];
    try {
      fail();
      try {
        await s.create("Ash", m.deserializeCharacter(text));
      } catch (e) {
        messages.push(String(e));
      } finally {
        IDBObjectStore.prototype.put = put;
      }
      const empty = await s.list();
      const a = await s.create("Ash", m.deserializeCharacter(text)),
        initial = await s.list();
      fail();
      try {
        await s.update(a.id, 1, m.deserializeCharacter(text));
      } catch (e) {
        messages.push(String(e));
      } finally {
        IDBObjectStore.prototype.put = put;
      }
      const afterUpdate = await s.list();
      fail();
      try {
        await s.delete(a.id, 1);
      } catch (e) {
        messages.push(String(e));
      } finally {
        IDBObjectStore.prototype.put = put;
      }
      const afterDelete = await s.list();
      const bad = m.deserializeCharacter(text);
      bad.exploration!.stash!.grid.items.push({
        item: bad.character.grid.items[0]!.item,
        x: 4,
        y: 0,
      });
      let ownership = "";
      try {
        await s.update(a.id, 1, bad);
      } catch (e) {
        ownership = String(e);
      }
      const restored = await s.load(a.id);
      const db = await new Promise<IDBDatabase>((resolve) => {
        const r = indexedDB.open("m1-b-atomic", 1);
        r.onsuccess = () => resolve(r.result);
      });
      let counts;
      try {
        counts = await new Promise<number[]>((resolve) => {
          const tx = db.transaction(["characters", "previous", "archives"]);
          const requests = ["characters", "previous", "archives"].map((n) =>
            tx.objectStore(n).count(),
          );
          tx.oncomplete = () => resolve(requests.map((r) => r.result));
        });
      } finally {
        db.close();
      }
      return {
        messages,
        empty,
        initial,
        afterUpdate,
        afterDelete,
        final: await s.list(),
        ownership,
        text:
          restored.kind === "valid"
            ? m.serializeCharacter(restored.session)
            : restored.kind,
        counts,
      };
    } finally {
      IDBObjectStore.prototype.put = put;
      s.close();
    }
  }, texts[0]!);
  expect(result.messages).toHaveLength(3);
  expect(result.messages.every((e) => e.includes("QuotaExceededError"))).toBe(
    true,
  );
  expect(result.empty.characters).toEqual([]);
  expect(result.afterUpdate).toEqual(result.initial);
  expect(result.afterDelete).toEqual(result.initial);
  expect(result.final).toEqual(result.initial);
  expect(result.counts).toEqual([1, 0, 1]);
  expect(result.ownership).toMatch(/Duplicate/);
  expect(result.text).toBe(texts[0]);
});

for (const schema of [1, 2, 3, 4, 5]) {
  test(`schema${schema} migration is idempotent, byte preserving and never resurrects a deleted slot`, async ({
    page,
  }) => {
    const text = schema === 5 ? texts[0]! : historicalCharacter(schema);
    const legacy = { revision: 6, text },
      quarantine = { revision: 3, text: "historical damaged sentinel" };
    await raw(page, "m1-b-legacy", "snapshots", "current", legacy);
    await raw(page, "m1-b-legacy", "snapshots", "previous", legacy);
    await raw(page, "m1-b-legacy", "snapshots", "quarantine", quarantine);
    const result = await page.evaluate(
      async ({ text }) => {
        const m = window.characterStorageModule,
          opts = { database: "m1-b-migration", legacyDatabase: "m1-b-legacy" },
          a = new m.CharacterStorage(opts),
          b = new m.CharacterStorage(opts);
        try {
          const attempts = await Promise.all([
            a.migrateLegacy(),
            b.migrateLegacy(),
          ]);
          const list = await a.list(),
            id = list.characters[0]!.id,
            loaded = await a.load(id),
            receipt = await a.archive("legacy-migration-v1");
          if (loaded.kind !== "valid") throw Error("Migrated snapshot invalid");
          const equality =
            m.serializeCharacter(loaded.session) ===
            m.serializeCharacter(m.deserializeCharacter(text));
          await a.update(id, 6, loaded.session);
          const afterUpdate = await a.list();
          await b.migrateLegacy();
          const retry = await a.list();
          await a.delete(id, 7);
          const deleted = await b.migrateLegacy();
          const db = await new Promise<IDBDatabase>((resolve) => {
            const r = indexedDB.open("m1-b-legacy", 1);
            r.onsuccess = () => resolve(r.result);
          });
          let original;
          try {
            original = await new Promise<unknown[]>((resolve) => {
              const tx = db.transaction("snapshots");
              const requests = ["current", "previous", "quarantine"].map((k) =>
                tx.objectStore("snapshots").get(k),
              );
              tx.oncomplete = () => resolve(requests.map((r) => r.result));
            });
          } finally {
            db.close();
          }
          return {
            attempts,
            list,
            equality,
            receipt,
            afterUpdate,
            retry,
            deleted,
            final: await a.list(),
            original,
          };
        } finally {
          a.close();
          b.close();
        }
      },
      { text },
    );
    expect(result.attempts.map((a) => a.kind).sort()).toEqual([
      "already-migrated",
      "migrated",
    ]);
    expect(result.list.characters).toHaveLength(1);
    expect(result.list.characters[0]!.revision).toBe(6);
    expect(result.equality).toBe(true);
    expect(result.receipt).toMatchObject({
      text,
      archive: { current: legacy, previous: legacy, quarantine },
    });
    expect(result.retry).toEqual(result.afterUpdate);
    expect(result.deleted).toMatchObject({
      kind: "already-migrated",
      deleted: true,
    });
    expect(result.final.characters).toEqual([]);
    expect(result.original).toEqual([legacy, legacy, quarantine]);
  });
}

test("migration corruption, unsupported versions, changed sources and quota failures preserve both histories", async ({
  page,
}) => {
  const valid = { revision: 1, text: texts[0]! };
  await raw(page, "m1-b-legacy", "snapshots", "current", {
    revision: 1,
    text: "corrupt",
  });
  await raw(page, "m1-b-legacy", "snapshots", "previous", valid);
  const first = await page.evaluate(async () => {
    const s = new window.characterStorageModule.CharacterStorage({
      database: "m1-b-migration",
      legacyDatabase: "m1-b-legacy",
    });
    try {
      let error = "";
      try {
        await s.migrateLegacy();
      } catch (e) {
        error = String(e);
      }
      return {
        error,
        list: await s.list(),
        receipt: await s.archive("legacy-migration-v1"),
      };
    } finally {
      s.close();
    }
  });
  expect(first.error).toContain("SyntaxError");
  expect(first.list.characters).toEqual([]);
  expect(first.receipt).toBeUndefined();
  const future = JSON.parse(texts[0]!);
  future.schema = 999;
  await raw(page, "m1-b-legacy", "snapshots", "current", {
    revision: 1,
    text: JSON.stringify(future),
  });
  const unsupported = await page.evaluate(async () => {
    const s = new window.characterStorageModule.CharacterStorage({
      database: "m1-b-migration",
      legacyDatabase: "m1-b-legacy",
    });
    try {
      try {
        await s.migrateLegacy();
        return "unexpected success";
      } catch (e) {
        return String(e);
      }
    } finally {
      s.close();
    }
  });
  expect(unsupported).toContain("Unsupported newer");
  await raw(page, "m1-b-legacy", "snapshots", "current", valid);
  const retried = await page.evaluate(async () => {
    const s = new window.characterStorageModule.CharacterStorage({
        database: "m1-b-migration",
        legacyDatabase: "m1-b-legacy",
      }),
      put = IDBObjectStore.prototype.put;
    try {
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === "registry")
          throw new DOMException("Quota", "QuotaExceededError");
        return put.call(this, value, key);
      };
      let error = "";
      try {
        await s.migrateLegacy();
      } catch (e) {
        error = String(e);
      } finally {
        IDBObjectStore.prototype.put = put;
      }
      const empty = await s.list(),
        receipt = await s.archive("legacy-migration-v1");
      const done = await s.migrateLegacy();
      return { error, empty, receipt, done, list: await s.list() };
    } finally {
      IDBObjectStore.prototype.put = put;
      s.close();
    }
  });
  expect(retried.error).toContain("QuotaExceededError");
  expect(retried.empty.characters).toEqual([]);
  expect(retried.receipt).toBeUndefined();
  expect(retried.done.kind).toBe("migrated");
  await raw(page, "m1-b-legacy", "snapshots", "current", {
    revision: 2,
    text: texts[1]!,
  });
  const changed = await page.evaluate(async () => {
    const s = new window.characterStorageModule.CharacterStorage({
      database: "m1-b-migration",
      legacyDatabase: "m1-b-legacy",
    });
    try {
      let error = "";
      try {
        await s.migrateLegacy();
      } catch (e) {
        error = String(e);
      }
      return { error, list: await s.list() };
    } finally {
      s.close();
    }
  });
  expect(changed.error).toContain("source changed");
  expect(changed.list).toEqual(retried.list);
});

test("existing developer arenas never read or write the new character registry", async ({
  page,
}) => {
  const initial = await page.evaluate(async (text) => {
    const m = window.characterStorageModule,
      s = new m.CharacterStorage();
    try {
      const meta = await s.create("Ash", m.deserializeCharacter(text));
      return { meta, list: await s.list() };
    } finally {
      s.close();
    }
  }, texts[0]!);
  await page.goto("./?inventory=1&training=1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-combat-ready",
    "true",
  );
  await page.locator("#inventory-open").click();
  await page.locator("#inventory-save").click();
  await expect(page.locator("#inventory-status")).toContainText(
    "saved locally",
  );
  const records = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("hollowbane-characters-v1", 1);
      r.onsuccess = () => resolve(r.result);
    });
    try {
      return await new Promise<{ registry: unknown; characters: unknown[] }>(
        (resolve) => {
          const tx = db.transaction(["registry", "characters"]),
            r = tx.objectStore("registry").get("current"),
            c = tx.objectStore("characters").getAll();
          tx.oncomplete = () =>
            resolve({ registry: r.result, characters: c.result });
        },
      );
    } finally {
      db.close();
    }
  });
  expect(records.registry).toEqual(initial.list);
  expect(records.characters).toEqual([
    { id: initial.meta.id, revision: 1, text: texts[0] },
  ]);
});

test("simultaneous same-owner writers admit one commit; a missing registry fails closed", async ({
  page,
}) => {
  const result = await page.evaluate(async (text) => {
    const m = window.characterStorageModule,
      options = { database: "m1-b-contention" },
      a = new m.CharacterStorage(options),
      b = new m.CharacterStorage(options);
    try {
      const metadata = await a.create("Ash", m.deserializeCharacter(text));
      const first = m.deserializeCharacter(text),
        second = m.deserializeCharacter(text);
      first.exploration!.containers!.gold = 11;
      second.exploration!.containers!.gold = 22;
      const attempts = await Promise.allSettled([
        a.update(metadata.id, 1, first),
        b.update(metadata.id, 1, second),
      ]);
      const selected = await a.load(metadata.id);
      const db = await new Promise<IDBDatabase>((resolve) => {
        const r = indexedDB.open(options.database, 1);
        r.onsuccess = () => resolve(r.result);
      });
      try {
        await new Promise<void>((resolve) => {
          const tx = db.transaction("registry", "readwrite");
          tx.objectStore("registry").delete("current");
          tx.oncomplete = () => resolve();
        });
      } finally {
        db.close();
      }
      const errors: string[] = [];
      for (const operation of [
        () => a.list(),
        () => a.create("Snow", first),
        () => a.delete(metadata.id, 2),
      ])
        try {
          await operation();
        } catch (e) {
          errors.push(String(e));
        }
      const inspect = await new Promise<IDBDatabase>((resolve) => {
        const r = indexedDB.open(options.database, 1);
        r.onsuccess = () => resolve(r.result);
      });
      let retained;
      try {
        retained = await new Promise<unknown>((resolve) => {
          const r = inspect
            .transaction("characters")
            .objectStore("characters")
            .get(metadata.id);
          r.onsuccess = () => resolve(r.result);
        });
      } finally {
        inspect.close();
      }
      return {
        kinds: attempts.map((r) => r.status),
        selected,
        errors,
        retained,
      };
    } finally {
      a.close();
      b.close();
    }
  }, texts[0]!);
  expect(result.kinds.sort()).toEqual(["fulfilled", "rejected"]);
  expect(result.selected.kind).toBe("valid");
  expect(result.selected.metadata.revision).toBe(2);
  if (result.selected.kind === "valid")
    expect([11, 22]).toContain(
      result.selected.session.exploration!.containers!.gold,
    );
  expect(result.errors).toHaveLength(3);
  expect(result.errors.every((e) => e.includes("registry is missing"))).toBe(
    true,
  );
  expect(result.retained).toMatchObject({ revision: 2 });
});
