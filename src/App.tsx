import { useEffect, useRef, useState } from "react";
import { BlockEditor } from "./blocks/BlockEditor";
import { Toolbar } from "./ide/Toolbar";
import { Inspector } from "./ide/Inspector";
import { StructPane } from "./ide/StructPane";
import {
  bouncingProject,
  emptyEntity,
  emptyProject,
  EXAMPLES,
} from "./project/examples";
import {
  downloadProject,
  initialProject,
  migrateProject,
  saveProject,
} from "./project/storage";
import type {
  BackdropId,
  CostumeKind,
  EditorTarget,
  Entity,
  PhaseId,
  Project,
  Script,
} from "./project/types";
import { nid } from "./project/types";
import { getEngine, eventToKey } from "./runtime/engine";
import { EntityPane } from "./stage/EntityPane";
import { Stage } from "./stage/Stage";
import "./App.css";

const HINT_KEY = "mono_block_hint_v3";

const COSTUME_LABEL: Record<CostumeKind, string> = {
  cat: "ネコ",
  ball: "ボール",
  star: "スター",
  cube: "キューブ",
  ghost: "ゴースト",
  rocket: "ロケット",
};

function mergeEnginePatch(
  project: Project,
  patch: Partial<Project> | null,
): Project {
  if (!patch) return project;
  return {
    ...project,
    entities: patch.entities ?? project.entities,
    variables: patch.variables ?? project.variables,
  };
}

function resolveScripts(
  project: Project,
  target: EditorTarget,
): { scripts: Script[]; palettePhase: PhaseId | "method" } {
  if (target.kind === "phase") {
    return { scripts: project[target.phase], palettePhase: target.phase };
  }
  const st = project.structs.find((s) => s.id === target.structId);
  const method = st?.methods.find((m) => m.id === target.methodId);
  return { scripts: method?.scripts ?? [], palettePhase: "method" };
}

function methodLabel(project: Project, target: EditorTarget): string | null {
  if (target.kind !== "method") return null;
  const st = project.structs.find((s) => s.id === target.structId);
  const method = st?.methods.find((m) => m.id === target.methodId);
  if (!st || !method) return null;
  return `impl ${st.name}::${method.name}`;
}

export default function App() {
  const [project, setProject] = useState<Project>(initialProject);
  const [entityId, setEntityId] = useState(() => project.entities[0]!.id);
  const [target, setTarget] = useState<EditorTarget>({
    kind: "phase",
    phase: "update",
  });
  const [structId, setStructId] = useState<string | null>(
    () => project.structs[0]?.id ?? null,
  );
  const [methodId, setMethodId] = useState<string | null>(
    () => project.structs[0]?.methods[0]?.id ?? null,
  );
  const [running, setRunning] = useState(false);
  const [hint, setHint] = useState(
    () => localStorage.getItem(HINT_KEY) !== "1",
  );
  const projectRef = useRef(project);
  const fileBusy = useRef(false);

  projectRef.current = project;

  useEffect(() => {
    const t = window.setTimeout(() => saveProject(project), 250);
    return () => window.clearTimeout(t);
  }, [project]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("input,textarea,select")) {
        return;
      }
      const key = eventToKey(e);
      if (!key) return;
      if (running && ["up", "down", "left", "right", "space"].includes(key)) {
        e.preventDefault();
      }
      if (!e.repeat) getEngine().keyDown(key);
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

  const entity =
    project.entities.find((s) => s.id === entityId) ?? project.entities[0];

  const { scripts, palettePhase } = resolveScripts(project, target);

  function patchProject(fn: (p: Project) => Project): void {
    setProject((p) => fn(p));
  }

  function stopEngine(writeBack = true): Project {
    const patch = getEngine().stop(writeBack);
    const next = mergeEnginePatch(projectRef.current, patch);
    if (patch) {
      projectRef.current = next;
      setProject(next);
    }
    setRunning(false);
    return next;
  }

  function greenFlag(): void {
    const toRun = stopEngine(true);
    getEngine().start(toRun, () => setRunning(false));
    setRunning(true);
  }

  function loadProject(next: Project): void {
    stopEngine(false);
    projectRef.current = next;
    setProject(next);
    setEntityId(next.entities[0]?.id ?? "");
    setStructId(next.structs[0]?.id ?? null);
    setMethodId(next.structs[0]?.methods[0]?.id ?? null);
    setTarget({ kind: "phase", phase: "update" });
  }

  function selectMethod(sid: string, mid: string): void {
    setStructId(sid);
    setMethodId(mid);
    setTarget({ kind: "method", structId: sid, methodId: mid });
  }

  function openImpl(): void {
    let sid = structId;
    let mid = methodId;
    const st =
      project.structs.find((s) => s.id === sid) ?? project.structs[0];
    if (!st) {
      window.alert("先に struct を追加してください（右の struct / impl）");
      return;
    }
    sid = st.id;
    mid = st.methods.find((m) => m.id === mid)?.id ?? st.methods[0]?.id ?? null;
    setStructId(sid);
    if (mid) {
      setMethodId(mid);
      setTarget({ kind: "method", structId: sid, methodId: mid });
    } else {
      window.alert("メソッドを追加してください");
    }
  }

  return (
    <div className="ide">
      <Toolbar
        running={running}
        target={target}
        methodLabel={methodLabel(project, target)}
        onPhase={(p) => setTarget({ kind: "phase", phase: p })}
        onImpl={openImpl}
        onGreenFlag={greenFlag}
        onStop={() => stopEngine(true)}
        onExample={(id) => {
          const make =
            EXAMPLES.find((e) => e.id === id)?.make ?? bouncingProject;
          loadProject(make());
        }}
        onNew={() => loadProject(emptyProject())}
        onSave={() => downloadProject(project)}
        onLoad={(file) => {
          if (fileBusy.current) return;
          fileBusy.current = true;
          void file.text().then((text) => {
            try {
              const data = migrateProject(JSON.parse(text));
              if (!data) {
                window.alert("v2/v3 プロジェクト形式が必要です");
                return;
              }
              loadProject(data);
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
        phase={palettePhase}
        scripts={scripts}
        onChangeScripts={(nextScripts: Script[]) => {
          if (target.kind === "phase") {
            patchProject((p) => ({ ...p, [target.phase]: nextScripts }));
            return;
          }
          patchProject((p) => ({
            ...p,
            structs: p.structs.map((s) => {
              if (s.id !== target.structId) return s;
              return {
                ...s,
                methods: s.methods.map((m) =>
                  m.id === target.methodId
                    ? { ...m, scripts: nextScripts }
                    : m,
                ),
              };
            }),
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
          selectedId={entity?.id ?? ""}
          onSelect={setEntityId}
        />
        <EntityPane
          entities={project.entities}
          selectedId={entity?.id ?? ""}
          onSelect={setEntityId}
          onAdd={(kind: CostumeKind) => {
            const base = COSTUME_LABEL[kind];
            const n = project.entities.filter((s) =>
              s.name.startsWith(base),
            ).length;
            const name = n === 0 ? base : `${base}${n + 1}`;
            const ent = emptyEntity(kind, name, project.entities.length);
            patchProject((p) => ({
              ...p,
              entities: [...p.entities, ent],
            }));
            setEntityId(ent.id);
          }}
          onDelete={(id) => {
            const remaining = project.entities.filter((s) => s.id !== id);
            if (remaining.length === 0) return;
            patchProject((p) => ({
              ...p,
              entities: p.entities.filter((s) => s.id !== id),
            }));
            if (entityId === id) setEntityId(remaining[0]!.id);
          }}
        />
        <StructPane
          structs={project.structs}
          selectedStructId={structId}
          selectedMethodId={methodId}
          onSelectStruct={setStructId}
          onSelectMethod={selectMethod}
          onChange={(structs) => {
            patchProject((p) => {
              const entities = p.entities.map((e) => {
                if (!e.structName) return e;
                const old = p.structs.find((s) => s.name === e.structName);
                if (!old) return e;
                const next = structs.find((s) => s.id === old.id);
                if (!next) return { ...e, structName: null, fields: {} };
                if (next.name === e.structName) return e;
                return { ...e, structName: next.name };
              });
              return { ...p, structs, entities };
            });
            if (target.kind === "method") {
              const st = structs.find((s) => s.id === target.structId);
              const m = st?.methods.find((x) => x.id === target.methodId);
              if (!st || !m) {
                setTarget({ kind: "phase", phase: "update" });
              }
            }
          }}
        />
        <Inspector
          entity={entity}
          structs={project.structs}
          backdrop={project.backdrop}
          onBackdrop={(id: BackdropId) =>
            patchProject((p) => ({ ...p, backdrop: id }))
          }
          onChange={(patch: Partial<Entity>) => {
            patchProject((p) => ({
              ...p,
              entities: p.entities.map((s) =>
                s.id === entityId ? { ...s, ...patch } : s,
              ),
            }));
          }}
          onCostume={(kind: CostumeKind) => {
            patchProject((p) => ({
              ...p,
              entities: p.entities.map((s) => {
                if (s.id !== entityId) return s;
                const costumes = s.costumes.map((c, i) =>
                  i === s.costumeIndex
                    ? { ...c, kind, name: COSTUME_LABEL[kind] }
                    : c,
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
