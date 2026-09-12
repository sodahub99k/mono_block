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

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let timer = 0;
    const tick = () => {
      const engine = getEngine();
      const snap = engine.snapshot() ?? snapshotFromProject(project);
      drawFrame(ctx, snap);
    };
    tick();
    timer = window.setInterval(tick, 32);
    return () => window.clearInterval(timer);
  }, [project]);

  function toScratch(e: MouseEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return canvasToScratch(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
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
          const snap = eng.snapshot() ?? snapshotFromProject(project);
          const hit = hitTest(snap.sprites, p.x, p.y);
          if (hit) {
            onSelect(hit.id);
            eng.clickSprite(hit.id);
          }
        }}
        onMouseUp={(e) => {
          const p = toScratch(e);
          getEngine().setMouse(p.x, p.y, false);
        }}
        aria-label="ステージ"
      />
      <div className="stage-selected">
        {project.sprites.find((s) => s.id === selectedId)?.name ?? ""}
      </div>
    </div>
  );
}
