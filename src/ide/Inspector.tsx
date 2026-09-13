import type {
  BackdropId,
  CostumeKind,
  Entity,
  StructDef,
} from "../project/types";
import { defaultFields } from "../project/types";

const BACKDROPS: { id: BackdropId; label: string }[] = [
  { id: "sky", label: "空" },
  { id: "space", label: "宇宙" },
  { id: "room", label: "部屋" },
  { id: "grid", label: "グリッド" },
];

type Props = {
  entity: Entity | undefined;
  structs: StructDef[];
  backdrop: BackdropId;
  onBackdrop: (id: BackdropId) => void;
  onChange: (patch: Partial<Entity>) => void;
  onCostume: (kind: CostumeKind) => void;
};

export function Inspector({
  entity,
  structs,
  backdrop,
  onBackdrop,
  onChange,
  onCostume,
}: Props) {
  if (!entity) return null;

  const struct = structs.find((s) => s.name === entity.structName);

  return (
    <div className="inspector">
      <label>
        名前
        <input
          value={entity.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>
      <label>
        タグ
        <input
          value={entity.tag}
          onChange={(e) => onChange({ tag: e.target.value })}
        />
      </label>
      <label>
        struct
        <select
          value={entity.structName ?? ""}
          onChange={(e) => {
            const name = e.target.value || null;
            const def = structs.find((s) => s.name === name);
            onChange({
              structName: name,
              fields: def ? { ...defaultFields(def), ...entity.fields } : {},
            });
          }}
        >
          <option value="">（なし）</option>
          {structs.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      {struct &&
        struct.fields.map((f) => (
          <label key={f.name}>
            self.{f.name}
            <input
              type="number"
              value={entity.fields[f.name] ?? f.defaultValue}
              onChange={(e) =>
                onChange({
                  fields: {
                    ...entity.fields,
                    [f.name]: Number(e.target.value) || 0,
                  },
                })
              }
            />
          </label>
        ))}
      <div className="xy">
        <label>
          x
          <input
            type="number"
            value={Math.round(entity.x)}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
          />
        </label>
        <label>
          y
          <input
            type="number"
            value={Math.round(entity.y)}
            onChange={(e) => onChange({ y: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className="xy">
        <label>
          vx
          <input
            type="number"
            value={Math.round(entity.vx)}
            onChange={(e) => onChange({ vx: Number(e.target.value) })}
          />
        </label>
        <label>
          vy
          <input
            type="number"
            value={Math.round(entity.vy)}
            onChange={(e) => onChange({ vy: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className="xy">
        <label>
          向き
          <input
            type="number"
            value={Math.round(entity.direction)}
            onChange={(e) => onChange({ direction: Number(e.target.value) })}
          />
        </label>
        <label>
          大きさ%
          <input
            type="number"
            value={Math.round(entity.size)}
            onChange={(e) => onChange({ size: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={entity.visible}
          onChange={(e) => onChange({ visible: e.target.checked })}
        />
        表示する
      </label>
      <label>
        コスチューム
        <select
          value={entity.costumes[entity.costumeIndex]?.kind ?? "cat"}
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
