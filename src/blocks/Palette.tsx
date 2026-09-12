import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { BlockView } from "./BlockView";
import {
  CATEGORY_LABEL,
  COLORS,
  DEFS,
  createBlock,
  type CategoryId,
} from "./catalog";
import type { Opcode, Project } from "../project/types";

type Props = {
  project: Project;
  onBeginDrag: (
    e: ReactPointerEvent,
    op: Opcode,
    extra?: Record<string, string>,
  ) => void;
  onAddVariable: (name: string) => void;
};

const ORDER: CategoryId[] = [
  "motion",
  "looks",
  "sound",
  "events",
  "control",
  "sensing",
  "operators",
  "variables",
];

export function Palette({ project, onBeginDrag, onAddVariable }: Props) {
  const [cat, setCat] = useState<CategoryId>("events");

  const defs = DEFS.filter((d) => {
    if (d.category !== cat) return false;
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
  });

  return (
    <aside className="palette">
      <div className="palette-cats" role="tablist" aria-label="ブロックの種類">
        {ORDER.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={cat === id}
            className={`cat ${cat === id ? "is-active" : ""}`}
            style={{ "--cat": COLORS[id] } as CSSProperties}
            onClick={() => setCat(id)}
          >
            <span className="cat-dot" />
            {CATEGORY_LABEL[id]}
          </button>
        ))}
      </div>
      <div className="palette-list">
        {cat === "variables" && (
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
            {project.variables.map((v) => (
              <div key={v.id} className="palette-proto">
                <BlockView
                  block={createBlock("data_variable", { VAR: v.name })}
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
        {defs.map((d) => (
          <div key={d.op} className="palette-proto">
            <BlockView
              block={createBlock(
                d.op,
                d.op.startsWith("data_") && project.variables[0]
                  ? { VAR: project.variables[0].name }
                  : undefined,
              )}
              project={project}
              spriteId=""
              onPointerDown={(e) =>
                onBeginDrag(
                  e,
                  d.op,
                  d.op.startsWith("data_") && project.variables[0]
                    ? { VAR: project.variables[0].name }
                    : undefined,
                )
              }
              onArgChange={() => {}}
            />
          </div>
        ))}
        {cat === "variables" && project.variables.length === 0 && (
          <p className="palette-hint">変数を作ると、セット／変化ブロックが出ます。</p>
        )}
      </div>
    </aside>
  );
}
