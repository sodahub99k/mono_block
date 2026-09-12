import { useEffect, useRef } from "react";
import type { CostumeKind, Sprite } from "../project/types";
import { drawCostume } from "../stage/costumes";

const KINDS: { kind: CostumeKind; label: string }[] = [
  { kind: "cat", label: "ネコ" },
  { kind: "ball", label: "ボール" },
  { kind: "star", label: "スター" },
  { kind: "cube", label: "キューブ" },
  { kind: "ghost", label: "ゴースト" },
  { kind: "rocket", label: "ロケット" },
];

type Props = {
  sprites: Sprite[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: (kind: CostumeKind) => void;
  onDelete: (id: string) => void;
};

export function SpritePane({
  sprites,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
}: Props) {
  return (
    <div className="sprite-pane">
      <div className="pane-label">スプライト</div>
      <div className="sprite-grid">
        {sprites.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`sprite-card ${s.id === selectedId ? "is-selected" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            <Thumb sprite={s} />
            <span className="sprite-name">{s.name}</span>
            {sprites.length > 1 && (
              <span
                className="sprite-del"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onDelete(s.id);
                  }
                }}
              >
                ×
              </span>
            )}
          </button>
        ))}
        <div className="sprite-add">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              className="add-kind"
              title={k.label}
              onClick={() => onAdd(k.kind)}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Thumb({ sprite }: { sprite: Sprite }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    const costume = sprite.costumes[sprite.costumeIndex] ?? sprite.costumes[0];
    if (costume) drawCostume(ctx, costume.kind, 70);
    ctx.restore();
  }, [sprite]);
  return <canvas ref={ref} width={72} height={56} className="sprite-thumb" />;
}
