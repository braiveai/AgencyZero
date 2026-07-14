"use client";

import type { ScenarioParams } from "@/lib/model/engine";
import { pullRemote, pushRemote } from "@/lib/remote";

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
