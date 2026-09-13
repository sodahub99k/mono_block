import {
  FIXED_DT,
  STAGE_H,
  STAGE_W,
  type Block,
  type Entity,
  type Project,
  type Script,
  type Value,
  type Variable,
} from "../project/types";

export type EntityLive = Entity;

export type OverlayText = { x: number; y: number; text: string };

export type EngineSnapshot = {
  entities: EntityLive[];
  variables: Variable[];
  backdrop: Project["backdrop"];
  mouse: { x: number; y: number };
  overlays: OverlayText[];
  frame: number;
};

type InputState = {
  down: Set<string>;
  pressed: Set<string>;
  prev: Set<string>;
  mouse: { x: number; y: number; down: boolean };
};

type Runtime = {
  running: boolean;
  project: Project;
  entities: EntityLive[];
  variables: Variable[];
  current: EntityLive | null;
  input: InputState;
  frame: number;
  dt: number;
  overlays: OverlayText[];
  pendingDestroy: Set<string>;
  callDepth: number;
  onStop?: () => void;
  raf: number;
};

const SPRITE_HALF = 36;
const MAX_OPS = 50_000;
const MAX_CALL_DEPTH = 32;

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

function wrapDir(d: number): number {
  let x = d % 360;
  if (x > 180) x -= 360;
  if (x <= -180) x += 360;
  return x;
}

function bounds(e: EntityLive): { hw: number; hh: number } {
  const sc = Math.max(0.1, e.size / 100);
  return { hw: SPRITE_HALF * sc, hh: SPRITE_HALF * sc };
}

function cloneEntity(e: Entity): EntityLive {
  return {
    ...e,
    fields: { ...e.fields },
    costumes: e.costumes.map((c) => ({ ...c })),
  };
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

export function hitTest(
  entities: EntityLive[],
  x: number,
  y: number,
): EntityLive | undefined {
  for (let i = entities.length - 1; i >= 0; i--) {
    const s = entities[i]!;
    if (!s.visible) continue;
    const { hw, hh } = bounds(s);
    if (Math.abs(s.x - x) <= hw && Math.abs(s.y - y) <= hh) return s;
  }
  return undefined;
}

type EvalCtx = {
  rt: Runtime;
  ops: { n: number };
};

function evalValue(v: Value | undefined, ctx: EvalCtx): string | number | boolean {
  if (!v) return 0;
  if (v.kind === "literal") return v.value;
  return evalReporter(v.block, ctx);
}

function requireEntity(rt: Runtime): EntityLive | null {
  return rt.current;
}

function findVar(rt: Runtime, name: string): Variable | undefined {
  return rt.variables.find((v) => v.name === name || v.id === name);
}

function touchingTag(self: EntityLive, tag: string, rt: Runtime): boolean {
  const a = bounds(self);
  for (const o of rt.entities) {
    if (o.id === self.id || !o.visible || o.tag !== tag) continue;
    const b = bounds(o);
    if (
      Math.abs(self.x - o.x) < a.hw + b.hw &&
      Math.abs(self.y - o.y) < a.hh + b.hh
    ) {
      return true;
    }
  }
  return false;
}

function touchingEdge(self: EntityLive): boolean {
  const { hw, hh } = bounds(self);
  return (
    self.x + hw >= STAGE_W / 2 ||
    self.x - hw <= -STAGE_W / 2 ||
    self.y + hh >= STAGE_H / 2 ||
    self.y - hh <= -STAGE_H / 2
  );
}

function bounceEdges(e: EntityLive): void {
  const { hw, hh } = bounds(e);
  const maxX = Math.max(0, STAGE_W / 2 - hw);
  const maxY = Math.max(0, STAGE_H / 2 - hh);
  if (e.x > maxX) {
    e.x = maxX;
    e.vx = -Math.abs(e.vx);
  } else if (e.x < -maxX) {
    e.x = -maxX;
    e.vx = Math.abs(e.vx);
  }
  if (e.y > maxY) {
    e.y = maxY;
    e.vy = -Math.abs(e.vy);
  } else if (e.y < -maxY) {
    e.y = -maxY;
    e.vy = Math.abs(e.vy);
  }
}

function evalReporter(block: Block, ctx: EvalCtx): string | number | boolean {
  bump(ctx);
  const a = (name: string) => evalValue(block.args[name], ctx);
  const e = ctx.rt.current;
  switch (block.op) {
    case "game_dt":
      return ctx.rt.dt;
    case "game_frame":
      return ctx.rt.frame;
    case "input_key_down":
      return ctx.rt.input.down.has(str(a("KEY")));
    case "input_key_pressed":
      return ctx.rt.input.pressed.has(str(a("KEY")));
    case "input_mouse_x":
      return Math.round(ctx.rt.input.mouse.x);
    case "input_mouse_y":
      return Math.round(ctx.rt.input.mouse.y);
    case "entity_name":
      return e?.name ?? "";
    case "entity_tag":
      return e?.tag ?? "";
    case "motion_x":
      return e?.x ?? 0;
    case "motion_y":
      return e?.y ?? 0;
    case "motion_vx":
      return e?.vx ?? 0;
    case "motion_vy":
      return e?.vy ?? 0;
    case "sensing_touching_tag":
      return e ? touchingTag(e, str(a("TAG")), ctx.rt) : false;
    case "sensing_touching_edge":
      return e ? touchingEdge(e) : false;
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
    case "data_variable":
      return findVar(ctx.rt, str(a("VAR")))?.value ?? 0;
    case "oo_field_get": {
      const field = str(a("FIELD"));
      return e?.fields[field] ?? 0;
    }
    case "oo_struct_name":
      return e?.structName ?? "";
    default:
      return 0;
  }
}

function bump(ctx: EvalCtx): void {
  ctx.ops.n += 1;
  if (ctx.ops.n > MAX_OPS) {
    throw new Error("script too long (possible infinite loop)");
  }
}

function execStack(block: Block | undefined, ctx: EvalCtx): void {
  let cur: Block | undefined = block;
  while (cur && ctx.rt.running) {
    execBlock(cur, ctx);
    cur = cur.next;
  }
}

function execBlock(block: Block, ctx: EvalCtx): void {
  bump(ctx);
  if (!ctx.rt.running) return;
  const a = (name: string) => evalValue(block.args[name], ctx);
  const rt = ctx.rt;

  switch (block.op) {
    case "game_stop":
      rt.running = false;
      rt.onStop?.();
      return;
    case "entity_with": {
      const name = str(a("NAME"));
      const ent = rt.entities.find((e) => e.name === name);
      if (!ent) return;
      const prev = rt.current;
      rt.current = ent;
      execStack(block.substk, ctx);
      rt.current = prev;
      return;
    }
    case "entity_foreach": {
      const tag = str(a("TAG"));
      const list = rt.entities.filter((e) => e.tag === tag);
      const prev = rt.current;
      for (const ent of list) {
        if (!rt.running) break;
        if (rt.pendingDestroy.has(ent.id)) continue;
        rt.current = ent;
        execStack(block.substk, ctx);
      }
      rt.current = prev;
      return;
    }
    case "entity_destroy": {
      const e = requireEntity(rt);
      if (e) rt.pendingDestroy.add(e.id);
      return;
    }
    case "motion_setx": {
      const e = requireEntity(rt);
      if (e) e.x = num(a("X"));
      return;
    }
    case "motion_sety": {
      const e = requireEntity(rt);
      if (e) e.y = num(a("Y"));
      return;
    }
    case "motion_changex": {
      const e = requireEntity(rt);
      if (e) e.x += num(a("DX"));
      return;
    }
    case "motion_changey": {
      const e = requireEntity(rt);
      if (e) e.y += num(a("DY"));
      return;
    }
    case "motion_set_vx": {
      const e = requireEntity(rt);
      if (e) e.vx = num(a("VX"));
      return;
    }
    case "motion_set_vy": {
      const e = requireEntity(rt);
      if (e) e.vy = num(a("VY"));
      return;
    }
    case "motion_change_vx": {
      const e = requireEntity(rt);
      if (e) e.vx += num(a("DVX"));
      return;
    }
    case "motion_change_vy": {
      const e = requireEntity(rt);
      if (e) e.vy += num(a("DVY"));
      return;
    }
    case "motion_apply_velocity": {
      const e = requireEntity(rt);
      if (e) {
        e.x += e.vx * rt.dt;
        e.y += e.vy * rt.dt;
      }
      return;
    }
    case "motion_gotoxy": {
      const e = requireEntity(rt);
      if (e) {
        e.x = num(a("X"));
        e.y = num(a("Y"));
      }
      return;
    }
    case "motion_point": {
      const e = requireEntity(rt);
      if (e) e.direction = wrapDir(num(a("DIRECTION")));
      return;
    }
    case "motion_bounce_edges": {
      const e = requireEntity(rt);
      if (e) bounceEdges(e);
      return;
    }
    case "looks_show": {
      const e = requireEntity(rt);
      if (e) e.visible = true;
      return;
    }
    case "looks_hide": {
      const e = requireEntity(rt);
      if (e) e.visible = false;
      return;
    }
    case "looks_setsizeto": {
      const e = requireEntity(rt);
      if (e) e.size = Math.max(5, Math.min(400, num(a("SIZE"))));
      return;
    }
    case "looks_nextcostume": {
      const e = requireEntity(rt);
      if (e && e.costumes.length > 0) {
        e.costumeIndex = (e.costumeIndex + 1) % e.costumes.length;
      }
      return;
    }
    case "draw_text":
      rt.overlays.push({
        x: num(a("X")),
        y: num(a("Y")),
        text: str(a("TEXT")),
      });
      return;
    case "draw_clear_overlay":
      rt.overlays = [];
      return;
    case "control_if":
      if (truthy(a("COND"))) execStack(block.substk, ctx);
      return;
    case "control_if_else":
      if (truthy(a("COND"))) execStack(block.substk, ctx);
      else execStack(block.substk2, ctx);
      return;
    case "control_repeat": {
      const n = Math.floor(Math.max(0, Math.min(10_000, num(a("TIMES")))));
      for (let i = 0; i < n && rt.running; i++) {
        execStack(block.substk, ctx);
      }
      return;
    }
    case "data_set": {
      const v = findVar(rt, str(a("VAR")));
      if (v) v.value = num(a("VALUE"));
      return;
    }
    case "data_change": {
      const v = findVar(rt, str(a("VAR")));
      if (v) v.value += num(a("VALUE"));
      return;
    }
    case "data_show": {
      const v = findVar(rt, str(a("VAR")));
      if (v) v.visible = true;
      return;
    }
    case "data_hide": {
      const v = findVar(rt, str(a("VAR")));
      if (v) v.visible = false;
      return;
    }
    case "oo_field_set": {
      const e = requireEntity(rt);
      if (!e) return;
      e.fields[str(a("FIELD"))] = num(a("VALUE"));
      return;
    }
    case "oo_field_change": {
      const e = requireEntity(rt);
      if (!e) return;
      const field = str(a("FIELD"));
      e.fields[field] = (e.fields[field] ?? 0) + num(a("VALUE"));
      return;
    }
    case "oo_call": {
      callMethod(str(a("METHOD")), ctx);
      return;
    }
    default:
      return;
  }
}

function findStruct(rt: Runtime, name: string | null) {
  if (!name) return undefined;
  return rt.project.structs.find((s) => s.name === name);
}

function callMethod(methodName: string, ctx: EvalCtx): void {
  const rt = ctx.rt;
  const e = requireEntity(rt);
  if (!e) return;
  const struct = findStruct(rt, e.structName);
  const method = struct?.methods.find((m) => m.name === methodName);
  if (!method) return;
  if (rt.callDepth >= MAX_CALL_DEPTH) {
    throw new Error("method call too deep (possible recursion)");
  }
  rt.callDepth += 1;
  try {
    for (const s of method.scripts) {
      if (!rt.running) break;
      execStack(s.top, ctx);
    }
  } finally {
    rt.callDepth -= 1;
  }
}

function runScripts(scripts: Script[], rt: Runtime): void {
  const ctx: EvalCtx = { rt, ops: { n: 0 } };
  try {
    for (const s of scripts) {
      if (!rt.running) break;
      execStack(s.top, ctx);
    }
  } catch (err) {
    console.error(err);
    rt.running = false;
    rt.onStop?.();
  }
}

function flushDestroy(rt: Runtime): void {
  if (rt.pendingDestroy.size === 0) return;
  rt.entities = rt.entities.filter((e) => !rt.pendingDestroy.has(e.id));
  if (rt.current && rt.pendingDestroy.has(rt.current.id)) rt.current = null;
  rt.pendingDestroy.clear();
}

function advanceInput(input: InputState): void {
  input.pressed.clear();
  for (const k of input.down) {
    if (!input.prev.has(k)) input.pressed.add(k);
  }
  input.prev = new Set(input.down);
}

export class Engine {
  private rt: Runtime | null = null;

  get running(): boolean {
    return Boolean(this.rt?.running);
  }

  snapshot(): EngineSnapshot | null {
    if (!this.rt) return null;
    return {
      entities: this.rt.entities,
      variables: this.rt.variables,
      backdrop: this.rt.project.backdrop,
      mouse: {
        x: this.rt.input.mouse.x,
        y: this.rt.input.mouse.y,
      },
      overlays: this.rt.overlays,
      frame: this.rt.frame,
    };
  }

  setMouse(x: number, y: number, down: boolean): void {
    if (!this.rt) return;
    this.rt.input.mouse = { x, y, down };
  }

  keyDown(key: string): void {
    this.rt?.input.down.add(key);
  }

  keyUp(key: string): void {
    this.rt?.input.down.delete(key);
  }

  start(project: Project, onStop: () => void): void {
    this.stop(false);
    const input: InputState = {
      down: new Set(),
      pressed: new Set(),
      prev: new Set(),
      mouse: { x: 0, y: 0, down: false },
    };
    const rt: Runtime = {
      running: true,
      project,
      entities: project.entities.map(cloneEntity),
      variables: project.variables.map((v) => ({ ...v })),
      current: null,
      input,
      frame: 0,
      dt: FIXED_DT,
      overlays: [],
      pendingDestroy: new Set(),
      callDepth: 0,
      onStop,
      raf: 0,
    };
    this.rt = rt;

    runScripts(project.boot, rt);
    flushDestroy(rt);

    const tick = () => {
      if (!this.rt || this.rt !== rt || !rt.running) return;
      rt.dt = FIXED_DT;
      rt.frame += 1;
      advanceInput(rt.input);
      rt.overlays = [];
      runScripts(project.update, rt);
      flushDestroy(rt);
      runScripts(project.draw, rt);
      if (rt.running) {
        rt.raf = requestAnimationFrame(tick);
      }
    };
    rt.raf = requestAnimationFrame(tick);
  }

  stop(writeBack = true): Partial<Project> | null {
    const rt = this.rt;
    if (!rt) return null;
    rt.running = false;
    cancelAnimationFrame(rt.raf);
    let patch: Partial<Project> | null = null;
    if (writeBack) {
      patch = {
        entities: rt.entities.map((e) => ({
          ...e,
          fields: { ...e.fields },
          costumes: e.costumes.map((c) => ({ ...c })),
        })),
        variables: rt.variables.map((v) => ({ ...v })),
      };
    }
    this.rt = null;
    return patch;
  }
}

const g = globalThis as typeof globalThis & { __monoEngine?: Engine };

export function getEngine(): Engine {
  g.__monoEngine ??= new Engine();
  return g.__monoEngine;
}
