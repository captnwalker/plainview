import { OPT_OUT_STORAGE_KEY, type ChecklistStatus } from "./opt-out.ts";

export type ChecklistState = Record<string, ChecklistStatus>;

export function readChecklist(): ChecklistState {
  try {
    const raw = localStorage.getItem(OPT_OUT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as ChecklistState;
  } catch {
    return {};
  }
}

export function writeChecklist(next: ChecklistState) {
  try {
    localStorage.setItem(OPT_OUT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — ignore */
  }
}

export function setChecklistStatus(id: string, status: ChecklistStatus): ChecklistState {
  const next = { ...readChecklist(), [id]: status };
  if (status === "idle") delete next[id];
  writeChecklist(next);
  return next;
}

export function clearChecklist() {
  try {
    localStorage.removeItem(OPT_OUT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
