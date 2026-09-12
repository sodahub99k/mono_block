import { chain, createBlock } from "../blocks/catalog";
import type {
  Block,
  Costume,
  CostumeKind,
  Project,
  Sprite,
  Variable,
} from "./types";
import { nid } from "./types";

function costume(kind: CostumeKind, name: string): Costume {
  return { id: nid(), name, kind };
}

function sprite(
  name: string,
  kind: CostumeKind,
  extra: Partial<Sprite> & { scripts: Sprite["scripts"] },
): Sprite {
  return {
    id: nid(),
    name,
    x: 0,
    y: 0,
    direction: 90,
    size: 100,
    visible: true,
    costumes: [costume(kind, name)],
    costumeIndex: 0,
    ...extra,
  };
}

function hatFlag(next?: Block): Block {
  const b = createBlock("event_flag");
  b.next = next;
  return b;
}

export function bouncingProject(): Project {
  const catScript = hatFlag(
    chain(
      createBlock("looks_say", { SECS: "0.6" }),
      (() => {
        const forever = createBlock("control_forever");
        forever.substk = chain(
          createBlock("motion_move", { STEPS: "8" }),
          createBlock("motion_bounce"),
        );
        return forever;
      })(),
    ),
  );

  const starScript = hatFlag(
    (() => {
      const forever = createBlock("control_forever");
      forever.substk = chain(
        createBlock("motion_turn_right", { DEGREES: "6" }),
        createBlock("control_wait", { SECS: "0.05" }),
      );
      return forever;
    })(),
  );

  return {
    name: "バウンス",
    backdrop: "sky",
    variables: [],
    sprites: [
      sprite("ネコ", "cat", {
        x: -40,
        y: 0,
        scripts: [{ id: nid(), x: 24, y: 24, top: catScript }],
      }),
      sprite("スター", "star", {
        x: 120,
        y: 40,
        size: 80,
        scripts: [{ id: nid(), x: 24, y: 24, top: starScript }],
      }),
    ],
  };
}

export function keyboardProject(): Project {
  const move = (key: string, dx: string, dy: string): Block => {
    const iff = createBlock("control_if");
    iff.args.COND = {
      kind: "block",
      block: createBlock("sensing_keypressed", { KEY: key }),
    };
    const parts: Block[] = [];
    if (dx !== "0") parts.push(createBlock("motion_changex", { DX: dx }));
    if (dy !== "0") parts.push(createBlock("motion_changey", { DY: dy }));
    iff.substk = parts.length ? chain(...parts) : undefined;
    return iff;
  };

  const forever = createBlock("control_forever");
  forever.substk = chain(
    move("right", "8", "0"),
    move("left", "-8", "0"),
    move("up", "0", "8"),
    move("down", "0", "-8"),
    createBlock("motion_bounce"),
  );

  return {
    name: "キーボード操作",
    backdrop: "grid",
    variables: [],
    sprites: [
      sprite("ロケット", "rocket", {
        x: 0,
        y: 0,
        scripts: [{ id: nid(), x: 24, y: 24, top: hatFlag(forever) }],
      }),
    ],
  };
}

export function collectProject(): Project {
  const score: Variable = {
    id: nid(),
    name: "スコア",
    value: 0,
    visible: true,
  };

  const playerForever = createBlock("control_forever");
  const right = createBlock("control_if");
  right.args.COND = {
    kind: "block",
    block: createBlock("sensing_keypressed", { KEY: "right" }),
  };
  right.substk = createBlock("motion_changex", { DX: "7" });
  const left = createBlock("control_if");
  left.args.COND = {
    kind: "block",
    block: createBlock("sensing_keypressed", { KEY: "left" }),
  };
  left.substk = createBlock("motion_changex", { DX: "-7" });
  const up = createBlock("control_if");
  up.args.COND = {
    kind: "block",
    block: createBlock("sensing_keypressed", { KEY: "up" }),
  };
  up.substk = createBlock("motion_changey", { DY: "7" });
  const down = createBlock("control_if");
  down.args.COND = {
    kind: "block",
    block: createBlock("sensing_keypressed", { KEY: "down" }),
  };
  down.substk = createBlock("motion_changey", { DY: "-7" });
  playerForever.substk = chain(right, left, up, down);

  const coinIf = createBlock("control_if");
  coinIf.args.COND = {
    kind: "block",
    block: createBlock("sensing_touching", { TARGET: "ネコ" }),
  };
  const ding = createBlock("sound_beep", { FREQ: "880", SECS: "0.08" });
  const bump = createBlock("data_change", { VAR: "スコア", VALUE: "1" });
  const jump = createBlock("motion_goto_random");
  coinIf.substk = chain(ding, bump, jump);
  const coinForever = createBlock("control_forever");
  coinForever.substk = coinIf;

  const reset = createBlock("data_set", { VAR: "スコア", VALUE: "0" });

  return {
    name: "スター集め",
    backdrop: "space",
    variables: [score],
    sprites: [
      sprite("ネコ", "cat", {
        x: 0,
        y: -40,
        scripts: [{ id: nid(), x: 24, y: 24, top: hatFlag(playerForever) }],
      }),
      sprite("スター", "star", {
        x: 80,
        y: 80,
        size: 70,
        scripts: [
          {
            id: nid(),
            x: 24,
            y: 24,
            top: hatFlag(chain(reset, coinForever)),
          },
        ],
      }),
    ],
  };
}

export const EXAMPLES: { id: string; label: string; make: () => Project }[] = [
  { id: "bounce", label: "バウンス", make: bouncingProject },
  { id: "keys", label: "キーボード操作", make: keyboardProject },
  { id: "collect", label: "スター集め", make: collectProject },
];

export function emptySprite(kind: CostumeKind, name: string, index: number): Sprite {
  return sprite(name, kind, {
    x: (index % 3) * 60 - 60,
    y: Math.floor(index / 3) * 40,
    scripts: [],
  });
}

export function emptyProject(): Project {
  return {
    name: "無題",
    backdrop: "sky",
    variables: [],
    sprites: [
      sprite("ネコ", "cat", {
        scripts: [],
      }),
    ],
  };
}
