export type SoundKind =
  "attack" | "impact" | "death" | "cast" | "spell" | "loot";
export interface SoundCue {
  kind: SoundKind;
  skill?: string;
  quality?: "normal" | "magic" | "rare" | "unique";
}
export interface SoundRecipe {
  wave: OscillatorType;
  from: number;
  to: number;
  duration: number;
  gain: number;
}
export function soundRecipe(c: SoundCue): SoundRecipe {
  if (c.kind === "loot") {
    const rank = ["normal", "magic", "rare", "unique"].indexOf(
      c.quality ?? "normal",
    );
    return {
      wave: "sine",
      from: 440 + rank * 180,
      to: 520 + rank * 260,
      duration: 0.09 + rank * 0.055,
      gain: 0.025 + rank * 0.006,
    };
  }
  if (c.kind === "death")
    return { wave: "sine", from: 110, to: 34, duration: 0.3, gain: 0.055 };
  if (c.kind === "impact")
    return { wave: "triangle", from: 180, to: 48, duration: 0.1, gain: 0.05 };
  if (c.kind === "attack")
    return {
      wave: "triangle",
      from: 360,
      to: 130,
      duration: 0.065,
      gain: 0.022,
    };
  const recipes: Record<string, SoundRecipe> = {
    "ember-lance": {
      wave: "sawtooth",
      from: 640,
      to: 115,
      duration: 0.18,
      gain: 0.022,
    },
    "rime-ring": {
      wave: "sine",
      from: 1450,
      to: 720,
      duration: 0.27,
      gain: 0.035,
    },
    "storm-thread": {
      wave: "square",
      from: 1100,
      to: 90,
      duration: 0.13,
      gain: 0.014,
    },
    "iron-fan": {
      wave: "triangle",
      from: 460,
      to: 150,
      duration: 0.1,
      gain: 0.035,
    },
    "oath-echo": {
      wave: "sine",
      from: 330,
      to: 495,
      duration: 0.34,
      gain: 0.045,
    },
    "briar-edge": {
      wave: "triangle",
      from: 260,
      to: 110,
      duration: 0.17,
      gain: 0.028,
    },
  };
  const p = recipes[c.skill ?? ""] ?? recipes["ember-lance"]!;
  return c.kind === "cast"
    ? {
        ...p,
        duration: 0.065,
        gain: p.gain * 0.25,
        from: p.from * 0.6,
        to: p.from,
      }
    : p;
}
/** Original bounded synthesis; user activation and mute are outside the simulation. */
export class CombatAudio {
  private ctx: AudioContext | null = null;
  private voices = new Set<OscillatorNode>();
  private noise: AudioBuffer | null = null;
  private tails = new Map<OscillatorNode, () => void>();
  private muted = false;
  private unavailable = false;
  private played = 0;
  private dropped = 0;
  constructor(
    private factory: () => AudioContext = () => {
      if (typeof AudioContext === "undefined")
        throw Error("Web Audio unavailable");
      return new AudioContext();
    },
  ) {}
  async unlock(): Promise<void> {
    if (this.muted || this.unavailable) return;
    try {
      this.ctx ??= this.factory();
      if (this.ctx.state === "suspended") await this.ctx.resume();
    } catch {
      this.unavailable = this.ctx === null;
      this.silence();
    }
  }
  setMuted(value: boolean): void {
    this.muted = value;
    if (value) this.silence();
  }
  play(cue: SoundCue): void {
    if (
      this.muted ||
      !this.ctx ||
      this.ctx.state !== "running" ||
      this.unavailable
    )
      return;
    if (this.voices.size >= 8) {
      this.dropped++;
      return;
    }
    try {
      const recipe = soundRecipe(cue),
        ctx = this.ctx,
        osc = ctx.createOscillator(),
        gain = ctx.createGain(),
        now = ctx.currentTime;
      osc.type = recipe.wave;
      osc.frequency.setValueAtTime(recipe.from, now);
      osc.frequency.exponentialRampToValueAtTime(
        recipe.to,
        now + recipe.duration,
      );
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(recipe.gain, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + recipe.duration);
      let tail: (() => void) | null = null;
      if (
        typeof ctx.createBuffer === "function" &&
        (["attack", "impact", "death"].includes(cue.kind) ||
          ["ember-lance", "briar-edge"].includes(cue.skill ?? ""))
      ) {
        try {
          if (!this.noise) {
            this.noise = ctx.createBuffer(1, 8192, ctx.sampleRate);
            const samples = this.noise.getChannelData(0);
            let seed = 34841;
            for (let i = 0; i < samples.length; i++) {
              seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
              samples[i] = seed / 2147483648 - 1;
            }
          }
          const hiss = ctx.createBufferSource(),
            filter = ctx.createBiquadFilter(),
            level = ctx.createGain();
          hiss.buffer = this.noise;
          hiss.loop = true;
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(
            cue.kind === "death" ? 450 : 2600,
            now,
          );
          filter.frequency.exponentialRampToValueAtTime(
            160,
            now + recipe.duration,
          );
          level.gain.setValueAtTime(0.35, now);
          hiss.connect(filter);
          filter.connect(level);
          level.connect(gain);
          hiss.start(now);
          hiss.stop(now + recipe.duration + 0.01);
          tail = () => {
            try {
              hiss.stop();
            } catch {
              /* Already ended. */
            }
            hiss.disconnect();
            filter.disconnect();
            level.disconnect();
          };
        } catch {
          /* Optional noise layer is unavailable; tonal fallback remains. */
        }
      }
      if (tail) this.tails.set(osc, tail);
      osc.connect(gain);
      gain.connect(ctx.destination);
      this.voices.add(osc);
      osc.onended = () => {
        this.tails.get(osc)?.();
        this.tails.delete(osc);
        osc.disconnect();
        gain.disconnect();
        this.voices.delete(osc);
      };
      osc.start(now);
      osc.stop(now + recipe.duration + 0.01);
      this.played++;
    } catch {
      this.unavailable = true;
      this.silence();
    }
  }
  silence(): void {
    for (const osc of this.voices) {
      try {
        osc.stop();
      } catch {
        /* Already ended. */
      }
      this.tails.get(osc)?.();
      this.tails.delete(osc);
      osc.disconnect();
    }
    this.voices.clear();
  }
  status(): {
    state: string;
    muted: boolean;
    played: number;
    active: number;
    dropped: number;
  } {
    return {
      state: this.unavailable
        ? "unavailable"
        : this.muted
          ? "muted"
          : (this.ctx?.state ?? "awaiting gesture"),
      muted: this.muted,
      played: this.played,
      active: this.voices.size,
      dropped: this.dropped,
    };
  }
  async dispose(): Promise<void> {
    this.silence();
    try {
      await this.ctx?.close();
    } catch {
      /* Browser is tearing down. */
    }
  }
}
