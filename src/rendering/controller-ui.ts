import { installCalibration } from "./controller-calibration";
import { installControllerSettings } from "./controller-settings";
import { contextPrompt } from "../simulation/prompts";
import "./controller.css";
import "./controller-ui-surface.css";
import { controllerInput as hub } from "./controller-input";
import type { Action } from "../simulation/actions";
export function controllerPage(): void {
  const root = document.querySelector("main")!;
  root.className = "controller-page";
  root.innerHTML = `<header><p class="eyebrow">HOLLOWBANE / INPUT LABORATORY</p><h1>Controller settings</h1><p>Standard-compatible Xbox, PlayStation and generic controllers. Virtual tests do not verify physical hardware.</p></header><nav><a href="?cloister=1">Cloister</a><a href="?gallery=1">Art atelier</a><a href="?combat=1">Combat arena</a><a href="?engine=4">Phaser 4 observatory</a><a href="?engine=3">Phaser 3 observatory</a><a href="?monsters=1">Monster encounters</a><a href="?skills=1">Skill laboratory</a><a href="?polish=1">The Sable Court</a><a href="?loot=1">L1 world loot</a><a href="?inventory=1">L2 inventory & equipment</a><a href="?inventory=1&advanced=1">L3 advanced items</a><a href="?inventory=1&advanced=1&itemLab=1">L3 separate item laboratory</a></nav><section id="controller-settings-host"><p>Controller configuration is being prepared.</p></section><section><h2>Live controller state</h2><pre id="controller-live" aria-live="off">Waiting for browser polling…</pre></section><p id="controller-notice" role="status"></p>`;
  installControllerSettings();
  installCalibration();
  document.title = "Hollowbane · Controller laboratory";
  document.documentElement.dataset.controllerReady = "true";
}
export function installControllerUI(): void {
  const surface = document.querySelector<HTMLElement>(
    "main.prototype,main.combat-arena",
  );
  const host = surface ?? document.body;
  if (surface) installGameSurfaceLifecycle(surface);
  const widget = document.createElement("button");
  widget.id = "controller-open";
  widget.type = "button";
  widget.hidden = true;
  widget.textContent = "Controller menu · Menu / Options";
  host.append(widget);
  const menu = document.createElement("dialog");
  menu.id = "controller-menu";
  menu.setAttribute("aria-labelledby", "controller-menu-title");
  menu.innerHTML = `<h2 id="controller-menu-title">Paused · Controller menu</h2><p id="controller-context">Choose a screen or resume gameplay.</p><div class="controller-menu-list"><button id="controller-resume">Resume</button><a href="?controller=1">Controller settings & calibration</a><button id="controller-movement">Movement controls</button><a href="?cloister=1">Cloister</a><a href="?gallery=1">Art atelier</a><a href="?combat=1">Combat arena</a><a href="?engine=4">Phaser 4 observatory</a><a href="?engine=3">Phaser 3 observatory</a><a href="?monsters=1">Monster encounters</a><a href="?skills=1">Skill laboratory</a><a href="?polish=1">The Sable Court</a><a href="?loot=1">L1 world loot</a><a href="?inventory=1">L2 inventory & equipment</a><a href="?inventory=1&advanced=1">L3 advanced items</a><a href="?inventory=1&advanced=1&itemLab=1">L3 separate item laboratory</a></div><p id="controller-prompts">A / Cross: choose · B / Circle: back · D-pad: navigate</p>`;
  host.append(menu);
  const world = () =>
    document.querySelector<HTMLElement>("#world,#combat-world");
  const close = () => {
    if (menu.open) menu.close();
    hub.clear();
    hub.blockGameplay = false;
    world()?.focus();
  };
  const open = () => {
    if (menu.open) return;
    const existing = document.querySelector<HTMLDialogElement>("dialog[open]");
    existing?.close();
    hub.clear();
    hub.blockGameplay = true;
    menu.showModal();
  };
  widget.onclick = open;
  menu.querySelector<HTMLButtonElement>("#controller-resume")!.onclick = close;
  const journal = document.createElement("button");
  journal.id = "controller-journal";
  journal.textContent = "Quest journal";
  journal.hidden = true;
  menu.querySelector("#controller-resume")!.after(journal);
  journal.onclick = () => {
    close();
    window.dispatchEvent(new Event("hollowbane-journal-toggle"));
  };
  const waypoints = document.createElement("button");
  waypoints.id = "controller-waypoints";
  waypoints.textContent = "Waypoints";
  waypoints.hidden = true;
  journal.after(waypoints);
  waypoints.onclick = () => {
    close();
    window.dispatchEvent(new Event("hollowbane-waypoints-toggle"));
  };
  menu.querySelector<HTMLButtonElement>("#controller-movement")!.onclick =
    () => {
      close();
      const button =
        document.querySelector<HTMLButtonElement>("#movement-settings");
      if (button) button.click();
      else location.href = "./";
    };
  menu.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]")) world()?.focus();
  });
  menu.addEventListener("cancel", () => {
    hub.clear();
    hub.blockGameplay = false;
  });
  window.addEventListener("hollowbane-ui-dismiss", () => {
    hub.clear();
    hub.blockGameplay = false;
  });
  window.addEventListener("hollowbane-controller-menu", open);
  window.addEventListener("keydown", (e) => {
    if (e.code === "F2") {
      e.preventDefault();
      if (menu.open) close();
      else open();
    }
  });
  let lastDirection = "",
    repeatAt = 0,
    refreshedAt = 0;
  const elements = (): HTMLElement[] => {
    const scope = document.querySelector("dialog[open]") ?? document;
    return Array.from(
      scope.querySelectorAll<HTMLElement>(
        "button,a[href],input,select,summary,[data-controller-read]",
      ),
    ).filter(
      (e) =>
        !e.hidden &&
        !e.hasAttribute("disabled") &&
        e.getClientRects().length > 0,
    );
  };
  const adjust = (element: HTMLElement, sign: number): boolean => {
    if (element instanceof HTMLSelectElement) {
      element.selectedIndex =
        (element.selectedIndex + sign + element.options.length) %
        element.options.length;
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    if (element instanceof HTMLInputElement && element.type === "number") {
      try {
        if (sign > 0) element.stepUp();
        else element.stepDown();
        element.dispatchEvent(new Event("input", { bubbles: true }));
      } catch {
        /* Readonly/invalid native controls remain safe. */
      }
      return true;
    }
    if (
      element instanceof HTMLInputElement &&
      element.readOnly &&
      element.dataset.action
    ) {
      const codes = Array.from(
          { length: 26 },
          (_, i) => `Key${String.fromCharCode(65 + i)}`,
        ).concat([
          "Space",
          "Escape",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ]),
        i = codes.indexOf(element.value);
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: codes[(i + sign + codes.length) % codes.length]!,
          bubbles: true,
          cancelable: true,
        }),
      );
      return true;
    }
    return false;
  };
  const loop = (now: number) => {
    widget.hidden =
      hub.apiStatus === "waiting" &&
      hub.settings.profile === "auto" &&
      hub.settings.selected === null;
    const active = document.activeElement,
      gameFocus =
        Boolean(world()) && (active === world() || active === document.body);
    const modal = document.querySelector<HTMLDialogElement>("dialog[open]");
    hub.blockGameplay =
      Boolean(modal) ||
      (hub.frame.device === "gamepad" &&
        !gameFocus &&
        active !== null &&
        active !== widget);
    if (hub.take("pause") || hub.take("menu")) {
      if (menu.open) close();
      else open();
    }
    if (
      hub.take("map") &&
      (hub.frame.device !== "gamepad" ||
        window.dispatchEvent(
          new Event("hollowbane-map-toggle", { cancelable: true }),
        ))
    ) {
      if (
        window.dispatchEvent(
          new Event("hollowbane-inventory-toggle", { cancelable: true }),
        )
      )
        open();
      menu.querySelector("#controller-context")!.textContent =
        "Map and inventory are not implemented. These actions are reserved.";
    }
    if (hub.frame.device === "gamepad") {
      let direction: Action | null = null;
      for (const d of ["up", "down", "left", "right"] as const)
        if (hub.frame.actions[d].held) direction = d;
      if (!gameFocus || modal) {
        const v = hub.frame.move;
        if (Math.hypot(v.x, v.y) > 0.55)
          direction =
            Math.abs(v.x) > Math.abs(v.y)
              ? v.x > 0
                ? "right"
                : "left"
              : v.y > 0
                ? "down"
                : "up";
      }
      if (
        (modal || !gameFocus) &&
        direction &&
        (direction !== lastDirection || now >= repeatAt)
      ) {
        const list = elements(),
          sign = direction === "up" || direction === "left" ? -1 : 1,
          index = list.indexOf(document.activeElement as HTMLElement);
        const handled =
          modal?.id === "inventory-dialog" &&
          !modal.dispatchEvent(
            new CustomEvent("hollowbane-inventory-action", {
              detail: direction,
              cancelable: true,
            }),
          );
        if (
          !handled &&
          !(
            (direction === "left" || direction === "right") &&
            active instanceof HTMLElement &&
            adjust(active, sign)
          )
        )
          list[
            (index + sign + list.length) % Math.max(1, list.length)
          ]?.focus();
        repeatAt = now + (direction === lastDirection ? 150 : 400);
      }
      lastDirection = direction ?? "";
      if (modal?.id === "inventory-dialog") {
        for (const action of ["primary", "secondary"] as const)
          if (hub.take(action))
            modal.dispatchEvent(
              new CustomEvent("hollowbane-inventory-action", {
                detail: action,
                cancelable: true,
              }),
            );
      }
      if ((modal || !gameFocus) && hub.take("interact")) {
        void hub.vibrate();
        const target = document.activeElement;
        if (target instanceof HTMLElement) {
          if (target instanceof HTMLSelectElement) adjust(target, 1);
          else target.click();
        }
      }
      if ((modal || !gameFocus) && hub.take("cancel")) {
        if (modal) {
          if (
            modal.id === "inventory-dialog" &&
            !modal.dispatchEvent(
              new CustomEvent("hollowbane-inventory-action", {
                detail: "cancel",
                cancelable: true,
              }),
            )
          ) {
            lastDirection = "";
          } else modal.close();
          hub.clear();
          if (!modal.open) world()?.focus();
        } else if (world()) world()!.focus();
        else location.href = "./";
      }
    }
    if (now - refreshedAt > 100) {
      refreshedAt = now;
      journal.hidden = !document.querySelector("#quest-journal-open");
      waypoints.hidden = !document.querySelector("#world-waypoints-open");
      widget.textContent =
        hub.apiStatus === "blocked" || hub.apiStatus === "unavailable"
          ? "Controller access unavailable · Settings"
          : hub.apiStatus === "waiting"
            ? "Activate controller · press and release a face button · Settings"
            : hub.state.selected === null && hub.settings.selected !== null
              ? "Saved controller not visible · Settings"
              : !hub.supported
                ? "Controller detected · choose layout in Settings"
                : !hub.state.armed
                  ? "Release sticks and buttons to activate · Settings"
                  : hub.frame.device === "gamepad"
                    ? hub.supported
                      ? contextPrompt(
                          location.search.includes("combat") ||
                            location.search.includes("monsters")
                            ? "combat"
                            : "movement",
                          hub.family,
                          hub.settings.bindings,
                        )
                      : "Unknown layout · F2: choose mapping in controller settings"
                    : "Controller menu · F2";
      menu.querySelector("#controller-prompts")!.textContent =
        hub.frame.device === "gamepad"
          ? contextPrompt("menu", hub.family, hub.settings.bindings)
          : "Enter: Choose · Escape: Back · Tab: Navigate";
      const live = document.querySelector("#controller-live");
      if (live)
        live.textContent = JSON.stringify(window.hollowbaneInput, null, 2);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/** Page-owned UI: release listeners on navigation and remount on bfcache restore. */
function installGameSurfaceLifecycle(root: HTMLElement): void {
  let dispose = mountGameSurface(root);
  const show = (event: PageTransitionEvent) => {
    if (event.persisted) dispose = mountGameSurface(root);
  };
  const hide = (event: PageTransitionEvent) => {
    dispose();
    if (!event.persisted) {
      window.removeEventListener("pageshow", show);
      window.removeEventListener("pagehide", hide);
    }
  };
  window.addEventListener("pageshow", show);
  window.addEventListener("pagehide", hide);
}

function mountGameSurface(root: HTMLElement): () => void {
  const listeners = new AbortController();
  const controls = document.createElement("div");
  controls.className = "game-surface-controls";
  controls.innerHTML = `<p id="fullscreen-status" role="status"></p><button id="game-fullscreen" type="button" aria-label="Enter fullscreen" aria-pressed="false"><svg data-fullscreen-icon="enter" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10V4h6m4 0h6v6m0 4v6h-6m-4 0H4v-6"/></svg><svg data-fullscreen-icon="exit" viewBox="0 0 24 24" aria-hidden="true" hidden><path d="M3 21l7-7m-6 0h6v6M21 3l-7 7m0-6v6h6"/></svg></button>`;
  root.classList.add("game-surface");
  root.append(controls);
  const button = controls.querySelector<HTMLButtonElement>("button")!;
  const status = controls.querySelector<HTMLElement>("[role=status]")!;
  let pending = false;
  let wasFullscreen = document.fullscreenElement === root;
  const supported = () =>
    Boolean(
      document.fullscreenEnabled &&
      typeof root.requestFullscreen === "function" &&
      typeof document.exitFullscreen === "function",
    );
  const sync = () => {
    const active = document.fullscreenElement === root;
    const label = active ? "Exit fullscreen" : "Enter fullscreen";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(active));
    button.title = supported()
      ? label
      : "Fullscreen is unavailable in this browser";
    button.disabled = pending || !supported();
    controls
      .querySelector<SVGElement>('[data-fullscreen-icon="enter"]')!
      .toggleAttribute("hidden", active);
    controls
      .querySelector<SVGElement>('[data-fullscreen-icon="exit"]')!
      .toggleAttribute("hidden", !active);
  };
  const failed = () => {
    if (!listeners.signal.aborted) {
      status.textContent =
        "Fullscreen could not be changed. Try your browser’s fullscreen control.";
      sync();
    }
  };
  const changed = () => {
    const active = document.fullscreenElement === root;
    sync();
    if (active || wasFullscreen) {
      status.textContent = "";
      // Reuse each renderer's existing resolution/camera/HUD resize path.
      window.dispatchEvent(new Event("resize"));
      if (!document.querySelector("dialog[open]"))
        root
          .querySelector<HTMLElement>("#world,#combat-world")
          ?.focus({ preventScroll: true });
    }
    wasFullscreen = active;
  };
  button.addEventListener(
    "click",
    async () => {
      if (pending || !supported()) return;
      pending = true;
      status.textContent = "";
      sync();
      try {
        // Invoke the API in the click handler, before any asynchronous work.
        if (document.fullscreenElement === root)
          await document.exitFullscreen();
        else await root.requestFullscreen();
      } catch {
        failed();
      } finally {
        pending = false;
        if (!listeners.signal.aborted) sync();
      }
    },
    { signal: listeners.signal },
  );
  // Native browsers normally consume Escape themselves. Also handle browsers
  // that deliver it to the page, without consuming existing cancel mappings.
  window.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        document.fullscreenElement === root &&
        !document.querySelector("dialog[open]")
      )
        void document.exitFullscreen().catch(failed);
    },
    { signal: listeners.signal },
  );
  document.addEventListener("fullscreenchange", changed, {
    signal: listeners.signal,
  });
  document.addEventListener("fullscreenerror", failed, {
    signal: listeners.signal,
  });
  // Capture includes sibling loot labels/overlays even when they stop bubbling.
  // Only cancel the browser menu; pointer, click and targeting events still flow.
  root.addEventListener("contextmenu", (event) => event.preventDefault(), {
    capture: true,
    signal: listeners.signal,
  });
  sync();
  return () => {
    listeners.abort();
    controls.remove();
    root.classList.remove("game-surface");
    if (document.fullscreenElement === root)
      void document.exitFullscreen().catch(() => {});
  };
}
