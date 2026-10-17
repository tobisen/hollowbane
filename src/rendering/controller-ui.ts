import { installCalibration } from "./controller-calibration";
import { installControllerSettings } from "./controller-settings";
import { contextPrompt } from "../simulation/prompts";
import "./controller.css";
import { controllerInput as hub } from "./controller-input";
import type { Action } from "../simulation/actions";
export function controllerPage(): void {
  const root = document.querySelector("main")!;
  root.className = "controller-page";
  root.innerHTML = `<header><p class="eyebrow">HOLLOWBANE / INPUT LABORATORY</p><h1>Controller settings</h1><p>Standard-compatible Xbox, PlayStation and generic controllers. Virtual tests do not verify physical hardware.</p></header><nav><a href="./">Cloister</a><a href="?gallery=1">Art atelier</a><a href="?combat=1">Combat arena</a><a href="?engine=4">Phaser 4 observatory</a><a href="?engine=3">Phaser 3 observatory</a><a href="?monsters=1">Monster encounters</a></nav><section id="controller-settings-host"><p>Controller configuration is being prepared.</p></section><section><h2>Live controller state</h2><pre id="controller-live" aria-live="off">Waiting for browser polling…</pre></section><p id="controller-notice" role="status"></p>`;
  installControllerSettings();
  installCalibration();
  document.title = "Hollowbane · Controller laboratory";
  document.documentElement.dataset.controllerReady = "true";
}
export function installControllerUI(): void {
  const widget = document.createElement("button");
  widget.id = "controller-open";
  widget.type = "button";
  widget.hidden = true;
  widget.textContent = "Controller menu · Menu / Options";
  document.body.append(widget);
  const menu = document.createElement("dialog");
  menu.id = "controller-menu";
  menu.setAttribute("aria-labelledby", "controller-menu-title");
  menu.innerHTML = `<h2 id="controller-menu-title">Paused · Controller menu</h2><p id="controller-context">Choose a screen or resume gameplay.</p><div class="controller-menu-list"><button id="controller-resume">Resume</button><a href="?controller=1">Controller settings & calibration</a><button id="controller-movement">Movement controls</button><a href="./">Cloister</a><a href="?gallery=1">Art atelier</a><a href="?combat=1">Combat arena</a><a href="?engine=4">Phaser 4 observatory</a><a href="?engine=3">Phaser 3 observatory</a><a href="?monsters=1">Monster encounters</a></div><p id="controller-prompts">A / Cross: choose · B / Circle: back · D-pad: navigate</p>`;
  document.body.append(menu);
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
        "button,a[href],input,select,summary",
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
    widget.hidden = hub.pads.length === 0;
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
    if (hub.take("map")) {
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
      if (direction && (direction !== lastDirection || now >= repeatAt)) {
        const list = elements(),
          sign = direction === "up" || direction === "left" ? -1 : 1,
          index = list.indexOf(document.activeElement as HTMLElement);
        if (!(
          (direction === "left" || direction === "right") &&
          active instanceof HTMLElement &&
          adjust(active, sign)
        ))
          list[
            (index + sign + list.length) % Math.max(1, list.length)
          ]?.focus();
        repeatAt = now + (direction === lastDirection ? 150 : 400);
      }
      lastDirection = direction ?? "";
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
          modal.close();
          hub.clear();
          world()?.focus();
        } else if (world()) world()!.focus();
        else location.href = "./";
      }
    }
    if (now - refreshedAt > 100) {
      refreshedAt = now;
      widget.textContent =
        hub.frame.device === "gamepad"
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
