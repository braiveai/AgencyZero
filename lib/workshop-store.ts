"use client";

import { stages as defaultStages } from "@/lib/model/processes";
import { staff as defaultStaff } from "@/lib/model/staff";
import type { Stage, StaffRole } from "@/lib/model/types";

const KEY = "az_workshop_v1";

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

export function loadWorkshop(): WorkshopState {
  if (typeof window === "undefined") return defaultWorkshop();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultWorkshop();
    const s = JSON.parse(raw) as WorkshopState;
    if (!s.stages || !s.staff) return defaultWorkshop();
    return { ...s, reviewed: s.reviewed ?? [] };
  } catch {
    return defaultWorkshop();
  }
}

export function saveWorkshop(state: WorkshopState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetWorkshop(): WorkshopState {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  return defaultWorkshop();
}

export function exportWorkshop(state: WorkshopState): string {
  return JSON.stringify(state, null, 2);
}
