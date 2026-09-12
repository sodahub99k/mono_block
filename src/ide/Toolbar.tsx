import { EXAMPLES } from "../project/examples";

type Props = {
  running: boolean;
  onGreenFlag: () => void;
  onStop: () => void;
  onExample: (id: string) => void;
  onNew: () => void;
  onSave: () => void;
  onLoad: (file: File) => void;
  showHint: boolean;
  onDismissHint: () => void;
};

export function Toolbar({
  running,
  onGreenFlag,
  onStop,
  onExample,
  onNew,
  onSave,
  onLoad,
  showHint,
  onDismissHint,
}: Props) {
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
          <span className="tag">ビジュアルプログラミング</span>
        </div>
      </div>
      <div className="controls">
        <button
          type="button"
          className={`flag ${running ? "is-on" : ""}`}
          onClick={onGreenFlag}
          title="旗が押されたとき を実行"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M4 3h2v18H4V3zm3 1 12 5.5L7 15V4z" />
          </svg>
          実行
        </button>
        <button type="button" className="stop" onClick={onStop} title="すべて止める">
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
          左のブロックをドラッグしてつなぎ、緑の旗で動かします。パレットに戻すと削除。
          <button type="button" onClick={onDismissHint}>
            OK
          </button>
        </p>
      )}
    </header>
  );
}
