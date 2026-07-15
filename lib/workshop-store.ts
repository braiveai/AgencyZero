"use client";

import { stages as defaultStages } from "@/lib/model/processes";
import { staff as defaultStaff } from "@/lib/model/staff";
import type { Stage, StaffRole } from "@/lib/model/types";
import { pullRemote, pushRemote } from "@/lib/remote";

const KEY = "az_workshop_v1";
const RK = "workshop";

export interface WorkshopState {
  stages: Stage[];
  staff: StaffRole[];
  /** process ids the room has explicitly reviewed */
  reviewed: string[];
}

const deepClone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export function defaultWorkshop(): WorkshopState {
  return { stages: deepClone(defaultStages), staff: deepClone(defaultStaff), reviewed: [] };
}

/** Non-destructively add any NEW seed stages (by id) missing from a saved session,
 *  preserving the saved order and edits. Keeps sessions current when the template grows. */
function withNewSeedStages(state: WorkshopState): WorkshopState {
  const have = new Set(state.stages.map((s) => s.id));
  const additions = defaultStages.filter((s) => !have.has(s.id)).map(deepClone);
  if (additions.length === 0) return state;
  // insert each new stage at its seed position (order), so Stage 0 lands at the front
  const merged = [...state.stages, ...additions].sort((x, y) => x.order - y.order);
  return { ...state, stages: merged };
}

export function loadWorkshop(): WorkshopState {
  if (typeof window === "undefined") return defaultWorkshop();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultWorkshop();
    const s = JSON.parse(raw) as WorkshopState;
    if (!s.stages || !s.staff) return defaultWorkshop();
    return withNewSeedStages({ ...s, reviewed: s.reviewed ?? [] });
  } catch {
    return defaultWorkshop();
  }
}

export function saveWorkshop(state: WorkshopState) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state));
  pushRemote(RK, state);
}

export function resetWorkshop(): WorkshopState {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  const d = defaultWorkshop();
  pushRemote(RK, d);
  return d;
}

/** Pull the shared server copy (null if none / unconfigured). */
export async function pullWorkshop(): Promise<WorkshopState | null> {
  const r = await pullRemote<WorkshopState>(RK);
  if (!r || !r.stages || !r.staff) return null;
  return withNewSeedStages({ ...r, reviewed: r.reviewed ?? [] });
}

export function exportWorkshop(state: WorkshopState): string {
  return JSON.stringify(state, null, 2);
}
