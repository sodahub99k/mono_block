import { STAGE_H, STAGE_W } from "../project/types";
import type { Block, Project, Sprite, Value, Variable } from "../project/types";

export type SpriteLive = {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: number;
  size: number;
  visible: boolean;
  costumeIndex: number;
  costumes: Sprite["costumes"];
  say: { text: string; until: number } | null;
};

export type VarLive = Variable;

export type EngineSnapshot = {
  sprites: SpriteLive[];
  variables: VarLive[];
  backdrop: Project["backdrop"];
  mouse: { x: number; y: number };
};

type Runtime = {
  running: boolean;
  abort: AbortController;
  keys: Set<string>;
  mouse: { x: number; y: number; down: boolean };
  sprites: SpriteLive[];
  variables: VarLive[];
  project: Project;
  startMs: number;
  onStop?: () => void;
};

const SPRITE_HALF = 36;

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

function wrapDir(d: number): number {
  let x = d % 360;
  if (x > 180) x -= 360;
  if (x <= -180) x += 360;
  return x;
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  return "";
}

function truthy(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    if (v === "" || v === "0" || v.toLowerCase() === "false") return false;
    return true;
  }
  return Boolean(v);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function nextFrame(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => resolve(), 32);
    const onAbort = () => {
      window.clearTimeout(id);
      reject(new DOMException("aborted", "AbortError"));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function eventToKey(e: KeyboardEvent): string | null {
  if (e.code === "Space" || e.key === " ") return "space";
  if (e.key === "ArrowUp") return "up";
  if (e.key === "ArrowDown") return "down";
  if (e.key === "ArrowLeft") return "left";
  if (e.key === "ArrowRight") return "right";
  if (e.key.length === 1) return e.key.toLowerCase();
  return null;
}

function bounds(s: SpriteLive): { hw: number; hh: number } {
  const sc = Math.max(0.1, s.size / 100);
  return { hw: SPRITE_HALF * sc, hh: SPRITE_HALF * sc };
}

function touchingTarget(self: SpriteLive, target: string, rt: Runtime): boolean {
  const { hw, hh } = bounds(self);
  if (target === "edge") {
    return (
      self.x + hw >= STAGE_W / 2 ||
      self.x - hw <= -STAGE_W / 2 ||
      self.y + hh >= STAGE_H / 2 ||
      self.y - hh <= -STAGE_H / 2
    );
  }
  if (target === "mouse") {
    return (
      Math.abs(self.x - rt.mouse.x) < hw && Math.abs(self.y - rt.mouse.y) < hh
    );
  }
  const other = rt.sprites.find((s) => s.id === target || s.name === target);
  if (!other || !other.visible) return false;
  const o = bounds(other);
  return (
    Math.abs(self.x - other.x) < hw + o.hw &&
    Math.abs(self.y - other.y) < hh + o.hh
  );
}

function bounce(s: SpriteLive): void {
  const { hw, hh } = bounds(s);
  const maxX = STAGE_W / 2 - hw;
  const maxY = STAGE_H / 2 - hh;
  let bounced = false;
  if (s.x > maxX) {
    s.x = maxX;
    s.direction = -s.direction;
    bounced = true;
  } else if (s.x < -maxX) {
    s.x = -maxX;
    s.direction = -s.direction;
    bounced = true;
  }
  if (s.y > maxY) {
    s.y = maxY;
    s.direction = 180 - s.direction;
    bounced = true;
  } else if (s.y < -maxY) {
    s.y = -maxY;
    s.direction = 180 - s.direction;
    bounced = true;
  }
  if (bounced) s.direction = wrapDir(s.direction);
}

function findVar(rt: Runtime, name: string): VarLive | undefined {
  return rt.variables.find((v) => v.name === name || v.id === name);
}

function evalValue(
  v: Value | undefined,
  sprite: SpriteLive,
  rt: Runtime,
): string | number | boolean {
  if (!v) return 0;
  if (v.kind === "literal") return v.value;
  return evalReporter(v.block, sprite, rt);
}

function evalReporter(
  block: Block,
  sprite: SpriteLive,
  rt: Runtime,
): string | number | boolean {
  const a = (name: string) => evalValue(block.args[name], sprite, rt);
  switch (block.op) {
    case "sensing_keypressed":
      return rt.keys.has(str(a("KEY")));
    case "sensing_touching":
      return touchingTarget(sprite, str(a("TARGET")), rt);
    case "sensing_mousex":
      return Math.round(rt.mouse.x);
    case "sensing_mousey":
      return Math.round(rt.mouse.y);
    case "operator_add":
      return num(a("A")) + num(a("B"));
    case "operator_sub":
      return num(a("A")) - num(a("B"));
    case "operator_mul":
      return num(a("A")) * num(a("B"));
    case "operator_div": {
      const b = num(a("B"));
      return b === 0 ? 0 : num(a("A")) / b;
    }
    case "operator_random": {
      const from = Math.round(num(a("FROM")));
      const to = Math.round(num(a("TO")));
      const lo = Math.min(from, to);
      const hi = Math.max(from, to);
      return lo + Math.floor(Math.random() * (hi - lo + 1));
    }
    case "operator_gt":
      return num(a("A")) > num(a("B"));
    case "operator_lt":
      return num(a("A")) < num(a("B"));
    case "operator_eq":
      return str(a("A")) === str(a("B")) || num(a("A")) === num(a("B"));
    case "operator_and":
      return truthy(a("A")) && truthy(a("B"));
    case "operator_or":
      return truthy(a("A")) || truthy(a("B"));
    case "operator_not":
      return !truthy(a("A"));
    case "data_variable": {
      const v = findVar(rt, str(a("VAR")));
      return v?.value ?? 0;
    }
    default:
      return 0;
  }
}

let audioCtx: AudioContext | null = null;
function beep(freq: number, secs: number): void {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = Math.max(40, Math.min(2000, freq));
    osc.type = "square";
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + Math.max(0.02, secs));
  } catch {
    /* ignore */
  }
}

async function exec(
  block: Block,
  sprite: SpriteLive,
  rt: Runtime,
): Promise<void> {
  if (!rt.running) return;
  const a = (name: string) => evalValue(block.args[name], sprite, rt);
  switch (block.op) {
    case "event_flag":
    case "event_clicked":
    case "event_key":
      break;
    case "motion_move": {
      const steps = num(a("STEPS"));
      sprite.x += steps * Math.sin(deg2rad(sprite.direction));
      sprite.y += steps * Math.cos(deg2rad(sprite.direction));
      await nextFrame(rt.abort.signal);
      break;
    }
    case "motion_turn_right":
      sprite.direction = wrapDir(sprite.direction + num(a("DEGREES")));
      await nextFrame(rt.abort.signal);
      break;
    case "motion_turn_left":
      sprite.direction = wrapDir(sprite.direction - num(a("DEGREES")));
      await nextFrame(rt.abort.signal);
      break;
    case "motion_point":
      sprite.direction = wrapDir(num(a("DIRECTION")));
      break;
    case "motion_gotoxy":
      sprite.x = num(a("X"));
      sprite.y = num(a("Y"));
      await nextFrame(rt.abort.signal);
      break;
    case "motion_goto_random":
      sprite.x = Math.round(Math.random() * STAGE_W - STAGE_W / 2);
      sprite.y = Math.round(Math.random() * STAGE_H - STAGE_H / 2);
      await nextFrame(rt.abort.signal);
      break;
    case "motion_changex":
      sprite.x += num(a("DX"));
      await nextFrame(rt.abort.signal);
      break;
    case "motion_changey":
      sprite.y += num(a("DY"));
      await nextFrame(rt.abort.signal);
      break;
    case "motion_setx":
      sprite.x = num(a("X"));
      break;
    case "motion_sety":
      sprite.y = num(a("Y"));
      break;
    case "motion_bounce":
      bounce(sprite);
      break;
    case "looks_say": {
      const secs = Math.max(0, num(a("SECS")));
      sprite.say = { text: str(a("MESSAGE")), until: performance.now() + secs * 1000 };
      await sleep(secs * 1000, rt.abort.signal);
      if (sprite.say && sprite.say.until <= performance.now() + 16) sprite.say = null;
      break;
    }
    case "looks_show":
      sprite.visible = true;
      break;
    case "looks_hide":
      sprite.visible = false;
      break;
    case "looks_setsizeto":
      sprite.size = Math.max(5, Math.min(400, num(a("SIZE"))));
      break;
    case "looks_changesize":
      sprite.size = Math.max(5, Math.min(400, sprite.size + num(a("SIZE"))));
      break;
    case "looks_nextcostume":
      sprite.costumeIndex = (sprite.costumeIndex + 1) % sprite.costumes.length;
      break;
    case "sound_beep":
      beep(num(a("FREQ")), num(a("SECS")));
      await sleep(Math.max(0, num(a("SECS"))) * 1000, rt.abort.signal);
      break;
    case "control_wait":
      await sleep(Math.max(0, num(a("SECS"))) * 1000, rt.abort.signal);
      break;
    case "control_repeat": {
      const n = Math.floor(Math.max(0, num(a("TIMES"))));
      for (let i = 0; i < n && rt.running; i++) {
        await runStack(block.substk, sprite, rt);
        await nextFrame(rt.abort.signal);
      }
      break;
    }
    case "control_forever":
      while (rt.running) {
        await runStack(block.substk, sprite, rt);
        await nextFrame(rt.abort.signal);
      }
      break;
    case "control_if":
      if (truthy(a("COND"))) await runStack(block.substk, sprite, rt);
      break;
    case "control_if_else":
      if (truthy(a("COND"))) await runStack(block.substk, sprite, rt);
      else await runStack(block.substk2, sprite, rt);
      break;
    case "control_stop":
      rt.running = false;
      rt.abort.abort();
      rt.onStop?.();
      break;
    case "data_set": {
      const v = findVar(rt, str(a("VAR")));
      if (v) v.value = num(a("VALUE"));
      break;
    }
    case "data_change": {
      const v = findVar(rt, str(a("VAR")));
      if (v) v.value += num(a("VALUE"));
      break;
    }
    case "data_show": {
      const v = findVar(rt, str(a("VAR")));
      if (v) v.visible = true;
      break;
    }
    case "data_hide": {
      const v = findVar(rt, str(a("VAR")));
      if (v) v.visible = false;
      break;
    }
    default:
      break;
  }
}

async function runStack(
  block: Block | undefined,
  sprite: SpriteLive,
  rt: Runtime,
): Promise<void> {
  let cur: Block | undefined = block;
  while (cur && rt.running) {
    await exec(cur, sprite, rt);
    cur = cur.next;
  }
}

function liveFrom(s: Sprite): SpriteLive {
  return {
    id: s.id,
    name: s.name,
    x: s.x,
    y: s.y,
    direction: s.direction,
    size: s.size,
    visible: s.visible,
    costumeIndex: s.costumeIndex,
    costumes: s.costumes,
    say: null,
  };
}

export class Engine {
  private rt: Runtime | null = null;
  private listeners: (() => void)[] = [];

  get running(): boolean {
    return Boolean(this.rt?.running);
  }

  snapshot(): EngineSnapshot | null {
    if (!this.rt) return null;
    return {
      sprites: this.rt.sprites,
      variables: this.rt.variables,
      backdrop: this.rt.project.backdrop,
      mouse: { x: this.rt.mouse.x, y: this.rt.mouse.y },
    };
  }

  setMouse(scratchX: number, scratchY: number, down: boolean): void {
    if (!this.rt) return;
    this.rt.mouse.x = scratchX;
    this.rt.mouse.y = scratchY;
    this.rt.mouse.down = down;
  }

  keyDown(key: string): void {
    if (!this.rt?.running) return;
    this.rt.keys.add(key);
    this.spawnHats("event_key", (b) => {
      const v = b.args.KEY;
      return v?.kind === "literal" && v.value === key;
    });
  }

  keyUp(key: string): void {
    this.rt?.keys.delete(key);
  }

  clickSprite(id: string): void {
    if (!this.rt?.running) return;
    const sprite = this.rt.project.sprites.find((s) => s.id === id);
    const live = this.rt.sprites.find((s) => s.id === id);
    if (!sprite || !live) return;
    for (const script of sprite.scripts) {
      if (script.top.op === "event_clicked") {
        void this.safeRun(script.top, live);
      }
    }
  }

  start(project: Project, onStop: () => void): void {
    this.stop(false);
    const abort = new AbortController();
    const rt: Runtime = {
      running: true,
      abort,
      keys: new Set(),
      mouse: { x: 0, y: 0, down: false },
      sprites: project.sprites.map(liveFrom),
      variables: project.variables.map((v) => ({ ...v })),
      project,
      startMs: performance.now(),
      onStop: () => {
        onStop();
        this.fire();
      },
    };
    this.rt = rt;
    this.fire();
    this.spawnHats("event_flag");
  }

  stop(writeBack = true): Partial<Project> | null {
    const rt = this.rt;
    if (!rt) return null;
    rt.running = false;
    if (!rt.abort.signal.aborted) rt.abort.abort();
    let patch: Partial<Project> | null = null;
    if (writeBack) {
      patch = {
        sprites: rt.project.sprites.map((s) => {
          const live = rt.sprites.find((l) => l.id === s.id);
          if (!live) return s;
          return {
            ...s,
            x: live.x,
            y: live.y,
            direction: live.direction,
            size: live.size,
            visible: live.visible,
            costumeIndex: live.costumeIndex,
          };
        }),
        variables: rt.variables.map((v) => ({ ...v })),
      };
    }
    this.rt = null;
    this.fire();
    return patch;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private fire(): void {
    for (const l of this.listeners) l();
  }

  private spawnHats(
    op: Block["op"],
    pred?: (b: Block) => boolean,
  ): void {
    const rt = this.rt;
    if (!rt) return;
    for (const sprite of rt.project.sprites) {
      const live = rt.sprites.find((s) => s.id === sprite.id);
      if (!live) continue;
      for (const script of sprite.scripts) {
        if (script.top.op !== op) continue;
        if (pred && !pred(script.top)) continue;
        void this.safeRun(script.top, live);
      }
    }
  }

  private async safeRun(block: Block, sprite: SpriteLive): Promise<void> {
    const rt = this.rt;
    if (!rt) return;
    try {
      await runStack(block, sprite, rt);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error(err);
    }
  }
}

const g = globalThis as typeof globalThis & { __monoEngine?: Engine };

export function getEngine(): Engine {
  g.__monoEngine ??= new Engine();
  return g.__monoEngine;
}

export function hitTest(
  sprites: SpriteLive[],
  x: number,
  y: number,
): SpriteLive | undefined {
  for (let i = sprites.length - 1; i >= 0; i--) {
    const s = sprites[i]!;
    if (!s.visible) continue;
    const { hw, hh } = bounds(s);
    if (Math.abs(s.x - x) <= hw && Math.abs(s.y - y) <= hh) return s;
  }
  return undefined;
}
