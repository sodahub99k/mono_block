import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { BlockView } from "./BlockView";
import { Palette } from "./Palette";
import {
  canHaveNext,
  canSnapToStack,
  createBlock,
  isBoolean,
  isReporter,
} from "./catalog";
import type { Opcode } from "../project/types";
import type { Block, Project, Script } from "../project/types";
import { nid } from "../project/types";
import {
  attachTo,
  collectIds,
  detachFromScript,
  findOp,
  setArgLiteral,
  type ConnSlot,
} from "./tree";

type Snap = {
  scriptId: string;
  hostId: string;
  slot: ConnSlot;
};

type Ghost = {
  block: Block;
  x: number;
  y: number;
};

type Props = {
  project: Project;
  phase: import("../project/types").PhaseId;
  scripts: Script[];
  onChangeScripts: (scripts: Script[]) => void;
  onAddVariable: (name: string) => void;
};

const SNAP_RADIUS = 32;

export function BlockEditor({
  project,
  phase,
  scripts,
  onChangeScripts,
  onAddVariable,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scriptsRef = useRef<Script[]>(scripts);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const ghostRef = useRef<Ghost | null>(null);
  const dragIdsRef = useRef<Set<string>>(new Set());
  const offsetRef = useRef({ x: 16, y: 10 });
  const snapRef = useRef<Snap | null>(null);

  scriptsRef.current = scripts;

  useEffect(() => {
    ghostRef.current = ghost;
  }, [ghost]);

  function commit(next: Script[]): void {
    scriptsRef.current = next;
    onChangeScripts(next);
  }

  function workspacePoint(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } {
    const el = scrollerRef.current;
    if (!el) return { x: clientX, y: clientY };
    const r = el.getBoundingClientRect();
    return {
      x: clientX - r.left + el.scrollLeft,
      y: clientY - r.top + el.scrollTop,
    };
  }

  function findSnapAt(
    clientX: number,
    clientY: number,
    dragging: Block,
  ): Snap | null {
    const reporter = isReporter(dragging.op);
    const booleanRep = isBoolean(dragging.op);
    const stackable = canSnapToStack(dragging.op);
    const ids = dragIdsRef.current;
    const nodes = document.querySelectorAll<HTMLElement>("[data-conn]");
    let best: Snap | null = null;
    let bestDist = SNAP_RADIUS;

    for (const el of nodes) {
      if (el.closest(".blk-ghost")) continue;
      const hostId = el.dataset.blockId;
      const conn = el.dataset.conn as ConnSlot | undefined;
      if (!hostId || !conn || ids.has(hostId)) continue;
      const scriptEl = el.closest<HTMLElement>("[data-script-id]");
      const scriptId = scriptEl?.dataset.scriptId;
      if (!scriptId) continue;

      const rect = el.getBoundingClientRect();
      const tx = rect.left + Math.min(20, rect.width / 2);
      const ty = conn === "next" ? rect.bottom : rect.top + 6;
      const dist = Math.hypot(clientX - tx, clientY - ty);
      if (dist > bestDist) continue;

      if (conn.startsWith("arg:")) {
        if (!reporter) continue;
        const isBoolSlot =
          el.classList.contains("blk-slot-bool") ||
          el.classList.contains("blk-empty-bool");
        if (isBoolSlot && !booleanRep) continue;
        if (!isBoolSlot && booleanRep) continue;
      } else if (reporter || !stackable) {
        continue;
      }

      bestDist = dist;
      best = { scriptId, hostId, slot: conn };
    }
    return best;
  }

  function applySnapHighlight(next: Snap | null): void {
    document
      .querySelectorAll(".snap-glow")
      .forEach((el) => el.classList.remove("snap-glow"));
    if (!next) return;
    const el = document.querySelector<HTMLElement>(
      `[data-script-id="${CSS.escape(next.scriptId)}"] [data-block-id="${CSS.escape(next.hostId)}"][data-conn="${CSS.escape(next.slot)}"]`,
    );
    el?.classList.add("snap-glow");
  }

  function startGhost(e: ReactPointerEvent, block: Block): void {
    if ((e.target as HTMLElement).closest("input,select,textarea,button")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragIdsRef.current = collectIds(block);
    const g = {
      block,
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    };
    ghostRef.current = g;
    setGhost(g);
    snapRef.current = null;
    applySnapHighlight(null);

    const onMove = (ev: PointerEvent) => {
      const cur = ghostRef.current;
      if (!cur) return;
      const nextG = {
        ...cur,
        x: ev.clientX - offsetRef.current.x,
        y: ev.clientY - offsetRef.current.y,
      };
      ghostRef.current = nextG;
      setGhost(nextG);
      const s = findSnapAt(ev.clientX, ev.clientY, cur.block);
      snapRef.current = s;
      applySnapHighlight(s);
    };

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      finishDrag(ev);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function finishDrag(ev: PointerEvent): void {
    const g = ghostRef.current;
    const s = snapRef.current;
    ghostRef.current = null;
    setGhost(null);
    applySnapHighlight(null);
    snapRef.current = null;
    if (!g) return;

    const under = document.elementFromPoint(ev.clientX, ev.clientY);
    if (under?.closest(".palette")) return;

    const current = scriptsRef.current;

    if (s) {
      const hostScript = current.find((sc) => sc.id === s.scriptId);
      if (hostScript) {
        const hostOp = findOp(hostScript.top, s.hostId);
        const nextOk =
          s.slot !== "next" || (hostOp !== undefined && canHaveNext(hostOp));
        if (nextOk) {
          commit(
            current.map((sc) =>
              sc.id === s.scriptId
                ? { ...sc, top: attachTo(sc.top, s.hostId, s.slot, g.block) }
                : sc,
            ),
          );
          return;
        }
      }
    }

    if (!under?.closest(".workspace")) return;

    const pt = workspacePoint(ev.clientX, ev.clientY);
    commit([
      ...current,
      {
        id: nid(),
        x: Math.max(8, pt.x - 8),
        y: Math.max(8, pt.y - 8),
        top: g.block,
      },
    ]);
  }

  function onBlockPointerDown(
    e: ReactPointerEvent<HTMLDivElement>,
    block: Block,
    scriptId?: string,
  ): void {
    if (!scriptId) {
      startGhost(e, block);
      return;
    }
    const current = scriptsRef.current;
    const script = current.find((s) => s.id === scriptId);
    if (!script) return;

    if (script.top.id === block.id) {
      commit(current.filter((s) => s.id !== scriptId));
      startGhost(e, block);
      return;
    }

    const { script: rest, detached } = detachFromScript(script, block.id);
    if (!detached) return;
    commit(
      current
        .map((s) => (s.id === scriptId ? rest : s))
        .filter((s): s is Script => Boolean(s)),
    );
    startGhost(e, detached);
  }

  function onPaletteDrag(
    e: ReactPointerEvent,
    op: Opcode,
    extra?: Record<string, string>,
  ): void {
    startGhost(e, createBlock(op, extra));
  }

  function onArgChange(blockId: string, name: string, value: string): void {
    commit(
      scriptsRef.current.map((s) => ({
        ...s,
        top: setArgLiteral(s.top, blockId, name, value),
      })),
    );
  }

  return (
    <>
      <Palette
        project={project}
        phase={phase}
        onBeginDrag={onPaletteDrag}
        onAddVariable={onAddVariable}
      />
      <div className="workspace" ref={scrollerRef}>
        <div className="workspace-inner">
          {scripts.map((s) => (
            <div
              key={s.id}
              className="script"
              data-script-id={s.id}
              style={{ left: s.x, top: s.y }}
            >
              <BlockView
                block={s.top}
                project={project}
                spriteId=""
                scriptId={s.id}
                onPointerDown={onBlockPointerDown}
                onArgChange={onArgChange}
              />
            </div>
          ))}
        </div>
      </div>
      {ghost && (
        <div className="blk-ghost" style={{ left: ghost.x, top: ghost.y }}>
          <BlockView
            block={ghost.block}
            project={project}
            spriteId=""
            onPointerDown={() => {}}
            onArgChange={() => {}}
          />
        </div>
      )}
    </>
  );
}
