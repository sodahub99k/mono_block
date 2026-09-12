import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { defOf, shapeOf } from "./catalog";
import type { Part } from "./catalog";
import type { Block, Project } from "../project/types";
import "./BlockView.css";

type Props = {
  block: Block;
  project: Project;
  spriteId: string;
  scriptId?: string;
  onPointerDown: (
    e: ReactPointerEvent<HTMLDivElement>,
    block: Block,
    scriptId?: string,
  ) => void;
  onArgChange: (blockId: string, name: string, value: string) => void;
};

export function BlockView({
  block,
  project,
  spriteId,
  scriptId,
  onPointerDown,
  onArgChange,
}: Props) {
  const def = defOf(block.op);
  const shape = shapeOf(block.op);
  const style = { "--blk": def.color } as CSSProperties;
  const hasMouth = shape === "c" || shape === "c2";
  const hasNextBump =
    shape !== "cap" && shape !== "reporter" && shape !== "boolean";

  return (
    <div className="blk-col">
      <div
        className={`blk blk-${shape}`}
        style={style}
        data-block-id={block.id}
        onPointerDown={(e) => onPointerDown(e, block, scriptId)}
      >
        <div className="blk-head">
          {def.parts.map((p, i) => (
            <PartView
              key={i}
              part={p}
              block={block}
              project={project}
              spriteId={spriteId}
              scriptId={scriptId}
              onPointerDown={onPointerDown}
              onArgChange={onArgChange}
            />
          ))}
        </div>
        {hasMouth && (
          <div className="blk-mouth-row">
            <div className="blk-arm" />
            <div
              className="blk-mouth"
              data-conn="substk"
              data-block-id={block.id}
            >
              {block.substk ? (
                <BlockView
                  block={block.substk}
                  project={project}
                  spriteId={spriteId}
                  scriptId={scriptId}
                  onPointerDown={onPointerDown}
                  onArgChange={onArgChange}
                />
              ) : (
                <div className="blk-placeholder" />
              )}
            </div>
          </div>
        )}
        {shape === "c2" && (
          <>
            <div className="blk-mid">
              {(def.elseParts ?? []).map((p, i) => (
                <PartView
                  key={i}
                  part={p}
                  block={block}
                  project={project}
                  spriteId={spriteId}
                  scriptId={scriptId}
                  onPointerDown={onPointerDown}
                  onArgChange={onArgChange}
                />
              ))}
            </div>
            <div className="blk-mouth-row">
              <div className="blk-arm" />
              <div
                className="blk-mouth"
                data-conn="substk2"
                data-block-id={block.id}
              >
                {block.substk2 ? (
                  <BlockView
                    block={block.substk2}
                    project={project}
                    spriteId={spriteId}
                    scriptId={scriptId}
                    onPointerDown={onPointerDown}
                    onArgChange={onArgChange}
                  />
                ) : (
                  <div className="blk-placeholder" />
                )}
              </div>
            </div>
          </>
        )}
        {(shape === "c" || shape === "c2") && (
          <div className="blk-foot">
            {hasNextBump && (
              <span className="blk-bump" data-conn="next" data-block-id={block.id} />
            )}
          </div>
        )}
        {shape !== "c" && shape !== "c2" && hasNextBump && (
          <span className="blk-bump" data-conn="next" data-block-id={block.id} />
        )}
        {shape !== "reporter" && shape !== "boolean" ? (
          <span className="blk-notch" />
        ) : null}
      </div>
      {block.next && (
        <BlockView
          block={block.next}
          project={project}
          spriteId={spriteId}
          scriptId={scriptId}
          onPointerDown={onPointerDown}
          onArgChange={onArgChange}
        />
      )}
    </div>
  );
}

function PartView({
  part,
  block,
  project,
  spriteId,
  scriptId,
  onPointerDown,
  onArgChange,
}: {
  part: Part;
  block: Block;
  project: Project;
  spriteId: string;
  scriptId?: string;
  onPointerDown: Props["onPointerDown"];
  onArgChange: Props["onArgChange"];
}) {
  if (part.t === "text") return <span className="blk-text">{part.s}</span>;

  const nested = block.args[part.name];
  if (nested?.kind === "block") {
    return (
      <span
        className={`blk-slot blk-slot-${part.t === "bool" ? "bool" : "val"}`}
        data-conn={`arg:${part.name}`}
        data-block-id={block.id}
      >
        <BlockView
          block={nested.block}
          project={project}
          spriteId={spriteId}
          scriptId={scriptId}
          onPointerDown={onPointerDown}
          onArgChange={onArgChange}
        />
      </span>
    );
  }

  if (part.t === "bool") {
    return (
      <span
        className="blk-slot blk-slot-bool blk-empty-bool"
        data-conn={`arg:${part.name}`}
        data-block-id={block.id}
      />
    );
  }

  if (part.t === "num" || part.t === "str") {
    const v = nested?.kind === "literal" ? nested.value : part.def;
    return (
      <span
        className="blk-slot blk-slot-val"
        data-conn={`arg:${part.name}`}
        data-block-id={block.id}
      >
        <input
          className={`blk-input ${part.t === "str" ? "blk-input-str" : ""}`}
          value={v}
          onChange={(e) => onArgChange(block.id, part.name, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </span>
    );
  }

  if (part.t === "menu") {
    const options =
      part.name === "TARGET"
        ? [
            { value: "edge", label: "端" },
            { value: "mouse", label: "マウスのポインター" },
            ...project.entities.map((s) => ({ value: s.name, label: s.name })),
          ]
        : part.options;
    const v = nested?.kind === "literal" ? nested.value : options[0]?.value ?? "";
    return (
      <select
        className="blk-select"
        value={v}
        onChange={(e) => onArgChange(block.id, part.name, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  const vars = project.variables;
  const v = nested?.kind === "literal" ? nested.value : vars[0]?.name ?? "";
  return (
    <select
      className="blk-select"
      value={v}
      onChange={(e) => onArgChange(block.id, part.name, e.target.value)}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {vars.length === 0 && <option value="">(変数なし)</option>}
      {vars.map((vr) => (
        <option key={vr.id} value={vr.name}>
          {vr.name}
        </option>
      ))}
    </select>
  );
}
