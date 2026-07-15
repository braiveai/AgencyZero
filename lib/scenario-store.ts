"use client";

import type { ScenarioParams } from "@/lib/model/engine";
import { pullRemote, pushRemote } from "@/lib/remote";
import { saveWorkshop } from "@/lib/workshop-store";
import { saveAssumptions } from "@/lib/model/assumptions";

const KEY = "az_scenarios_v1";
const RK = "scenarios";

export interface SavedScenario {
  id: string;
  name: string;
  params: ScenarioParams;
  savedAt: number;
}

export function loadScenarios(): SavedScenario[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveScenario(name: string, params: ScenarioParams): SavedScenario[] {
  const all = loadScenarios();
  const id = `${Date.now()}-${Math.round(performance.now())}`;
  const next = [{ id, name, params, savedAt: Date.now() }, ...all].slice(0, 30);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  pushRemote(RK, next);
  return next;
}

export function deleteScenario(id: string): SavedScenario[] {
  const next = loadScenarios().filter((s) => s.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  pushRemote(RK, next);
  return next;
}

/** Whether a saved scenario carries a full ctx snapshot we can restore. */
export function hasSnapshot(s: SavedScenario): boolean {
  return !!s.params.ctx?.stages?.length && !!s.params.ctx?.staff?.length;
}

// One-shot handoff for the Model page: the exact slider params of a restored
// scenario, so the dials (growth, adoption, horizon, costs, owner-comp, per-stage
// FTE) match the run — not the default preset the Model page would otherwise seed.
const PENDING_KEY = "az_pending_model_params";

export function stashModelParams(params: ScenarioParams) {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(params));
  }
}

/** Read and clear the pending model params (null if none). */
export function takeModelParams(): ScenarioParams | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(PENDING_KEY);
  try {
    return JSON.parse(raw) as ScenarioParams;
  } catch {
    return null;
  }
}

/**
 * Restore a saved scenario as the live model. Its frozen ctx (stages + staff +
 * assumptions) goes into the Workshop + Confirm stores — driving Rebuild, Org,
 * Horizons, Start and the Deck — and its slider params are stashed for the Model
 * page, so every screen reflects exactly what this scenario was built on.
 * Returns true if it restored anything.
 */
export function restoreScenarioToModel(s: SavedScenario): boolean {
  const ctx = s.params.ctx;
  if (!ctx?.stages?.length || !ctx?.staff?.length) return false;
  saveWorkshop({ stages: ctx.stages, staff: ctx.staff, reviewed: [] });
  if (ctx.assumptions) saveAssumptions(ctx.assumptions);
  stashModelParams(s.params);
  return true;
}

/** Pull the shared server list; merges with any local-only saves (by id). */
export async function pullScenarios(): Promise<SavedScenario[] | null> {
  const remote = await pullRemote<SavedScenario[]>(RK);
  if (!remote) return null;
  const local = loadScenarios();
  const byId = new Map<string, SavedScenario>();
  for (const s of [...remote, ...local]) byId.set(s.id, s);
  const merged = [...byId.values()].sort((a, b) => b.savedAt - a.savedAt).slice(0, 30);
  window.localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}
