export const STAGE_W = 480;
export const STAGE_H = 360;
export const FIXED_DT = 1 / 60;

export type PhaseId = "boot" | "update" | "draw";

export type Opcode =
  // game / time
  | "game_dt"
  | "game_frame"
  | "game_stop"
  // input (polling)
  | "input_key_down"
  | "input_key_pressed"
  | "input_mouse_x"
  | "input_mouse_y"
  // entity selection / iteration
  | "entity_with"
  | "entity_foreach"
  | "entity_destroy"
  | "entity_name"
  | "entity_tag"
  // motion (current entity)
  | "motion_setx"
  | "motion_sety"
  | "motion_changex"
  | "motion_changey"
  | "motion_set_vx"
  | "motion_set_vy"
  | "motion_change_vx"
  | "motion_change_vy"
  | "motion_apply_velocity"
  | "motion_gotoxy"
  | "motion_point"
  | "motion_bounce_edges"
  | "motion_x"
  | "motion_y"
  | "motion_vx"
  | "motion_vy"
  // looks
  | "looks_show"
  | "looks_hide"
  | "looks_setsizeto"
  | "looks_nextcostume"
  // draw (draw phase / HUD)
  | "draw_text"
  | "draw_clear_overlay"
  // control (no forever / wait)
  | "control_if"
  | "control_if_else"
  | "control_repeat"
  // sensing
  | "sensing_touching_tag"
  | "sensing_touching_edge"
  // operators
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
  // variables
  | "data_set"
  | "data_change"
  | "data_show"
  | "data_hide"
  | "data_variable";

export type Shape =
  | "stack"
  | "c"
  | "c2"
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

/** Pure data — no scripts. */
export type Entity = {
  id: string;
  name: string;
  tag: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  direction: number;
  size: number;
  visible: boolean;
  costumes: Costume[];
  costumeIndex: number;
};

export type Variable = {
  id: string;
  name: string;
  value: number;
  visible: boolean;
};

export type BackdropId = "sky" | "space" | "room" | "grid";

export type Project = {
  version: 2;
  name: string;
  backdrop: BackdropId;
  entities: Entity[];
  variables: Variable[];
  boot: Script[];
  update: Script[];
  draw: Script[];
};

export function nid(): string {
  return crypto.randomUUID();
}

export function lit(value: string | number): Value {
  return { kind: "literal", value: String(value) };
}

export function emptyPhases(): Pick<Project, "boot" | "update" | "draw"> {
  return { boot: [], update: [], draw: [] };
}
