import type { StructDef } from "../project/types";
import { emptyMethod, emptyStruct } from "../project/types";

type Props = {
  structs: StructDef[];
  selectedStructId: string | null;
  selectedMethodId: string | null;
  onSelectStruct: (id: string) => void;
  onSelectMethod: (structId: string, methodId: string) => void;
  onChange: (structs: StructDef[]) => void;
};

export function StructPane({
  structs,
  selectedStructId,
  selectedMethodId,
  onSelectStruct,
  onSelectMethod,
  onChange,
}: Props) {
  const selected = structs.find((s) => s.id === selectedStructId) ?? structs[0];

  function patchStruct(id: string, fn: (s: StructDef) => StructDef): void {
    onChange(structs.map((s) => (s.id === id ? fn(s) : s)));
  }

  function addStruct(): void {
    const n = structs.length + 1;
    const s = emptyStruct(n === 1 ? "Player" : `Type${n}`);
    s.methods = [emptyMethod("update")];
    onChange([...structs, s]);
    onSelectStruct(s.id);
    onSelectMethod(s.id, s.methods[0]!.id);
  }

  function removeStruct(id: string): void {
    const next = structs.filter((s) => s.id !== id);
    onChange(next);
    if (selectedStructId === id) {
      const first = next[0];
      if (first) {
        onSelectStruct(first.id);
        if (first.methods[0]) onSelectMethod(first.id, first.methods[0].id);
      }
    }
  }

  return (
    <div className="struct-pane">
      <div className="pane-label">struct / impl</div>
      <div className="struct-list">
        {structs.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`struct-card ${s.id === selected?.id ? "is-selected" : ""}`}
            onClick={() => {
              onSelectStruct(s.id);
              if (s.methods[0]) onSelectMethod(s.id, s.methods[0].id);
            }}
          >
            <code>struct {s.name}</code>
            <span className="struct-meta">
              {s.fields.length} field · {s.methods.length} method
            </span>
            <span
              className="sprite-del"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                removeStruct(s.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  removeStruct(s.id);
                }
              }}
            >
              ×
            </span>
          </button>
        ))}
        <button type="button" className="struct-add" onClick={addStruct}>
          + struct
        </button>
      </div>

      {selected && (
        <div className="struct-detail">
          <label>
            名前
            <input
              value={selected.name}
              onChange={(e) => {
                const name = e.target.value.replace(/\s+/g, "");
                patchStruct(selected.id, (s) => ({ ...s, name }));
              }}
            />
          </label>

          <div className="struct-section-label">fields</div>
          {selected.fields.map((f, i) => (
            <div key={`${selected.id}-f${i}`} className="field-row">
              <input
                value={f.name}
                placeholder="name"
                onChange={(e) => {
                  const name = e.target.value.replace(/\s+/g, "");
                  patchStruct(selected.id, (s) => ({
                    ...s,
                    fields: s.fields.map((x, j) =>
                      j === i ? { ...x, name } : x,
                    ),
                  }));
                }}
              />
              <input
                type="number"
                value={f.defaultValue}
                title="default"
                onChange={(e) => {
                  const defaultValue = Number(e.target.value) || 0;
                  patchStruct(selected.id, (s) => ({
                    ...s,
                    fields: s.fields.map((x, j) =>
                      j === i ? { ...x, defaultValue } : x,
                    ),
                  }));
                }}
              />
              <button
                type="button"
                className="mini-del"
                onClick={() =>
                  patchStruct(selected.id, (s) => ({
                    ...s,
                    fields: s.fields.filter((_, j) => j !== i),
                  }))
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="ghost-btn mini-add"
            onClick={() =>
              patchStruct(selected.id, (s) => ({
                ...s,
                fields: [
                  ...s.fields,
                  { name: `f${s.fields.length + 1}`, defaultValue: 0 },
                ],
              }))
            }
          >
            + field
          </button>

          <div className="struct-section-label">impl メソッド</div>
          <div className="method-list">
            {selected.methods.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`method-chip ${m.id === selectedMethodId ? "is-active" : ""}`}
                onClick={() => onSelectMethod(selected.id, m.id)}
              >
                fn {m.name}
              </button>
            ))}
          </div>
          {selected.methods.map((m) =>
            m.id === selectedMethodId ? (
              <label key={m.id} className="method-rename">
                メソッド名
                <input
                  value={m.name}
                  onChange={(e) => {
                    const name = e.target.value.replace(/\s+/g, "");
                    patchStruct(selected.id, (s) => ({
                      ...s,
                      methods: s.methods.map((x) =>
                        x.id === m.id ? { ...x, name } : x,
                      ),
                    }));
                  }}
                />
              </label>
            ) : null,
          )}
          <div className="method-actions">
            <button
              type="button"
              className="ghost-btn mini-add"
              onClick={() => {
                const m = emptyMethod(`method${selected.methods.length + 1}`);
                patchStruct(selected.id, (s) => ({
                  ...s,
                  methods: [...s.methods, m],
                }));
                onSelectMethod(selected.id, m.id);
              }}
            >
              + method
            </button>
            {selectedMethodId && selected.methods.length > 0 && (
              <button
                type="button"
                className="ghost-btn mini-add"
                onClick={() => {
                  const remaining = selected.methods.filter(
                    (m) => m.id !== selectedMethodId,
                  );
                  patchStruct(selected.id, (s) => ({
                    ...s,
                    methods: remaining,
                  }));
                  if (remaining[0]) {
                    onSelectMethod(selected.id, remaining[0].id);
                  }
                }}
              >
                メソッド削除
              </button>
            )}
          </div>
          <p className="struct-hint">
            メソッドを選ぶとエディタで本文を編集。呼び出しは{" "}
            <code>self.メソッド()</code>。
          </p>
        </div>
      )}
    </div>
  );
}
