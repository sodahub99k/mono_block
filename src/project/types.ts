export const STAGE_W = 480;
export const STAGE_H = 360;

export type Opcode =
  | "event_flag"
  | "event_clicked"
  | "event_key"
  | "motion_move"
  | "motion_turn_right"
  | "motion_turn_left"
  | "motion_point"
  | "motion_gotoxy"
  | "motion_goto_random"
  | "motion_changex"
  | "motion_changey"
  | "motion_setx"
  | "motion_sety"
  | "motion_bounce"
  | "looks_say"
  | "looks_show"
  | "looks_hide"
  | "looks_setsizeto"
  | "looks_changesize"
  | "looks_nextcostume"
  | "sound_beep"
  | "control_wait"
  | "control_repeat"
  | "control_forever"
  | "control_if"
  | "control_if_else"
  | "control_stop"
  | "sensing_keypressed"
  | "sensing_touching"
  | "sensing_mousex"
  | "sensing_mousey"
  | "operator_add"
  | "operator_sub"
  | "operator_mul"
  | "operator_div"
  | "operator_random"
  | "operator_gt"
  | "operator_lt"
  | "operator_eq"
  | "operator_and"
  | "operator_or"
  | "operator_not"
  | "data_set"
  | "data_change"
  | "data_show"
  | "data_hide"
  | "data_variable";

export type Category =
  | "motion"
  | "looks"
  | "sound"
  | "events"
  | "control"
  | "sensing"
  | "operators"
  | "variables";

export type Shape =
  | "hat"
  | "stack"
  | "c"
  | "c2"
  | "ccap"
  | "cap"
  | "reporter"
  | "boolean";

export type Value =
  | { kind: "literal"; value: string }
  | { kind: "block"; block: Block };

export type Block = {
  id: string;
  op: Opcode;
  args: Record<string, Value>;
  next?: Block;
  substk?: Block;
  substk2?: Block;
};

export type Script = {
  id: string;
  x: number;
  y: number;
  top: Block;
};

export type CostumeKind = "cat" | "ball" | "star" | "cube" | "ghost" | "rocket";

export type Costume = {
  id: string;
  name: string;
  kind: CostumeKind;
};

export type Sprite = {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: number;
  size: number;
  visible: boolean;
  costumes: Costume[];
  costumeIndex: number;
  scripts: Script[];
};

export type Variable = {
  id: string;
  name: string;
  value: number;
  visible: boolean;
};

export type BackdropId = "sky" | "space" | "room" | "grid";

export type Project = {
  name: string;
  backdrop: BackdropId;
  sprites: Sprite[];
  variables: Variable[];
};

export function nid(): string {
  return crypto.randomUUID();
}

export function lit(value: string | number): Value {
  return { kind: "literal", value: String(value) };
}
