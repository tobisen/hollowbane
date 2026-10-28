/* global window, document, performance, requestAnimationFrame, sessionStorage, localStorage, location */
import { chromium } from "@playwright/test";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";

const [base, fixturePath, output] = process.argv.slice(2);
if (!base || !fixturePath || !output)
  throw Error("Pass URL, validated camp fixture and output folder");
const text = await readFile(fixturePath, "utf8"),
  snapshot = JSON.parse(text);
const guard = snapshot.body.character.grid.items.find(
  (p) => p.item.base === "bark-guard",
);
if (
  !guard ||
  snapshot.body.character.equipment.off ||
  snapshot.body.character.equipment.main?.base !== "ash-blade"
)
  throw Error(
    "Use the verified blade/empty-offhand fixture with its real shield in the grid",
  );
const files = (await readdir("dist/assets")).filter((f) =>
  /^character-storage-[\w-]+\.js$/.test(f),
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: false,
  args: ["--use-angle=metal"],
});
const results = [];
try {
  for (let repeat = 0; repeat < 3; repeat++)
    for (const mode of repeat % 2
      ? ["legacy", "warrior"]
      : ["warrior", "legacy"]) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await page.goto(base);
      await page.waitForSelector("html[data-menu-ready=true]");
      const id = await page.evaluate(
        async ({ files, text, mode }) => {
          for (const file of files) {
            const api = await import(
              new URL("assets/" + file, location.href).href
            );
            if (typeof api.CharacterStorage !== "function") continue;
            const store = new api.CharacterStorage();
            try {
              sessionStorage.setItem(
                "hollowbane-warrior-legacy",
                mode === "legacy" ? "1" : "0",
              );
              localStorage.setItem(
                "hollowbane.presentation.v1",
                JSON.stringify({
                  version: 1,
                  quality: "full",
                  volume: 1,
                  muted: true,
                }),
              );
              return (
                await store.create(
                  "Equipment Switch",
                  api.deserializeCharacter(text),
                )
              ).id;
            } finally {
              store.close();
            }
          }
          throw Error("Missing character API");
        },
        { files, text, mode },
      );
      await page.goto(`${base}?world=1&character=${id}`);
      await page.waitForFunction(
        (mode) => window.hollowbaneWarriorProduction?.mode === mode,
        mode,
      );
      const renderer = await page.evaluate(() => {
        const canvas = document.querySelector("#combat-world canvas"),
          gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
        return gl.getParameter(
          gl.getExtension("WEBGL_debug_renderer_info").UNMASKED_RENDERER_WEBGL,
        );
      });
      if (!/Metal Renderer: Apple M4/.test(renderer))
        throw Error("Expected native M4/Metal");
      await page.locator("#inventory-open").click();
      const arm = async (button) =>
        page.evaluate((button) => {
          window.equipmentSwitch = { start: null, frames: [], active: true };
          document
            .querySelector(button)
            .addEventListener(
              "click",
              () => (window.equipmentSwitch.start = performance.now()),
              { capture: true, once: true },
            );
          let previous = null;
          const sample = (now) => {
            const s = window.equipmentSwitch;
            if (!s.active) return;
            if (s.start !== null && previous !== null)
              s.frames.push({
                ms: now - previous,
                mode: window.hollowbaneWarriorProduction.mode,
                textures: window.hollowbaneWarriorProduction.textures,
              });
            previous = now;
            requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        }, button);
      const finish = async (equipped) => {
        await page.waitForFunction(
          ({ mode, equipped, guardId }) => {
            const v = window.hollowbaneWarriorProduction;
            const item = document.querySelector(
              '#inventory-gear [data-slot="off"]',
            ).dataset.item;
            if (
              !v ||
              v.mode !== mode ||
              v.textures !== (mode === "legacy" ? 0 : equipped ? 42 : 40) ||
              v.equipment.visible !== (mode === "warrior" && equipped) ||
              (equipped ? item !== guardId : !!item)
            )
              return null;
            const s = window.equipmentSwitch;
            s.elapsed = performance.now() - s.start;
            return true;
          },
          { mode, equipped, guardId: guard.item.id },
        );
        // Include the first completed presentation intervals after readiness.
        return page.evaluate(async (equipped) => {
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
          const s = window.equipmentSwitch,
            v = window.hollowbaneWarriorProduction;
          s.active = false;
          return {
            elapsed: s.elapsed,
            frames: s.frames,
            loaderMs: equipped ? v.equipmentLoadMs : 0,
            textures: v.textures,
            decodedBytes: v.decodedBytes,
          };
        }, equipped);
      };
      await page
        .locator(`#inventory-grid button[data-item="${guard.item.id}"]`)
        .first()
        .click();
      await arm("#inventory-equip");
      await page.locator("#inventory-equip").click();
      const equipped = await finish(true);
      await page.locator('#inventory-gear [data-slot="off"]').click();
      await arm("#inventory-take");
      await page.locator("#inventory-take").click();
      await page.locator('[data-focus="cell-5-0"]').click();
      const unequipped = await finish(false);
      if (errors.length) throw Error(errors.join("\n"));
      results.push({ repeat, mode, renderer, equipped, unequipped, errors });
      console.log(
        JSON.stringify({
          repeat,
          mode,
          equipMs: equipped.elapsed,
          loaderMs: equipped.loaderMs,
          unequipMs: unequipped.elapsed,
          equipLongest: Math.max(0, ...equipped.frames.map((f) => f.ms)),
          unequipLongest: Math.max(0, ...unequipped.frames.map((f) => f.ms)),
        }),
      );
      await context.close();
    }
  await writeFile(
    `${output}/summary.json`,
    JSON.stringify(
      {
        resolution: [1280, 800],
        dpr: 1,
        profile: "full",
        results,
        limits: [
          "Actual browser mouse transactions; not physical input latency",
          "Click-to-ready includes inventory redraw and driver observation overhead",
          "HTTP cache disabled; OS/GPU cache not reset",
          "Texture counts and calculated RGBA are not measured GPU residency",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
