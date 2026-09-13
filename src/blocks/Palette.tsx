import {
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { BlockView } from "./BlockView";
import {
  CATEGORY_LABEL,
  COLORS,
  createBlock,
  defsForPhase,
  type CategoryId,
} from "./catalog";
import type { Opcode, PhaseId, Project } from "../project/types";

type PalettePhase = PhaseId | "method";

type Props = {
  project: Project;
  phase: PalettePhase;
  onBeginDrag: (
    e: ReactPointerEvent,
    op: Opcode,
    extra?: Record<string, string>,
  ) => void;
  onAddVariable: (name: string) => void;
};

const ORDER: CategoryId[] = [
  "game",
  "input",
  "entity",
  "oo",
  "motion",
  "looks",
  "draw",
  "control",
  "sensing",
  "operators",
  "variables",
];

export function Palette({
  project,
  phase,
  onBeginDrag,
  onAddVariable,
}: Props) {
  const [cat, setCat] = useState<CategoryId>("entity");
  const defaultVar = project.variables[0]?.name;

  const availableCats = useMemo(() => {
    const defs = defsForPhase(phase);
    return ORDER.filter((id) => defs.some((d) => d.category === id));
  }, [phase]);

  const activeCat = availableCats.includes(cat)
    ? cat
    : (availableCats[0] ?? "control");

  const defs = useMemo(
    () =>
      defsForPhase(phase).filter((d) => {
        if (d.category !== activeCat) return false;
        if (d.op === "data_variable") return false;
        if (
          (d.op === "data_set" ||
            d.op === "data_change" ||
            d.op === "data_show" ||
            d.op === "data_hide") &&
          project.variables.length === 0
        ) {
          return false;
        }
        return true;
      }),
    [phase, activeCat, project.variables.length],
  );

  const prototypes = useMemo(
    () =>
      defs.map((d) => ({
        op: d.op,
        block: createBlock(
          d.op,
          d.op.startsWith("data_") && defaultVar
            ? { VAR: defaultVar }
            : undefined,
        ),
        extra:
          d.op.startsWith("data_") && defaultVar
            ? { VAR: defaultVar }
            : undefined,
      })),
    [defs, defaultVar],
  );

  const varReporters = useMemo(
    () =>
      project.variables.map((v) => ({
        id: v.id,
        name: v.name,
        block: createBlock("data_variable", { VAR: v.name }),
      })),
    [project.variables],
  );

  return (
    <aside className="palette">
      <div className="palette-cats" role="tablist" aria-label="ブロックの種類">
        {availableCats.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeCat === id}
            className={`cat ${activeCat === id ? "is-active" : ""}`}
            style={{ "--cat": COLORS[id] } as CSSProperties}
            onClick={() => setCat(id)}
          >
            <span className="cat-dot" />
            {CATEGORY_LABEL[id]}
          </button>
        ))}
      </div>
      <div className="palette-list">
        {activeCat === "variables" && (
          <div className="var-tools">
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                const name = window.prompt("変数の名前", "スコア");
                if (name && name.trim()) onAddVariable(name.trim());
              }}
            >
              変数を作る
            </button>
            {varReporters.map((v) => (
              <div key={v.id} className="palette-proto">
                <BlockView
                  block={v.block}
                  project={project}
                  spriteId=""
                  onPointerDown={(e) =>
                    onBeginDrag(e, "data_variable", { VAR: v.name })
                  }
                  onArgChange={() => {}}
                />
              </div>
            ))}
          </div>
        )}
        {prototypes.map((p) => (
          <div key={p.op} className="palette-proto">
            <BlockView
              block={p.block}
              project={project}
              spriteId=""
              onPointerDown={(e) => onBeginDrag(e, p.op, p.extra)}
              onArgChange={() => {}}
            />
          </div>
        ))}
        {activeCat === "variables" && project.variables.length === 0 && (
          <p className="palette-hint">
            変数を作ると、セット／変化ブロックが出ます。
          </p>
        )}
      </div>
    </aside>
  );
}
