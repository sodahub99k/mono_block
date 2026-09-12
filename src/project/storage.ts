import type { Project } from "./types";
import { bouncingProject } from "./examples";

const KEY = "mono_block_project_v1";

export function loadProject(): Project | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Project;
    if (!data || !Array.isArray(data.sprites)) return null;
    return data;
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
