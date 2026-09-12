import { chain, createBlock } from "../blocks/catalog";
import type {
  Block,
  Costume,
  CostumeKind,
  Entity,
  Project,
  Script,
  Variable,
} from "./types";
import { nid } from "./types";

function costume(kind: CostumeKind, name: string): Costume {
  return { id: nid(), name, kind };
}

function entity(
  name: string,
  tag: string,
  kind: CostumeKind,
  extra: Partial<Entity> = {},
): Entity {
  return {
    id: nid(),
    name,
    tag,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    direction: 90,
    size: 100,
    visible: true,
    costumes: [costume(kind, name)],
    costumeIndex: 0,
    ...extra,
  };
}

function script(top: Block, x = 24, y = 24): Script {
  return { id: nid(), x, y, top };
}

function withEntity(name: string, body: Block): Block {
  const w = createBlock("entity_with", { NAME: name });
  w.substk = body;
  return w;
}

function foreachTag(tag: string, body: Block): Block {
  const w = createBlock("entity_foreach", { TAG: tag });
  w.substk = body;
  return w;
}

function ifKey(key: string, body: Block): Block {
  const iff = createBlock("control_if");
  iff.args.COND = {
    kind: "block",
    block: createBlock("input_key_down", { KEY: key }),
  };
  iff.substk = body;
  return iff;
}

/** Bounce with velocity — one update loop. */
export function bouncingProject(): Project {
  const boot = script(
    withEntity(
      "ball",
      chain(
        createBlock("motion_set_vx", { VX: "140" }),
        createBlock("motion_set_vy", { VY: "100" }),
      ),
    ),
  );

  const spin = createBlock("motion_point");
  spin.args.DIRECTION = {
    kind: "block",
    block: (() => {
      const mul = createBlock("operator_mul", { B: "6" });
      mul.args.A = { kind: "block", block: createBlock("game_frame") };
      return mul;
    })(),
  };

  const update = script(
    chain(
      withEntity(
        "ball",
        chain(
          createBlock("motion_apply_velocity"),
          createBlock("motion_bounce_edges"),
        ),
      ),
      withEntity("star", spin),
    ),
  );

  return {
    version: 2,
    name: "バウンス",
    backdrop: "sky",
    variables: [],
    entities: [
      entity("ball", "ball", "ball", { x: -40, y: 0 }),
      entity("star", "decor", "star", { x: 120, y: 40, size: 80 }),
    ],
    boot: [boot],
    update: [update],
    draw: [],
  };
}

export function keyboardProject(): Project {
  const speed = "180";
  const update = script(
    withEntity(
      "ship",
      chain(
        createBlock("motion_set_vx", { VX: "0" }),
        createBlock("motion_set_vy", { VY: "0" }),
        ifKey("left", createBlock("motion_set_vx", { VX: `-${speed}` })),
        ifKey("right", createBlock("motion_set_vx", { VX: speed })),
        ifKey("down", createBlock("motion_set_vy", { VY: `-${speed}` })),
        ifKey("up", createBlock("motion_set_vy", { VY: speed })),
        createBlock("motion_apply_velocity"),
        createBlock("motion_bounce_edges"),
      ),
    ),
  );

  return {
    version: 2,
    name: "キーボード操作",
    backdrop: "grid",
    variables: [],
    entities: [entity("ship", "player", "rocket")],
    boot: [],
    update: [update],
    draw: [],
  };
}

export function collectProject(): Project {
  const score: Variable = {
    id: nid(),
    name: "スコア",
    value: 0,
    visible: true,
  };

  const boot = script(createBlock("data_set", { VAR: "スコア", VALUE: "0" }));

  const playerMove = withEntity(
    "player",
    chain(
      createBlock("motion_set_vx", { VX: "0" }),
      createBlock("motion_set_vy", { VY: "0" }),
      ifKey("left", createBlock("motion_set_vx", { VX: "-160" })),
      ifKey("right", createBlock("motion_set_vx", { VX: "160" })),
      ifKey("down", createBlock("motion_set_vy", { VY: "-160" })),
      ifKey("up", createBlock("motion_set_vy", { VY: "160" })),
      createBlock("motion_apply_velocity"),
    ),
  );

  const coinHit = createBlock("control_if");
  coinHit.args.COND = {
    kind: "block",
    block: createBlock("sensing_touching_tag", { TAG: "player" }),
  };
  const gx = createBlock("motion_setx");
  gx.args.X = {
    kind: "block",
    block: createBlock("operator_random", { FROM: "-200", TO: "200" }),
  };
  const gy = createBlock("motion_sety");
  gy.args.Y = {
    kind: "block",
    block: createBlock("operator_random", { FROM: "-140", TO: "140" }),
  };
  coinHit.substk = chain(
    createBlock("data_change", { VAR: "スコア", VALUE: "1" }),
    gx,
    gy,
  );

  const update = script(chain(playerMove, foreachTag("coin", coinHit)));

  const draw = script(
    createBlock("draw_text", {
      TEXT: "矢印キーで操作",
      X: "-220",
      Y: "155",
    }),
  );

  return {
    version: 2,
    name: "スター集め",
    backdrop: "space",
    variables: [score],
    entities: [
      entity("player", "player", "cat", { x: 0, y: -40 }),
      entity("coin", "coin", "star", { x: 80, y: 80, size: 70 }),
    ],
    boot: [boot],
    update: [update],
    draw: [draw],
  };
}

export const EXAMPLES: { id: string; label: string; make: () => Project }[] = [
  { id: "bounce", label: "バウンス", make: bouncingProject },
  { id: "keys", label: "キーボード操作", make: keyboardProject },
  { id: "collect", label: "スター集め", make: collectProject },
];

export function emptyEntity(
  kind: CostumeKind,
  name: string,
  index: number,
): Entity {
  const tags: Record<CostumeKind, string> = {
    cat: "player",
    ball: "ball",
    star: "coin",
    cube: "block",
    ghost: "enemy",
    rocket: "ship",
  };
  return entity(name, tags[kind], kind, {
    x: (index % 3) * 60 - 60,
    y: Math.floor(index / 3) * 40,
  });
}

export function emptyProject(): Project {
  return {
    version: 2,
    name: "無題",
    backdrop: "sky",
    variables: [],
    entities: [entity("player", "player", "cat")],
    boot: [],
    update: [],
    draw: [],
  };
}
