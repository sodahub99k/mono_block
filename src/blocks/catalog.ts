import type { Block, Opcode, Shape, Value } from "../project/types";
import { lit, nid } from "../project/types";

export type CategoryId =
  | "game"
  | "input"
  | "entity"
  | "oo"
  | "motion"
  | "looks"
  | "draw"
  | "control"
  | "sensing"
  | "operators"
  | "variables";

export type Part =
  | { t: "text"; s: string }
  | { t: "num"; name: string; def: string }
  | { t: "str"; name: string; def: string }
  | { t: "bool"; name: string }
  | { t: "menu"; name: string; options: { value: string; label: string }[] }
  | { t: "var"; name: string };

export type BlockDef = {
  op: Opcode;
  category: CategoryId;
  shape: Shape;
  color: string;
  parts: Part[];
  elseParts?: Part[];
  /** If set, only show in these phases (undefined = all). */
  phases?: Array<"boot" | "update" | "draw">;
};

export const COLORS: Record<CategoryId, string> = {
  game: "#0FBD8C",
  input: "#5CB1D6",
  entity: "#FF8C1A",
  oo: "#E76F51",
  motion: "#4C97FF",
  looks: "#9966FF",
  draw: "#CF63CF",
  control: "#FFAB19",
  sensing: "#5CB1D6",
  operators: "#59C059",
  variables: "#FF8C1A",
};

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  game: "ゲーム",
  input: "入力",
  entity: "エンティティ",
  oo: "struct",
  motion: "動き",
  looks: "見た目",
  draw: "描画",
  control: "制御",
  sensing: "調べる",
  operators: "演算",
  variables: "変数",
};

export const KEY_OPTIONS = [
  { value: "space", label: "スペース" },
  { value: "up", label: "上" },
  { value: "down", label: "下" },
  { value: "left", label: "左" },
  { value: "right", label: "右" },
  { value: "a", label: "a" },
  { value: "b", label: "b" },
  { value: "w", label: "w" },
  { value: "s", label: "s" },
  { value: "d", label: "d" },
] as const;

export const DEFS: BlockDef[] = [
  {
    op: "game_dt",
    category: "game",
    shape: "reporter",
    color: COLORS.game,
    parts: [{ t: "text", s: "dt" }],
    phases: ["update", "draw"],
  },
  {
    op: "game_frame",
    category: "game",
    shape: "reporter",
    color: COLORS.game,
    parts: [{ t: "text", s: "フレーム" }],
  },
  {
    op: "game_stop",
    category: "game",
    shape: "cap",
    color: COLORS.game,
    parts: [{ t: "text", s: "ゲームを止める" }],
    phases: ["update"],
  },
  {
    op: "input_key_down",
    category: "input",
    shape: "boolean",
    color: COLORS.input,
    parts: [
      { t: "menu", name: "KEY", options: [...KEY_OPTIONS] },
      { t: "text", s: "キーが押されている" },
    ],
    phases: ["update"],
  },
  {
    op: "input_key_pressed",
    category: "input",
    shape: "boolean",
    color: COLORS.input,
    parts: [
      { t: "menu", name: "KEY", options: [...KEY_OPTIONS] },
      { t: "text", s: "キーが今押された" },
    ],
    phases: ["update"],
  },
  {
    op: "input_mouse_x",
    category: "input",
    shape: "reporter",
    color: COLORS.input,
    parts: [{ t: "text", s: "マウス x" }],
  },
  {
    op: "input_mouse_y",
    category: "input",
    shape: "reporter",
    color: COLORS.input,
    parts: [{ t: "text", s: "マウス y" }],
  },
  {
    op: "entity_with",
    category: "entity",
    shape: "c",
    color: COLORS.entity,
    parts: [
      { t: "text", s: "エンティティ" },
      { t: "str", name: "NAME", def: "player" },
      { t: "text", s: "について" },
    ],
  },
  {
    op: "entity_foreach",
    category: "entity",
    shape: "c",
    color: COLORS.entity,
    parts: [
      { t: "text", s: "タグ" },
      { t: "str", name: "TAG", def: "coin" },
      { t: "text", s: "の各エンティティ" },
    ],
    phases: ["update", "draw"],
  },
  {
    op: "entity_destroy",
    category: "entity",
    shape: "stack",
    color: COLORS.entity,
    parts: [{ t: "text", s: "このエンティティを消す" }],
    phases: ["update"],
  },
  {
    op: "entity_name",
    category: "entity",
    shape: "reporter",
    color: COLORS.entity,
    parts: [{ t: "text", s: "名前" }],
  },
  {
    op: "entity_tag",
    category: "entity",
    shape: "reporter",
    color: COLORS.entity,
    parts: [{ t: "text", s: "タグ" }],
  },
  {
    op: "motion_setx",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "x を" },
      { t: "num", name: "X", def: "0" },
      { t: "text", s: "にする" },
    ],
  },
  {
    op: "motion_sety",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "y を" },
      { t: "num", name: "Y", def: "0" },
      { t: "text", s: "にする" },
    ],
  },
  {
    op: "motion_changex",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "x を" },
      { t: "num", name: "DX", def: "10" },
      { t: "text", s: "ずつ変える" },
    ],
  },
  {
    op: "motion_changey",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "y を" },
      { t: "num", name: "DY", def: "10" },
      { t: "text", s: "ずつ変える" },
    ],
  },
  {
    op: "motion_set_vx",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "vx を" },
      { t: "num", name: "VX", def: "0" },
      { t: "text", s: "にする" },
    ],
  },
  {
    op: "motion_set_vy",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "vy を" },
      { t: "num", name: "VY", def: "0" },
      { t: "text", s: "にする" },
    ],
  },
  {
    op: "motion_change_vx",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "vx を" },
      { t: "num", name: "DVX", def: "10" },
      { t: "text", s: "ずつ変える" },
    ],
  },
  {
    op: "motion_change_vy",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "vy を" },
      { t: "num", name: "DVY", def: "10" },
      { t: "text", s: "ずつ変える" },
    ],
  },
  {
    op: "motion_apply_velocity",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [{ t: "text", s: "速度を位置に足す (×dt)" }],
    phases: ["update"],
  },
  {
    op: "motion_gotoxy",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "x:" },
      { t: "num", name: "X", def: "0" },
      { t: "text", s: " y:" },
      { t: "num", name: "Y", def: "0" },
      { t: "text", s: "へ行く" },
    ],
  },
  {
    op: "motion_point",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "向きを" },
      { t: "num", name: "DIRECTION", def: "90" },
      { t: "text", s: "度にする" },
    ],
  },
  {
    op: "motion_bounce_edges",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [{ t: "text", s: "端で跳ね返る (vx/vy)" }],
    phases: ["update"],
  },
  {
    op: "motion_x",
    category: "motion",
    shape: "reporter",
    color: COLORS.motion,
    parts: [{ t: "text", s: "x" }],
  },
  {
    op: "motion_y",
    category: "motion",
    shape: "reporter",
    color: COLORS.motion,
    parts: [{ t: "text", s: "y" }],
  },
  {
    op: "motion_vx",
    category: "motion",
    shape: "reporter",
    color: COLORS.motion,
    parts: [{ t: "text", s: "vx" }],
  },
  {
    op: "motion_vy",
    category: "motion",
    shape: "reporter",
    color: COLORS.motion,
    parts: [{ t: "text", s: "vy" }],
  },
  {
    op: "looks_show",
    category: "looks",
    shape: "stack",
    color: COLORS.looks,
    parts: [{ t: "text", s: "表示する" }],
  },
  {
    op: "looks_hide",
    category: "looks",
    shape: "stack",
    color: COLORS.looks,
    parts: [{ t: "text", s: "隠す" }],
  },
  {
    op: "looks_setsizeto",
    category: "looks",
    shape: "stack",
    color: COLORS.looks,
    parts: [
      { t: "text", s: "大きさを" },
      { t: "num", name: "SIZE", def: "100" },
      { t: "text", s: "%にする" },
    ],
  },
  {
    op: "looks_nextcostume",
    category: "looks",
    shape: "stack",
    color: COLORS.looks,
    parts: [{ t: "text", s: "次のコスチューム" }],
  },
  {
    op: "draw_text",
    category: "draw",
    shape: "stack",
    color: COLORS.draw,
    parts: [
      { t: "text", s: "文字" },
      { t: "str", name: "TEXT", def: "Hello" },
      { t: "text", s: "を (" },
      { t: "num", name: "X", def: "-200" },
      { t: "text", s: "," },
      { t: "num", name: "Y", def: "150" },
      { t: "text", s: ") に描く" },
    ],
    phases: ["draw"],
  },
  {
    op: "draw_clear_overlay",
    category: "draw",
    shape: "stack",
    color: COLORS.draw,
    parts: [{ t: "text", s: "オーバーレイを消す" }],
    phases: ["draw"],
  },
  {
    op: "control_if",
    category: "control",
    shape: "c",
    color: COLORS.control,
    parts: [
      { t: "text", s: "もし" },
      { t: "bool", name: "COND" },
      { t: "text", s: "なら" },
    ],
  },
  {
    op: "control_if_else",
    category: "control",
    shape: "c2",
    color: COLORS.control,
    parts: [
      { t: "text", s: "もし" },
      { t: "bool", name: "COND" },
      { t: "text", s: "なら" },
    ],
    elseParts: [{ t: "text", s: "でなければ" }],
  },
  {
    op: "control_repeat",
    category: "control",
    shape: "c",
    color: COLORS.control,
    parts: [
      { t: "num", name: "TIMES", def: "10" },
      { t: "text", s: "回繰り返す" },
    ],
  },
  {
    op: "sensing_touching_tag",
    category: "sensing",
    shape: "boolean",
    color: COLORS.sensing,
    parts: [
      { t: "text", s: "タグ" },
      { t: "str", name: "TAG", def: "coin" },
      { t: "text", s: "に触れた" },
    ],
  },
  {
    op: "sensing_touching_edge",
    category: "sensing",
    shape: "boolean",
    color: COLORS.sensing,
    parts: [{ t: "text", s: "端に触れた" }],
  },
  {
    op: "operator_add",
    category: "operators",
    shape: "reporter",
    color: COLORS.operators,
    parts: [
      { t: "num", name: "A", def: "1" },
      { t: "text", s: "+" },
      { t: "num", name: "B", def: "1" },
    ],
  },
  {
    op: "operator_sub",
    category: "operators",
    shape: "reporter",
    color: COLORS.operators,
    parts: [
      { t: "num", name: "A", def: "1" },
      { t: "text", s: "−" },
      { t: "num", name: "B", def: "1" },
    ],
  },
  {
    op: "operator_mul",
    category: "operators",
    shape: "reporter",
    color: COLORS.operators,
    parts: [
      { t: "num", name: "A", def: "2" },
      { t: "text", s: "×" },
      { t: "num", name: "B", def: "2" },
    ],
  },
  {
    op: "operator_div",
    category: "operators",
    shape: "reporter",
    color: COLORS.operators,
    parts: [
      { t: "num", name: "A", def: "4" },
      { t: "text", s: "÷" },
      { t: "num", name: "B", def: "2" },
    ],
  },
  {
    op: "operator_random",
    category: "operators",
    shape: "reporter",
    color: COLORS.operators,
    parts: [
      { t: "text", s: "乱数" },
      { t: "num", name: "FROM", def: "1" },
      { t: "text", s: "〜" },
      { t: "num", name: "TO", def: "10" },
    ],
  },
  {
    op: "operator_gt",
    category: "operators",
    shape: "boolean",
    color: COLORS.operators,
    parts: [
      { t: "num", name: "A", def: "1" },
      { t: "text", s: ">" },
      { t: "num", name: "B", def: "0" },
    ],
  },
  {
    op: "operator_lt",
    category: "operators",
    shape: "boolean",
    color: COLORS.operators,
    parts: [
      { t: "num", name: "A", def: "0" },
      { t: "text", s: "<" },
      { t: "num", name: "B", def: "1" },
    ],
  },
  {
    op: "operator_eq",
    category: "operators",
    shape: "boolean",
    color: COLORS.operators,
    parts: [
      { t: "num", name: "A", def: "0" },
      { t: "text", s: "=" },
      { t: "num", name: "B", def: "0" },
    ],
  },
  {
    op: "operator_and",
    category: "operators",
    shape: "boolean",
    color: COLORS.operators,
    parts: [
      { t: "bool", name: "A" },
      { t: "text", s: "かつ" },
      { t: "bool", name: "B" },
    ],
  },
  {
    op: "operator_or",
    category: "operators",
    shape: "boolean",
    color: COLORS.operators,
    parts: [
      { t: "bool", name: "A" },
      { t: "text", s: "または" },
      { t: "bool", name: "B" },
    ],
  },
  {
    op: "operator_not",
    category: "operators",
    shape: "boolean",
    color: COLORS.operators,
    parts: [
      { t: "text", s: "〜でない" },
      { t: "bool", name: "A" },
    ],
  },
  {
    op: "data_set",
    category: "variables",
    shape: "stack",
    color: COLORS.variables,
    parts: [
      { t: "var", name: "VAR" },
      { t: "text", s: "を" },
      { t: "num", name: "VALUE", def: "0" },
      { t: "text", s: "にする" },
    ],
  },
  {
    op: "data_change",
    category: "variables",
    shape: "stack",
    color: COLORS.variables,
    parts: [
      { t: "var", name: "VAR" },
      { t: "text", s: "を" },
      { t: "num", name: "VALUE", def: "1" },
      { t: "text", s: "ずつ変える" },
    ],
  },
  {
    op: "data_show",
    category: "variables",
    shape: "stack",
    color: COLORS.variables,
    parts: [
      { t: "var", name: "VAR" },
      { t: "text", s: "を表示する" },
    ],
  },
  {
    op: "data_hide",
    category: "variables",
    shape: "stack",
    color: COLORS.variables,
    parts: [
      { t: "var", name: "VAR" },
      { t: "text", s: "を隠す" },
    ],
  },
  {
    op: "data_variable",
    category: "variables",
    shape: "reporter",
    color: COLORS.variables,
    parts: [{ t: "var", name: "VAR" }],
  },
  {
    op: "oo_field_get",
    category: "oo",
    shape: "reporter",
    color: COLORS.oo,
    parts: [
      { t: "text", s: "self." },
      { t: "str", name: "FIELD", def: "speed" },
    ],
  },
  {
    op: "oo_field_set",
    category: "oo",
    shape: "stack",
    color: COLORS.oo,
    parts: [
      { t: "text", s: "self." },
      { t: "str", name: "FIELD", def: "speed" },
      { t: "text", s: "=" },
      { t: "num", name: "VALUE", def: "0" },
    ],
  },
  {
    op: "oo_field_change",
    category: "oo",
    shape: "stack",
    color: COLORS.oo,
    parts: [
      { t: "text", s: "self." },
      { t: "str", name: "FIELD", def: "speed" },
      { t: "text", s: "+=" },
      { t: "num", name: "VALUE", def: "1" },
    ],
  },
  {
    op: "oo_call",
    category: "oo",
    shape: "stack",
    color: COLORS.oo,
    parts: [
      { t: "text", s: "self." },
      { t: "str", name: "METHOD", def: "update" },
      { t: "text", s: "()" },
    ],
  },
  {
    op: "oo_struct_name",
    category: "oo",
    shape: "reporter",
    color: COLORS.oo,
    parts: [{ t: "text", s: "self の struct" }],
  },
];

const DEF_MAP = new Map(DEFS.map((d) => [d.op, d]));

export function defOf(op: Opcode): BlockDef {
  const d = DEF_MAP.get(op);
  if (!d) throw new Error(`unknown opcode ${op}`);
  return d;
}

export function shapeOf(op: Opcode): Shape {
  return defOf(op).shape;
}

export function isReporter(op: Opcode): boolean {
  const s = shapeOf(op);
  return s === "reporter" || s === "boolean";
}

export function isBoolean(op: Opcode): boolean {
  return shapeOf(op) === "boolean";
}

export function isHat(_op: Opcode): boolean {
  return false;
}

export function canHaveNext(op: Opcode): boolean {
  const s = shapeOf(op);
  return s === "stack" || s === "c" || s === "c2";
}

export function canSnapToStack(op: Opcode): boolean {
  const s = shapeOf(op);
  return s === "stack" || s === "c" || s === "c2" || s === "cap";
}

export function createBlock(op: Opcode, extra?: Record<string, string>): Block {
  const def = defOf(op);
  const args: Record<string, Value> = {};
  for (const p of def.parts) {
    if (p.t === "num" || p.t === "str") args[p.name] = lit(p.def);
    if (p.t === "menu") args[p.name] = lit(p.options[0]?.value ?? "");
    if (p.t === "var") args[p.name] = lit(extra?.VAR ?? "");
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) args[k] = lit(v);
  }
  return { id: nid(), op, args };
}

export function chain(...blocks: Block[]): Block {
  for (let i = 0; i < blocks.length - 1; i++) {
    blocks[i]!.next = blocks[i + 1];
  }
  return blocks[0]!;
}

/** Method bodies get the same palette as update (input + motion + oo). */
export function defsForPhase(
  phase: "boot" | "update" | "draw" | "method",
): BlockDef[] {
  const p = phase === "method" ? "update" : phase;
  return DEFS.filter((d) => !d.phases || d.phases.includes(p));
}
