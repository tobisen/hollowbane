import { InventoryStorage, type StorageLoad } from "./inventory-storage";
import { controllerInput as hub } from "./controller-input";
import { installControllerSettings } from "./controller-settings";
import { CHARACTER_CLASSES } from "../simulation/character-classes";
import "./main-menu.css";

/** Read-only legacy entry point. Slot creation/migration follows at M1-B. */
export async function startMainMenu(): Promise<void> {
  const root = document.querySelector<HTMLElement>("main")!;
  root.className = "main-menu";
  root.innerHTML = `<section class="menu-panel" aria-labelledby="menu-title"><p class="eyebrow">BEYOND THE LAST WATCHFIRE</p><h1 id="menu-title">HOLLOWBANE</h1><p class="menu-subtitle">The light endures. So must you.</p><nav aria-label="Main menu"><button id="menu-continue" disabled>Continue Game</button><button id="menu-new" hidden>New Game</button><button id="menu-load" hidden>Load Character</button><button id="menu-settings">Settings</button><button id="menu-recovery" hidden>Review save recovery</button><button id="menu-retry" hidden>Retry storage</button></nav><p id="menu-status" role="status" aria-live="polite">Checking your saved adventure…</p><p class="menu-controls">Arrow keys / D-pad: navigate · Enter / A / Cross: select</p></section><footer class="menu-footer">An original dark fantasy adventure <span>ASHEN REFUGE AWAITS</span></footer><dialog id="menu-character" aria-labelledby="menu-character-title"><h2 id="menu-character-title">Your saved adventure</h2><p id="menu-character-detail"></p><button id="menu-play">Play Character</button><button data-menu-back>Back</button></dialog><dialog id="menu-settings-dialog" aria-labelledby="menu-settings-title"><h2 id="menu-settings-title">Settings</h2><button data-menu-back>Back to Main Menu</button><section id="controller-settings-host"></section></dialog>`;
  document.title = "Hollowbane · Main Menu";
  const button = (id: string) =>
    root.querySelector<HTMLButtonElement>(`#${id}`)!;
  const status = root.querySelector<HTMLElement>("#menu-status")!;
  const selection = root.querySelector<HTMLDialogElement>("#menu-character")!;
  const settings = root.querySelector<HTMLDialogElement>(
    "#menu-settings-dialog",
  )!;
  let checkpoint: StorageLoad | null = null;
  let busy = false;
  let disposed = false;
  let returnFocus: HTMLElement | null = null;
  const controls = (): HTMLElement[] =>
    Array.from(
      (
        root.querySelector("dialog[open]") ?? root
      ).querySelectorAll<HTMLElement>("button,input,select,a[href]"),
    ).filter(
      (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0,
    );
  const show = (dialog: HTMLDialogElement) => {
    returnFocus = document.activeElement as HTMLElement;
    hub.clear();
    dialog.showModal();
    controls()[0]?.focus();
  };
  const back = () => {
    const dialog = root.querySelector<HTMLDialogElement>("dialog[open]");
    if (!dialog) return;
    dialog.close();
  };
  for (const dialog of [selection, settings]) {
    dialog.addEventListener("close", () => {
      hub.clear();
      returnFocus?.focus();
    });
    dialog.querySelector<HTMLButtonElement>("[data-menu-back]")!.onclick = back;
  }
  let settingsInstalled = false;
  button("menu-settings").onclick = () => {
    if (!settingsInstalled) {
      installControllerSettings();
      settingsInstalled = true;
    }
    show(settings);
  };
  const inspect = async () => {
    if (busy) return;
    busy = true;
    checkpoint = null;
    root.setAttribute("aria-busy", "true");
    for (const id of ["continue", "new", "load", "recovery", "retry"]) {
      button(`menu-${id}`).disabled = true;
      if (id !== "continue") button(`menu-${id}`).hidden = true;
    }
    status.textContent = "Checking your saved adventure…";
    const storage = new InventoryStorage();
    try {
      const loaded = await storage.load();
      if (disposed) return;
      checkpoint = loaded;
      if (loaded.kind === "valid") {
        button("menu-continue").disabled = false;
        button("menu-load").hidden = false;
        button("menu-load").disabled = false;
        const classId = loaded.session.progression?.skills.classId;
        const name =
          CHARACTER_CLASSES.find((entry) => entry.id === classId)?.name ??
          "Adventurer";
        const detail = `${name} · Level ${loaded.session.character.level}`;
        root.querySelector("#menu-character-detail")!.textContent = detail;
        status.textContent = `${detail} · Your saved adventure is ready.`;
      } else if (loaded.kind === "empty") {
        button("menu-new").hidden = false;
        button("menu-new").disabled = false;
        status.textContent = "Begin your journey in Ashen Refuge.";
      } else {
        button("menu-recovery").hidden = false;
        button("menu-recovery").disabled = false;
        status.textContent =
          "Your current save could not be validated. It has been retained. Review recovery before continuing; no backup has been substituted.";
      }
    } catch {
      if (disposed) return;
      button("menu-retry").hidden = false;
      button("menu-retry").disabled = false;
      status.textContent =
        "Character storage is unavailable or blocked. No save was changed. Close other game tabs and retry.";
    } finally {
      storage.close();
      busy = false;
      root.setAttribute("aria-busy", "false");
    }
  };
  const enter = (url: string) => {
    if (busy) return;
    busy = true;
    status.textContent = "Opening your adventure…";
    for (const control of Array.from(
      root.querySelectorAll<HTMLButtonElement>("button"),
    ))
      control.disabled = true;
    hub.clear();
    location.assign(url);
  };
  const play = () => {
    if (checkpoint?.kind === "valid")
      enter(
        checkpoint.session.exploration ? "?world=1" : "?inventory=1&advanced=1",
      );
  };
  button("menu-continue").onclick = play;
  button("menu-play").onclick = play;
  button("menu-new").onclick = () => {
    if (checkpoint?.kind === "empty") enter("?world=1");
  };
  button("menu-load").onclick = () => show(selection);
  button("menu-recovery").onclick = () =>
    enter(
      checkpoint?.kind === "recoverable" && !checkpoint.session.exploration
        ? "?inventory=1&advanced=1"
        : "?world=1",
    );
  button("menu-retry").onclick = () => void inspect();
  const abort = new AbortController();
  root.addEventListener(
    "keydown",
    (event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const list = controls();
      const index = list.indexOf(document.activeElement as HTMLElement);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? list.length - 1
            : (index + (event.key === "ArrowUp" ? -1 : 1) + list.length) %
              list.length;
      list[next]?.focus();
    },
    { signal: abort.signal },
  );
  let frame = 0;
  let repeatAt = 0;
  let previous = "";
  const loop = (now: number) => {
    if (disposed) return;
    hub.blockGameplay = true;
    root.dataset.menuPad = String(hub.frame.device === "gamepad");
    if (hub.frame.device === "gamepad") {
      for (const [action, sign] of [
        ["left", -1],
        ["right", 1],
      ] as const) {
        if (!hub.take(action)) continue;
        const active = document.activeElement;
        if (active instanceof HTMLSelectElement && active.options.length) {
          active.selectedIndex =
            (active.selectedIndex + sign + active.options.length) %
            active.options.length;
          active.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (
          active instanceof HTMLInputElement &&
          active.type === "number"
        ) {
          if (sign > 0) active.stepUp();
          else active.stepDown();
          active.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      const direction =
        hub.frame.actions.down.held || hub.frame.move.y > 0.55
          ? "down"
          : hub.frame.actions.up.held || hub.frame.move.y < -0.55
            ? "up"
            : "";
      if (direction && (direction !== previous || now >= repeatAt)) {
        const list = controls();
        const index = list.indexOf(document.activeElement as HTMLElement);
        list[
          (index + (direction === "down" ? 1 : -1) + list.length) % list.length
        ]?.focus();
        repeatAt = now + (direction === previous ? 150 : 400);
      }
      previous = direction;
      if (hub.take("interact"))
        (document.activeElement as HTMLElement | null)?.click();
      if (hub.take("cancel") || hub.take("pause") || hub.take("menu")) back();
    }
    frame = requestAnimationFrame(loop);
  };
  window.addEventListener(
    "pagehide",
    () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      hub.clear();
    },
    { once: true },
  );
  // Reinspect after bfcache restoration; no cached validity authorizes a write.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) location.reload();
  });
  frame = requestAnimationFrame(loop);
  await inspect();
  controls()[0]?.focus();
  document.documentElement.dataset.menuReady = "true";
}
