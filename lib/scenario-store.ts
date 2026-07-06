"use client";

import type { ScenarioParams } from "@/lib/model/engine";

const KEY = "az_scenarios_v1";

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
  return next;
}

export function deleteScenario(id: string): SavedScenario[] {
  const next = loadScenarios().filter((s) => s.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
