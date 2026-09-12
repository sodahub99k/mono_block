import { useEffect, useRef, type MouseEvent } from "react";
import { STAGE_H, STAGE_W } from "../project/types";
import type { Project } from "../project/types";
import { getEngine, hitTest } from "../runtime/engine";
import { canvasToScratch, drawFrame, snapshotFromProject } from "./draw";

type Props = {
  project: Project;
  selectedId: string;
  onSelect: (id: string) => void;
};

export function Stage({ project, selectedId, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let alive = true;

    const tick = () => {
      if (!alive) return;
      const engine = getEngine();
      const snap = engine.snapshot() ?? snapshotFromProject(projectRef.current);
      drawFrame(ctx, snap);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  function toScratch(
    e: MouseEvent<HTMLCanvasElement>,
  ): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return canvasToScratch(
      e.clientX - r.left,
      e.clientY - r.top,
      r.width,
      r.height,
    );
  }

  return (
    <div className="stage-wrap">
      <canvas
        ref={canvasRef}
        className="stage-canvas"
        width={STAGE_W}
        height={STAGE_H}
        onMouseMove={(e) => {
          const p = toScratch(e);
          getEngine().setMouse(p.x, p.y, e.buttons === 1);
        }}
        onMouseDown={(e) => {
          const p = toScratch(e);
          const eng = getEngine();
          eng.setMouse(p.x, p.y, true);
          if (eng.running) return;
          const snap = snapshotFromProject(projectRef.current);
          const hit = hitTest(snap.entities, p.x, p.y);
          if (hit) onSelect(hit.id);
        }}
        onMouseUp={(e) => {
          const p = toScratch(e);
          getEngine().setMouse(p.x, p.y, false);
        }}
        onMouseLeave={() => {
          getEngine().setMouse(0, 0, false);
        }}
        aria-label="ステージ"
      />
      <div className="stage-selected">
        {project.entities.find((s) => s.id === selectedId)?.name ?? ""}
      </div>
    </div>
  );
}
