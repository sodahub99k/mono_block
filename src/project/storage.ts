import type { Entity, Project, StructDef } from "./types";
import { bouncingProject } from "./examples";

const KEY = "mono_block_project_v3";

function normalizeEntity(e: Entity & { structName?: string | null; fields?: Record<string, number> }): Entity {
  return {
    ...e,
    structName: e.structName ?? null,
    fields: e.fields ? { ...e.fields } : {},
  };
}

function normalizeProject(data: Project): Project | null {
  if (!data || !Array.isArray(data.entities) || data.entities.length === 0) {
    return null;
  }
  const structs: StructDef[] = Array.isArray(data.structs) ? data.structs : [];
  return {
    ...data,
    version: 3,
    structs,
    entities: data.entities.map(normalizeEntity),
    boot: data.boot ?? [],
    update: data.update ?? [],
    draw: data.draw ?? [],
    variables: data.variables ?? [],
  };
}

/** Accept v2 (no structs) or v3. */
export function migrateProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as { version?: number; entities?: Entity[]; [k: string]: unknown };
  if (data.version !== 2 && data.version !== 3) return null;
  return normalizeProject(data as unknown as Project);
}

export function loadProject(): Project | null {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem("mono_block_project_v2");
    if (!raw) return null;
    return migrateProject(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveProject(project: Project): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(project));
  } catch {
    /* quota */
  }
}

export function initialProject(): Project {
  return loadProject() ?? bouncingProject();
}

export function downloadProject(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name || "mono_block"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
