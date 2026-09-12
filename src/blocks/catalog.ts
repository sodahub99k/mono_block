import type { Block, Opcode, Shape, Value } from "../project/types";
import { lit, nid } from "../project/types";

export type CategoryId =
  | "motion"
  | "looks"
  | "sound"
  | "events"
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
};

export const COLORS: Record<CategoryId, string> = {
  motion: "#4C97FF",
  looks: "#9966FF",
  sound: "#CF63CF",
  events: "#FFBF00",
  control: "#FFAB19",
  sensing: "#5CB1D6",
  operators: "#59C059",
  variables: "#FF8C1A",
};

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  motion: "動き",
  looks: "見た目",
  sound: "音",
  events: "イベント",
  control: "制御",
  sensing: "調べる",
  operators: "演算",
  variables: "変数",
};

export const KEY_OPTIONS = [
  { value: "space", label: "スペース" },
  { value: "up", label: "上向き矢印" },
  { value: "down", label: "下向き矢印" },
  { value: "left", label: "左向き矢印" },
  { value: "right", label: "右向き矢印" },
  { value: "a", label: "a" },
  { value: "b", label: "b" },
  { value: "w", label: "w" },
  { value: "s", label: "s" },
  { value: "d", label: "d" },
] as const;

export const DEFS: BlockDef[] = [
  {
    op: "event_flag",
    category: "events",
    shape: "hat",
    color: COLORS.events,
    parts: [{ t: "text", s: "旗が押されたとき" }],
  },
  {
    op: "event_clicked",
    category: "events",
    shape: "hat",
    color: COLORS.events,
    parts: [{ t: "text", s: "このスプライトがクリックされたとき" }],
  },
  {
    op: "event_key",
    category: "events",
    shape: "hat",
    color: COLORS.events,
    parts: [
      { t: "menu", name: "KEY", options: [...KEY_OPTIONS] },
      { t: "text", s: "キーが押されたとき" },
    ],
  },
  {
    op: "motion_move",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "num", name: "STEPS", def: "10" },
      { t: "text", s: "歩動かす" },
    ],
  },
  {
    op: "motion_turn_right",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "右に" },
      { t: "num", name: "DEGREES", def: "15" },
      { t: "text", s: "度回す" },
    ],
  },
  {
    op: "motion_turn_left",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "左に" },
      { t: "num", name: "DEGREES", def: "15" },
      { t: "text", s: "度回す" },
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
    op: "motion_gotoxy",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "x座標を" },
      { t: "num", name: "X", def: "0" },
      { t: "text", s: "、y座標を" },
      { t: "num", name: "Y", def: "0" },
      { t: "text", s: "にする" },
    ],
  },
  {
    op: "motion_goto_random",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [{ t: "text", s: "どこかの場所へ行く" }],
  },
  {
    op: "motion_changex",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "x座標を" },
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
      { t: "text", s: "y座標を" },
      { t: "num", name: "DY", def: "10" },
      { t: "text", s: "ずつ変える" },
    ],
  },
  {
    op: "motion_setx",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [
      { t: "text", s: "x座標を" },
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
      { t: "text", s: "y座標を" },
      { t: "num", name: "Y", def: "0" },
      { t: "text", s: "にする" },
    ],
  },
  {
    op: "motion_bounce",
    category: "motion",
    shape: "stack",
    color: COLORS.motion,
    parts: [{ t: "text", s: "端に触れたら跳ね返る" }],
  },
  {
    op: "looks_say",
    category: "looks",
    shape: "stack",
    color: COLORS.looks,
    parts: [
      { t: "str", name: "MESSAGE", def: "こんにちは!" },
      { t: "text", s: "と" },
      { t: "num", name: "SECS", def: "2" },
      { t: "text", s: "秒言う" },
    ],
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
    op: "looks_changesize",
    category: "looks",
    shape: "stack",
    color: COLORS.looks,
    parts: [
      { t: "text", s: "大きさを" },
      { t: "num", name: "SIZE", def: "10" },
      { t: "text", s: "ずつ変える" },
    ],
  },
  {
    op: "looks_nextcostume",
    category: "looks",
    shape: "stack",
    color: COLORS.looks,
    parts: [{ t: "text", s: "次のコスチュームにする" }],
  },
  {
    op: "sound_beep",
    category: "sound",
    shape: "stack",
    color: COLORS.sound,
    parts: [
      { t: "num", name: "FREQ", def: "440" },
      { t: "text", s: "Hz の音を" },
      { t: "num", name: "SECS", def: "0.2" },
      { t: "text", s: "秒鳴らす" },
    ],
  },
  {
    op: "control_wait",
    category: "control",
    shape: "stack",
    color: COLORS.control,
    parts: [
      { t: "num", name: "SECS", def: "1" },
      { t: "text", s: "秒待つ" },
    ],
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
    op: "control_forever",
    category: "control",
    shape: "ccap",
    color: COLORS.control,
    parts: [{ t: "text", s: "ずっと" }],
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
    op: "control_stop",
    category: "control",
    shape: "cap",
    color: COLORS.control,
    parts: [{ t: "text", s: "すべてを止める" }],
  },
  {
    op: "sensing_keypressed",
    category: "sensing",
    shape: "boolean",
    color: COLORS.sensing,
    parts: [
      { t: "menu", name: "KEY", options: [...KEY_OPTIONS] },
      { t: "text", s: "キーが押された" },
    ],
  },
  {
    op: "sensing_touching",
    category: "sensing",
    shape: "boolean",
    color: COLORS.sensing,
    parts: [
      { t: "menu", name: "TARGET", options: [{ value: "edge", label: "端" }] },
      { t: "text", s: "に触れた" },
    ],
  },
  {
    op: "sensing_mousex",
    category: "sensing",
    shape: "reporter",
    color: COLORS.sensing,
    parts: [{ t: "text", s: "マウスのx座標" }],
  },
  {
    op: "sensing_mousey",
    category: "sensing",
    shape: "reporter",
    color: COLORS.sensing,
    parts: [{ t: "text", s: "マウスのy座標" }],
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
      { t: "text", s: "から" },
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

export function isHat(op: Opcode): boolean {
  return shapeOf(op) === "hat";
}

export function canHaveNext(op: Opcode): boolean {
  const s = shapeOf(op);
  return s === "stack" || s === "c" || s === "c2" || s === "hat";
}

export function canSnapToStack(op: Opcode): boolean {
  const s = shapeOf(op);
  return (
    s === "stack" || s === "c" || s === "c2" || s === "ccap" || s === "cap"
  );
}

export function createBlock(op: Opcode, extra?: Record<string, string>): Block {
  const def = defOf(op);
  const args: Record<string, Value> = {};
  for (const p of def.parts) {
    if (p.t === "num" || p.t === "str") args[p.name] = lit(p.def);
    if (p.t === "menu") args[p.name] = lit(p.options[0]?.value ?? "");
    if (p.t === "var") args[p.name] = lit(extra?.VAR ?? "");
    if (p.t === "bool") {
      /* empty slot */
    }
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
