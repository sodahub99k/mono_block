import { EXAMPLES } from "../project/examples";
import type { EditorTarget, PhaseId } from "../project/types";

type Props = {
  running: boolean;
  target: EditorTarget;
  methodLabel: string | null;
  onPhase: (p: PhaseId) => void;
  onImpl: () => void;
  onGreenFlag: () => void;
  onStop: () => void;
  onExample: (id: string) => void;
  onNew: () => void;
  onSave: () => void;
  onLoad: (file: File) => void;
  showHint: boolean;
  onDismissHint: () => void;
};

const PHASES: { id: PhaseId; label: string; hint: string }[] = [
  { id: "boot", label: "boot", hint: "開始時に一度だけ" },
  { id: "update", label: "update", hint: "毎フレーム（ロジック）" },
  { id: "draw", label: "draw", hint: "毎フレーム（HUD）" },
];

export function Toolbar({
  running,
  target,
  methodLabel,
  onPhase,
  onImpl,
  onGreenFlag,
  onStop,
  onExample,
  onNew,
  onSave,
  onLoad,
  showHint,
  onDismissHint,
}: Props) {
  const implActive = target.kind === "method";

  return (
    <header className="toolbar">
      <div className="brand">
        <span className="logo" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div>
          <strong>Mono Block</strong>
          <span className="tag">フレームループ型ゲームIDE</span>
        </div>
      </div>

      <div className="phase-tabs" role="tablist" aria-label="フェーズ">
        {PHASES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={target.kind === "phase" && target.phase === p.id}
            className={`phase-tab ${target.kind === "phase" && target.phase === p.id ? "is-active" : ""}`}
            title={p.hint}
            onClick={() => onPhase(p.id)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={implActive}
          className={`phase-tab ${implActive ? "is-active" : ""}`}
          title="struct の impl メソッドを編集"
          onClick={onImpl}
        >
          impl
        </button>
      </div>
      {implActive && methodLabel && (
        <code className="impl-badge">{methodLabel}</code>
      )}

      <div className="controls">
        <button
          type="button"
          className={`flag ${running ? "is-on" : ""}`}
          onClick={onGreenFlag}
          title="ゲームループを実行"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M4 3h2v18H4V3zm3 1 12 5.5L7 15V4z" />
          </svg>
          実行
        </button>
        <button type="button" className="stop" onClick={onStop} title="停止">
          <span className="stop-icon" />
          停止
        </button>
        <select
          className="example-select"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onExample(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            サンプル…
          </option>
          {EXAMPLES.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.label}
            </option>
          ))}
        </select>
        <button type="button" className="ghost-btn" onClick={onNew}>
          新規
        </button>
        <button type="button" className="ghost-btn" onClick={onSave}>
          保存
        </button>
        <label className="ghost-btn file-btn">
          開く
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onLoad(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {showHint && (
        <p className="hint-bar">
          Rust 風に struct / impl でメソッドを書けます。エンティティに struct
          を割り当て、update から self.メソッド() を呼びます。
          <button type="button" onClick={onDismissHint}>
            OK
          </button>
        </p>
      )}
    </header>
  );
}
