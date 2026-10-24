import { InventoryStorage, type StorageLoad } from "./inventory-storage";
import {
  CharacterStorage,
  type CharacterLoad,
  type CharacterMetadata,
  type CharacterRegistry,
} from "./character-storage";
import {
  characterName,
  CHARACTER_CAPACITY,
} from "../simulation/character-registry";
import { newCharacter } from "../simulation/new-character";
import { controllerInput as hub } from "./controller-input";
import { installControllerSettings } from "./controller-settings";
import {
  CHARACTER_CLASSES,
  type ClassId,
} from "../simulation/character-classes";
import "./main-menu.css";

const CLASS_GUIDES: Record<ClassId, { strength: string; weakness: string }> = {
  warrior: {
    strength: "Strength and vitality support close combat and sturdy defenses.",
    weakness: "Limited energy; plan your approach to distant enemies.",
  },
  sorcerer: {
    strength:
      "High energy supports elemental techniques and a larger mana reserve.",
    weakness: "Lower vitality and strength demand careful spacing.",
  },
  ranger: {
    strength:
      "High dexterity supports precision, defense and wilderness techniques.",
    weakness: "Limited energy; positioning matters when surrounded.",
  },
};
const className = (id: ClassId | null) =>
  CHARACTER_CLASSES.find((entry) => entry.id === id)?.name ?? "Adventurer";

const portraitPath = (id: ClassId, thumbnail = false) =>
  `${import.meta.env.BASE_URL}assets/menu-${id}${thumbnail ? "-thumb" : ""}-v1.webp`;

export async function startMainMenu(entryError?: string): Promise<void> {
  const root = document.querySelector<HTMLElement>("main")!;
  root.className = "main-menu";
  root.innerHTML = `<section class="menu-panel" aria-labelledby="menu-title"><p class="eyebrow">BEYOND THE LAST WATCHFIRE</p><h1 id="menu-title">HOLLOWBANE</h1><p class="menu-subtitle">The light endures. So must you.</p><nav aria-label="Main menu"><button id="menu-continue" disabled>Continue Game</button><button id="menu-new" hidden>New Game</button><button id="menu-load" hidden>Load Character</button><button id="menu-settings">Settings</button><button id="menu-recovery" hidden>Review save recovery</button><button id="menu-retry" hidden>Retry storage</button></nav><p id="menu-status" role="status" aria-live="polite">Checking your saved adventure…</p><p class="menu-controls">Arrow keys / D-pad: navigate · Enter / A / Cross: select · Escape / B / Circle: back</p></section><footer class="menu-footer">An original dark fantasy adventure <span>ASHEN REFUGE AWAITS</span></footer>
  <dialog id="menu-character" aria-labelledby="menu-character-title"><p class="eyebrow">EIGHT JOURNEYS · ONE REFUGE</p><h2 id="menu-character-title">Choose your character</h2><div id="menu-slots" class="menu-slots"></div><p id="menu-character-detail"></p><p data-menu-message role="status"></p><div class="menu-actions"><button id="menu-play" disabled>Play Character</button><button id="menu-create">Create New</button><button id="menu-import" hidden>Import legacy adventure</button><button id="menu-delete" disabled>Delete Character</button><button id="menu-slot-recover" hidden>Recover selected backup</button><button data-menu-back>Back</button></div></dialog>
  <dialog id="menu-create-dialog" aria-labelledby="menu-create-title"><p class="eyebrow">A LIGHT IN THE WILDERNESS</p><h2 id="menu-create-title">Create your character</h2><div id="menu-classes" class="menu-classes" aria-label="Character class"></div><section id="menu-class-preview" aria-label="Selected class preview"></section><form id="menu-create-form"><label>Character name <input id="menu-name" name="characterName" autocomplete="off" maxlength="64" required aria-describedby="menu-name-help"></label><p id="menu-name-help">1–32 visible characters. Your class is permanent.</p><p data-menu-message role="status"></p><div class="menu-actions"><button type="submit">Review character</button><button type="button" data-menu-back>Back</button></div></form></dialog>
  <dialog id="menu-confirm-dialog" aria-labelledby="menu-confirm-title"><h2 id="menu-confirm-title">Begin this journey?</h2><p id="menu-confirm-detail"></p><p>Begin at level 1 in Ashen Refuge with a separate inventory, stash and campaign.</p><p data-menu-message role="status"></p><div class="menu-actions"><button id="menu-create-confirm">Confirm creation</button><button data-menu-back>Back</button></div></dialog>
  <dialog id="menu-delete-dialog" aria-labelledby="menu-delete-title"><h2 id="menu-delete-title">Delete character?</h2><p id="menu-delete-detail"></p><p>This removes only this character from selection. A recovery archive is retained locally. Other characters are untouched.</p><p data-menu-message role="status"></p><div class="menu-actions"><button data-menu-back>Keep character</button><button id="menu-delete-confirm">Confirm deletion</button></div></dialog>
  <dialog id="menu-legacy-dialog" aria-labelledby="menu-legacy-title"><h2 id="menu-legacy-title">Bring your saved adventure</h2><p id="menu-legacy-detail"></p><p>Import a validated copy into its own character slot. Original save and recovery records remain intact. Existing class, items and campaign are preserved.</p><p data-menu-message role="status"></p><div class="menu-actions"><button id="menu-migrate">Import and Play Legacy Adventurer</button><button data-menu-back>Back</button></div></dialog>
  <dialog id="menu-settings-dialog" aria-labelledby="menu-settings-title"><h2 id="menu-settings-title">Settings</h2><button data-menu-back>Back to Main Menu</button><section id="controller-settings-host"></section></dialog>`;
  document.title = "Hollowbane · Main Menu";
  const button = (id: string) =>
    root.querySelector<HTMLButtonElement>(`#${id}`)!;
  const dialog = (id: string) =>
    root.querySelector<HTMLDialogElement>(`#${id}`)!;
  const status = root.querySelector<HTMLElement>("#menu-status")!;
  const selection = dialog("menu-character");
  const settings = dialog("menu-settings-dialog");
  const creation = dialog("menu-create-dialog");
  const confirmation = dialog("menu-confirm-dialog");
  const deletion = dialog("menu-delete-dialog");
  const legacyDialog = dialog("menu-legacy-dialog");
  const store = new CharacterStorage();
  let registry: CharacterRegistry | null = null;
  let recent: CharacterLoad | null = null;
  let checkpoint: StorageLoad | null = null;
  let selected: CharacterLoad | null = null;
  let selectedClass: ClassId = "warrior";
  let pendingName = "";
  let createdId: string | null = null;
  let legacyAvailable = false;
  let pendingDelete: CharacterMetadata | null = null;
  let busy = false;
  let disposed = false;
  const focusReturns = new WeakMap<HTMLDialogElement, HTMLElement>();
  const dialogStack: HTMLDialogElement[] = [];
  const openDialog = () => dialogStack.filter((entry) => entry.open).at(-1);
  const controls = (): HTMLElement[] =>
    Array.from(
      (openDialog() ?? root).querySelectorAll<HTMLElement>(
        "button,input,select,a[href]",
      ),
    ).filter(
      (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0,
    );
  const message = (text: string) => {
    status.textContent = text;
    const local = openDialog()?.querySelector<HTMLElement>(
      "[data-menu-message]",
    );
    if (local) local.textContent = text;
  };
  const show = (target: HTMLDialogElement) => {
    if (target.open) return;
    focusReturns.set(target, document.activeElement as HTMLElement);
    target
      .querySelectorAll<HTMLElement>("[data-menu-message]")
      .forEach((el) => (el.textContent = ""));
    hub.clear();
    target.showModal();
    dialogStack.push(target);
    controls()[0]?.focus();
  };
  const back = () => {
    if (!busy) openDialog()?.close();
  };
  for (const target of Array.from(
    root.querySelectorAll<HTMLDialogElement>("dialog"),
  )) {
    target.addEventListener("cancel", (event) => {
      if (busy) event.preventDefault();
    });
    target.addEventListener("close", () => {
      dialogStack.splice(dialogStack.lastIndexOf(target), 1);
      hub.clear();
      focusReturns.get(target)?.focus();
    });
    target.querySelector<HTMLButtonElement>("[data-menu-back]")!.onclick = back;
  }
  const action = async (work: () => Promise<void>) => {
    if (busy || disposed) return;
    busy = true;
    root.setAttribute("aria-busy", "true");
    try {
      await work();
    } catch (error) {
      if (!disposed)
        message(
          `${error instanceof Error ? error.message : "Storage unavailable"}. No other character was changed. Retry or return to selection.`,
        );
    } finally {
      busy = false;
      root.setAttribute("aria-busy", "false");
    }
  };
  let settingsInstalled = false;
  button("menu-settings").onclick = () => {
    if (!settingsInstalled) {
      installControllerSettings();
      settingsInstalled = true;
    }
    show(settings);
  };
  const updateSelection = () => {
    button("menu-play").disabled = selected?.kind !== "valid";
    button("menu-delete").disabled = !selected;
    button("menu-slot-recover").hidden = selected?.kind !== "recoverable";
    root
      .querySelectorAll<HTMLButtonElement>("[data-character-id]")
      .forEach((el) =>
        el.setAttribute(
          "aria-pressed",
          String(el.dataset.characterId === selected?.metadata.id),
        ),
      );
    const detail = root.querySelector<HTMLElement>("#menu-character-detail")!;
    if (!selected) {
      detail.textContent = "Select a character or an empty slot.";
      return;
    }
    const m = selected.metadata;
    detail.textContent = `${m.name} · ${className(m.classId)} · Level ${m.level}`;
    if (selected.kind === "valid") {
      const world = selected.session.exploration;
      detail.textContent += world
        ? ` · ${world.area.replaceAll("-", " ")} · ${world.visited.length} areas visited`
        : " · Legacy adventure";
    } else
      detail.textContent +=
        " · Current save could not be validated. Original retained; no backup or other character has been substituted.";
  };
  const select = (id: string) =>
    action(async () => {
      selected = await store.load(id);
      updateSelection();
    });
  const renderSlots = () => {
    const slots = root.querySelector<HTMLElement>("#menu-slots")!;
    slots.replaceChildren();
    for (let i = 0; i < CHARACTER_CAPACITY; i++) {
      const m = registry?.characters[i];
      const card = document.createElement("button");
      card.className = "menu-slot";
      if (m) {
        card.dataset.characterId = m.id;
        card.setAttribute(
          "aria-pressed",
          String(selected?.metadata.id === m.id),
        );
        const portrait = document.createElement("span");
        portrait.className = "menu-class-mark";
        portrait.setAttribute("aria-hidden", "true");
        if (m.classId) {
          const image = document.createElement("img");
          image.src = portraitPath(m.classId, true);
          image.alt = "";
          image.width = 160;
          image.height = 200;
          image.loading = "lazy";
          image.decoding = "async";
          portrait.append(image);
        } else portrait.textContent = "◇";
        const title = document.createElement("strong");
        title.textContent = m.name;
        const summary = document.createElement("span");
        summary.textContent = `${className(m.classId)} · Level ${m.level}`;
        const played = document.createElement("small");
        played.textContent =
          m.lastPlayedAt === null
            ? "Not played yet"
            : `Last played ${new Date(m.lastPlayedAt).toLocaleString()}`;
        card.append(portrait, title, summary, played);
        card.onclick = () => void select(m.id);
      } else {
        card.classList.add("menu-slot-empty");
        card.textContent = `Empty slot ${i + 1} · Create character`;
        card.onclick = () => openCreation();
      }
      slots.append(card);
    }
    button("menu-create").disabled =
      (registry?.characters.length ?? 8) >= CHARACTER_CAPACITY;
    button("menu-import").hidden = !legacyAvailable;
    button("menu-import").disabled =
      (registry?.characters.length ?? 8) >= CHARACTER_CAPACITY;
    updateSelection();
  };
  const refresh = async () => {
    [registry, recent] = await Promise.all([store.list(), store.recent()]);
    if (disposed) return;
    renderSlots();
    button("menu-load").hidden = registry.characters.length === 0;
    button("menu-load").disabled = false;
    button("menu-new").hidden =
      registry.characters.length >= CHARACTER_CAPACITY;
    button("menu-new").disabled = false;
    button("menu-continue").disabled =
      recent?.kind !== "valid" &&
      !(recent === null && legacyAvailable && checkpoint?.kind === "valid");
    button("menu-recovery").hidden =
      !(recent && recent.kind !== "valid") &&
      !(checkpoint && ["recoverable", "invalid"].includes(checkpoint.kind));
    button("menu-recovery").disabled = false;
    status.textContent = recent
      ? recent.kind === "valid"
        ? `${recent.metadata.name} · ${className(recent.metadata.classId)} · Level ${recent.metadata.level} · Ready to continue.`
        : `${recent.metadata.name}: current save could not be validated. Choose recovery or another character explicitly; no backup has been substituted.`
      : checkpoint?.kind === "valid"
        ? "A legacy adventure is ready to import. Its original will be retained."
        : checkpoint && checkpoint.kind !== "empty"
          ? "Your legacy current save could not be validated. It has been retained; no backup has been substituted."
          : "Begin your journey in Ashen Refuge.";
    // Damaged legacy data must be reviewed before allocating new slots.
    if (
      checkpoint &&
      !["empty", "valid"].includes(checkpoint.kind) &&
      registry.characters.length === 0
    )
      button("menu-new").hidden = true;
  };
  const inspect = () =>
    action(async () => {
      checkpoint = null;
      for (const id of ["continue", "new", "load", "recovery", "retry"]) {
        button(`menu-${id}`).disabled = true;
        if (id !== "continue") button(`menu-${id}`).hidden = true;
      }
      const legacy = new InventoryStorage();
      try {
        checkpoint = await legacy.load();
        legacyAvailable =
          checkpoint.kind === "valid" &&
          (await store.archive("legacy-migration-v1")) === undefined;
        await refresh();
        if (entryError) message(entryError);
      } catch {
        button("menu-retry").hidden = false;
        button("menu-retry").disabled = false;
        message(
          "Character storage is unavailable or blocked. No save was changed. Close other game tabs and retry.",
        );
      } finally {
        legacy.close();
      }
    });
  const enter = async (id: string) => {
    const loaded = await store.load(id);
    if (loaded.kind !== "valid") {
      selected = loaded;
      updateSelection();
      if (!selection.open) show(selection);
      message(
        "Selected save requires explicit recovery. No other character was loaded.",
      );
      return;
    }
    message(`Opening ${loaded.metadata.name}…`);
    hub.clear();
    const route = loaded.session.exploration
      ? "world=1"
      : "inventory=1&advanced=1";
    location.assign(`?${route}&character=${encodeURIComponent(id)}`);
  };
  const reviewLegacy = () => {
    if (busy || !legacyAvailable || checkpoint?.kind !== "valid") return;
    root.querySelector("#menu-legacy-detail")!.textContent =
      `${className(checkpoint.session.progression?.skills.classId ?? null)} · Level ${checkpoint.session.character.level}`;
    show(legacyDialog);
  };
  button("menu-import").onclick = reviewLegacy;
  button("menu-continue").onclick = () => {
    if (recent?.kind === "valid") void action(() => enter(recent!.metadata.id));
    else if (recent === null) reviewLegacy();
  };
  button("menu-migrate").onclick = () =>
    void action(async () => {
      message("Importing validated legacy copy…");
      const migrated = await store.migrateLegacy();
      if (migrated.kind === "empty")
        throw Error("Legacy save is now empty; reload selection");
      if (migrated.deleted)
        throw Error(
          "This imported character was explicitly deleted; it will not be recreated",
        );
      await enter(migrated.id);
    });
  button("menu-play").onclick = () => {
    if (selected?.kind === "valid")
      void action(() => enter(selected!.metadata.id));
  };
  button("menu-load").onclick = () => {
    if (!busy) {
      renderSlots();
      show(selection);
    }
  };
  button("menu-recovery").onclick = () => {
    if (busy) return;
    if (recent && recent.kind !== "valid") {
      selected = recent;
      renderSlots();
      show(selection);
    } else {
      hub.clear();
      location.assign(
        checkpoint?.kind === "recoverable" && !checkpoint.session.exploration
          ? "?inventory=1&advanced=1"
          : "?world=1",
      );
    }
  };
  button("menu-slot-recover").onclick = () =>
    void action(async () => {
      if (selected?.kind !== "recoverable") return;
      message(
        "Restoring selected backup; damaged current retained in archive…",
      );
      selected = await store.recover(
        selected.metadata.id,
        selected.metadata.revision,
      );
      await refresh();
      message("Selected backup restored. Review and choose Play Character.");
    });
  const preview = () => {
    const definition = CHARACTER_CLASSES.find((c) => c.id === selectedClass)!;
    const guide = CLASS_GUIDES[selectedClass];
    const target = root.querySelector<HTMLElement>("#menu-class-preview")!;
    target.innerHTML = `<img class="menu-preview-art" src="${portraitPath(definition.id)}" alt="${definition.name} class illustration" width="512" height="768" decoding="async"><div><h3>${definition.name}</h3><p>${definition.identity}</p><p>${guide.strength}</p><p>${guide.weakness}</p><dl class="menu-attributes">${Object.entries(
      definition.attributes,
    )
      .map(([name, value]) => `<div><dt>${name}</dt><dd>${value}</dd></div>`)
      .join(
        "",
      )}</dl><small>Level 1 · Starting inventory is empty</small></div>`;
    root
      .querySelectorAll<HTMLButtonElement>("[data-class]")
      .forEach((el) =>
        el.setAttribute(
          "aria-pressed",
          String(el.dataset.class === selectedClass),
        ),
      );
  };
  for (const c of CHARACTER_CLASSES) {
    const choice = document.createElement("button");
    choice.dataset.class = c.id;
    choice.textContent = c.name;
    choice.onclick = () => {
      selectedClass = c.id;
      preview();
    };
    root.querySelector("#menu-classes")!.append(choice);
  }
  function openCreation() {
    if (busy || !registry || registry.characters.length >= CHARACTER_CAPACITY)
      return;
    createdId = null;
    preview();
    show(creation);
  }
  button("menu-new").onclick = openCreation;
  button("menu-create").onclick = openCreation;
  root.querySelector<HTMLFormElement>("#menu-create-form")!.onsubmit = (
    event,
  ) => {
    event.preventDefault();
    if (busy) return;
    try {
      pendingName = characterName(
        root.querySelector<HTMLInputElement>("#menu-name")!.value,
      );
      root.querySelector("#menu-confirm-detail")!.textContent =
        `${pendingName} · ${className(selectedClass)} · Permanent class choice`;
      show(confirmation);
    } catch (e) {
      message(e instanceof Error ? e.message : "Invalid name");
    }
  };
  button("menu-create-confirm").onclick = () =>
    void action(async () => {
      message("Creating your independent character checkpoint…");
      if (!createdId) {
        const metadata = await store.create(
          pendingName,
          newCharacter(selectedClass),
        );
        createdId = metadata.id;
      }
      // Keep a successful creation if navigation/activation subsequently fails.
      await refresh();
      selected = await store.load(createdId);
      await enter(createdId);
    });
  button("menu-delete").onclick = () => {
    if (busy || !selected) return;
    pendingDelete = selected.metadata;
    root.querySelector("#menu-delete-detail")!.textContent =
      `Delete “${pendingDelete.name}” · ${className(pendingDelete.classId)} · Level ${pendingDelete.level}?`;
    show(deletion);
  };
  button("menu-delete-confirm").onclick = () =>
    void action(async () => {
      if (!pendingDelete) return;
      await store.delete(pendingDelete.id, pendingDelete.revision);
      pendingDelete = null;
      selected = null;
      deletion.close();
      await refresh();
      message(
        "Character removed from selection. Other adventures are unchanged.",
      );
    });
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
      store.close();
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
