import type { BackdropId, CostumeKind, Sprite } from "../project/types";

const BACKDROPS: { id: BackdropId; label: string }[] = [
  { id: "sky", label: "空" },
  { id: "space", label: "宇宙" },
  { id: "room", label: "部屋" },
  { id: "grid", label: "グリッド" },
];

type Props = {
  sprite: Sprite | undefined;
  backdrop: BackdropId;
  onBackdrop: (id: BackdropId) => void;
  onChange: (patch: Partial<Sprite>) => void;
  onCostume: (kind: CostumeKind) => void;
};

export function Inspector({
  sprite,
  backdrop,
  onBackdrop,
  onChange,
  onCostume,
}: Props) {
  if (!sprite) return null;
  return (
    <div className="inspector">
      <label>
        名前
        <input
          value={sprite.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>
      <div className="xy">
        <label>
          x
          <input
            type="number"
            value={Math.round(sprite.x)}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
          />
        </label>
        <label>
          y
          <input
            type="number"
            value={Math.round(sprite.y)}
            onChange={(e) => onChange({ y: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className="xy">
        <label>
          向き
          <input
            type="number"
            value={Math.round(sprite.direction)}
            onChange={(e) => onChange({ direction: Number(e.target.value) })}
          />
        </label>
        <label>
          大きさ%
          <input
            type="number"
            value={Math.round(sprite.size)}
            onChange={(e) => onChange({ size: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={sprite.visible}
          onChange={(e) => onChange({ visible: e.target.checked })}
        />
        表示する
      </label>
      <label>
        コスチューム
        <select
          value={sprite.costumes[sprite.costumeIndex]?.kind ?? "cat"}
          onChange={(e) => onCostume(e.target.value as CostumeKind)}
        >
          <option value="cat">ネコ</option>
          <option value="ball">ボール</option>
          <option value="star">スター</option>
          <option value="cube">キューブ</option>
          <option value="ghost">ゴースト</option>
          <option value="rocket">ロケット</option>
        </select>
      </label>
      <label>
        背景
        <select
          value={backdrop}
          onChange={(e) => onBackdrop(e.target.value as BackdropId)}
        >
          {BACKDROPS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
