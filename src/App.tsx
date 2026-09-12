import { useEffect, useRef, useState } from "react";
import { BlockEditor } from "./blocks/BlockEditor";
import { Toolbar } from "./ide/Toolbar";
import { Inspector } from "./ide/Inspector";
import { bouncingProject, emptyProject, emptySprite, EXAMPLES } from "./project/examples";
import { downloadProject, initialProject, saveProject } from "./project/storage";
import type {
  BackdropId,
  CostumeKind,
  Project,
  Script,
  Sprite,
} from "./project/types";
import { nid } from "./project/types";
import { getEngine, eventToKey } from "./runtime/engine";
import { SpritePane } from "./stage/SpritePane";
import { Stage } from "./stage/Stage";
import "./App.css";

const HINT_KEY = "mono_block_hint_seen";

export default function App() {
  const [project, setProject] = useState<Project>(initialProject);
  const [spriteId, setSpriteId] = useState(() => project.sprites[0]!.id);
  const [running, setRunning] = useState(false);
  const [hint, setHint] = useState(() => localStorage.getItem(HINT_KEY) !== "1");
  const fileBusy = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => saveProject(project), 250);
    return () => window.clearTimeout(t);
  }, [project]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = eventToKey(e);
      if (!key) return;
      if (running && ["up", "down", "left", "right", "space"].includes(key)) {
        e.preventDefault();
      }
      getEngine().keyDown(key);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = eventToKey(e);
      if (key) getEngine().keyUp(key);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [running]);

  const sprite = project.sprites.find((s) => s.id === spriteId) ?? project.sprites[0];

  function patchProject(fn: (p: Project) => Project): void {
    setProject((p) => fn(p));
  }

  function stop(): void {
    const patch = getEngine().stop(true);
    setRunning(false);
    if (patch) {
      setProject((p) => ({
        ...p,
        sprites: patch.sprites ?? p.sprites,
        variables: patch.variables ?? p.variables,
      }));
    }
  }

  function greenFlag(): void {
    if (running) stop();
    getEngine().start(project, () => setRunning(false));
    setRunning(true);
  }

  function loadExample(id: string): void {
    stop();
    const make = EXAMPLES.find((e) => e.id === id)?.make ?? bouncingProject;
    const next = make();
    setProject(next);
    setSpriteId(next.sprites[0]!.id);
  }

  return (
    <div className="ide">
      <Toolbar
        running={running}
        onGreenFlag={greenFlag}
        onStop={stop}
        onExample={loadExample}
        onNew={() => {
          stop();
          const next = emptyProject();
          setProject(next);
          setSpriteId(next.sprites[0]!.id);
        }}
        onSave={() => downloadProject(project)}
        onLoad={(file) => {
          if (fileBusy.current) return;
          fileBusy.current = true;
          void file.text().then((text) => {
            try {
              const data = JSON.parse(text) as Project;
              if (!Array.isArray(data.sprites)) return;
              stop();
              setProject(data);
              setSpriteId(data.sprites[0]?.id ?? "");
            } catch {
              window.alert("読み込めませんでした");
            } finally {
              fileBusy.current = false;
            }
          });
        }}
        showHint={hint}
        onDismissHint={() => {
          localStorage.setItem(HINT_KEY, "1");
          setHint(false);
        }}
      />

      <BlockEditor
        project={project}
        spriteId={sprite?.id ?? ""}
        onChangeScripts={(scripts: Script[]) => {
          patchProject((p) => ({
            ...p,
            sprites: p.sprites.map((s) =>
              s.id === spriteId ? { ...s, scripts } : s,
            ),
          }));
        }}
        onAddVariable={(name) => {
          patchProject((p) => {
            if (p.variables.some((v) => v.name === name)) return p;
            return {
              ...p,
              variables: [
                ...p.variables,
                { id: nid(), name, value: 0, visible: true },
              ],
            };
          });
        }}
      />

      <aside className="right">
        <Stage
          project={project}
          selectedId={sprite?.id ?? ""}
          onSelect={setSpriteId}
        />
        <SpritePane
          sprites={project.sprites}
          selectedId={sprite?.id ?? ""}
          onSelect={setSpriteId}
          onAdd={(kind: CostumeKind) => {
            const names: Record<CostumeKind, string> = {
              cat: "ネコ",
              ball: "ボール",
              star: "スター",
              cube: "キューブ",
              ghost: "ゴースト",
              rocket: "ロケット",
            };
            const n = project.sprites.filter((s) =>
              s.name.startsWith(names[kind]),
            ).length;
            const name = n === 0 ? names[kind] : `${names[kind]}${n + 1}`;
            const sp = emptySprite(kind, name, project.sprites.length);
            patchProject((p) => ({ ...p, sprites: [...p.sprites, sp] }));
            setSpriteId(sp.id);
          }}
          onDelete={(id) => {
            patchProject((p) => {
              const sprites = p.sprites.filter((s) => s.id !== id);
              return { ...p, sprites };
            });
            if (spriteId === id) {
              const rest = project.sprites.filter((s) => s.id !== id);
              setSpriteId(rest[0]?.id ?? "");
            }
          }}
        />
        <Inspector
          sprite={sprite}
          backdrop={project.backdrop}
          onBackdrop={(id: BackdropId) =>
            patchProject((p) => ({ ...p, backdrop: id }))
          }
          onChange={(patch: Partial<Sprite>) => {
            patchProject((p) => ({
              ...p,
              sprites: p.sprites.map((s) =>
                s.id === spriteId ? { ...s, ...patch } : s,
              ),
            }));
          }}
          onCostume={(kind: CostumeKind) => {
            patchProject((p) => ({
              ...p,
              sprites: p.sprites.map((s) => {
                if (s.id !== spriteId) return s;
                const costumes = s.costumes.map((c, i) =>
                  i === s.costumeIndex ? { ...c, kind, name: kind } : c,
                );
                return { ...s, costumes };
              }),
            }));
          }}
        />
      </aside>
    </div>
  );
}
