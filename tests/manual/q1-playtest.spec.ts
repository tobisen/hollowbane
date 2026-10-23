import { test, expect, chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access, mkdtemp } from "node:fs/promises";
import { resolve, join, basename } from "node:path";
import { tmpdir } from "node:os";
import { deserializeCharacter } from "../../src/simulation/inventory-save";
import { readWorldCheckpoint } from "../e2e/world-checkpoint";

const hashes = {
  warrior: "307f1affe22dba1f062a07c132405c02ba743f29effdf6bab48c06cd463c78c4",
  sorcerer: "8412c5e68e2d52874e00d2632e6d859d1b3430816635feb69c0e5fb9a4680ace",
  ranger: "fd900eedf30c97c317c94758f40f62210a77bf224034a63fbde40148b3b71f10",
} as const;

test("local manual Q1 launcher — imports earned saves, never plays the campaign", async () => {
  if (process.env.CI) throw Error("Manual launcher is local-only");
  const classId = process.env.Q1_CLASS ?? "sorcerer";
  if (!(classId in hashes))
    throw Error("Q1_CLASS must be warrior, sorcerer or ranger");
  const id = classId as keyof typeof hashes;
  const verify = process.env.Q1_MANUAL_VERIFY === "1";
  test.setTimeout(verify ? 60_000 : 0);
  const source = join(
    process.env.Q1_SAVE_DIR ?? "/private/tmp/hollowbane-q1-sevra",
    `${id}-continuation.save`,
  );
  const bytes = await readFile(source);
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(hashes[id]);
  const original = deserializeCharacter(bytes.toString("utf8"));
  expect(original.progression!.skills.classId).toBe(id);
  const home =
    verify && !process.env.Q1_PROFILE_DIR
      ? await mkdtemp(join(tmpdir(), `hollowbane-q1-verify-${id}-`))
      : resolve(process.env.Q1_PROFILE_DIR ?? `.local/q1-manual/${id}`);
  await mkdir(home, { recursive: true });
  const marker = join(home, "imported.json");
  const imported = await access(marker).then(
    () => true,
    () => false,
  );
  const profile = join(home, "browser");
  if (
    !imported &&
    (await access(profile).then(
      () => true,
      () => false,
    ))
  )
    throw Error(
      `Unmarked profile retained at ${home}; use a NEW Q1_PROFILE_DIR to import safely`,
    );
  const context = await chromium.launchPersistentContext(profile, {
    headless: verify,
    viewport: { width: 1280, height: 800 },
    acceptDownloads: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  try {
    const page = context.pages()[0] ?? (await context.newPage());
    page.on("download", (download) => {
      void mkdtemp(join(home, "export-"))
        .then((directory) =>
          download.saveAs(
            join(directory, basename(download.suggestedFilename())),
          ),
        )
        .catch((error) => console.error(String(error)));
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      "http://127.0.0.1:4174/hollowbane/?world=1&developer=1&worldSeed=42",
    );
    await expect(page.locator("#inventory-status")).not.toHaveText(
      "Preparing local character storage…",
    );
    await expect(page.locator("#inventory-open")).toBeEnabled();
    await page.locator("#inventory-open").click();
    if (!imported) {
      await page.locator("#inventory-import").setInputFiles({
        name: `${id}-q1.json`,
        mimeType: "application/json",
        buffer: bytes,
      });
      await expect(page.locator(".skill-identity")).toContainText(
        `Committed: ${id}`,
      );
      await expect
        .poll(() => page.evaluate(() => window.hollowbaneWorld?.area))
        .toBe(original.exploration!.area);
      await page.locator("#inventory-save").click();
      await expect(page.locator("#inventory-status")).toHaveText(
        "Character checkpoint saved locally.",
      );
      const saved = await readWorldCheckpoint(page, "ashen-refuge");
      expect(saved.character).toEqual(original.character);
      expect(saved.progression).toEqual(original.progression);
      for (const key of [
        "quests",
        "containers",
        "stash",
        "waypoints",
        "seed",
        "contentVersion",
        "area",
        "position",
      ] as const)
        expect(saved.exploration![key]).toEqual(original.exploration![key]);
      expect(
        saved.exploration!.areas.map((a) => [
          a.id,
          a.seed,
          a.layoutFingerprint,
          a.deaths,
          a.drops,
        ]),
      ).toEqual(
        original.exploration!.areas.map((a) => [
          a.id,
          a.seed,
          a.layoutFingerprint,
          a.deaths,
          a.drops,
        ]),
      );
      await writeFile(
        marker,
        JSON.stringify({ classId: id, source, sha256: hashes[id] }, null, 2),
        { flag: "wx" },
      );
    } else {
      const metadata: unknown = JSON.parse(await readFile(marker, "utf8"));
      expect(metadata).toMatchObject({ classId: id, sha256: hashes[id] });
      await expect(page.locator(".skill-identity")).toContainText(
        `Committed: ${id}`,
      );
    }
    const capture = async () => {
      if (page.isClosed()) return;
      const current = await readWorldCheckpoint(page, "ashen-refuge");
      const diagnostic = await page.evaluate(() => ({
        world: window.hollowbaneWorld,
        combat: window.hollowbaneCombat,
        skills: window.hollowbaneSkills,
        boss: window.hollowbaneBoss,
        input: window.hollowbaneInput,
        waypointCondition: document.querySelector("#waypoint-condition")
          ?.textContent,
        inventoryStatus:
          document.querySelector("#inventory-status")?.textContent,
      }));
      await writeFile(
        join(home, "diagnostics.json"),
        JSON.stringify({ source, errors, diagnostic }, null, 2),
      );
      // This is the already saved checkpoint; never mutates gameplay or original input.
      const { serializeCharacter } =
        await import("../../src/simulation/inventory-save");
      await writeFile(
        join(home, "latest-checkpoint.json"),
        serializeCharacter(current),
      );
      await page.screenshot({ path: join(home, "latest-screen.png") });
    };
    await capture();
    console.log(
      `Q1 ${id}: ${imported ? "existing manual progress resumed" : "unchanged earned save imported"}. Profile/diagnostics: ${home}`,
    );
    if (verify) return;
    console.log(
      "Inventory stays open until you are ready. Play normally; Save now/Export snapshot retain progress. Press Enter in this terminal for read-only diagnostics; close the browser to finish.",
    );
    const onInput = () => {
      void capture().catch((error) => console.error(String(error)));
    };
    process.stdin.resume();
    process.stdin.on("data", onInput);
    try {
      await context.waitForEvent("close", { timeout: 0 });
    } finally {
      process.stdin.off("data", onInput);
      process.stdin.pause();
    }
  } finally {
    await context.close();
  }
});
