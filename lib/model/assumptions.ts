"use client";

import { useEffect, useState } from "react";
import { baseline, rates } from "./baseline";

// Every global assumption behind the model — surfaced and editable on /confirm,
// threaded through the engine via DataCtx. Per-process detail (who/intensity/
// automatability) lives in the Workshop; this is the world those processes sit in.

export interface Assumptions {
  financials: {
    gp: number;
    tradNet: number;
    digitalNet: number;
    peopleCost: number;
    otherOpex: number;
    tooling: number;
    fte: number;
  };
  rates: {
    loadedHourlyToday: number;
    loadedHourlyZero: number;
    productiveHoursPerMonth: number;
  };
  /** fraction of a process that STAYS human at each automatability level (none = 1) */
  residual: { some: number; most: number; nearlyAll: number };
  /** time-weight of a process per assigned person (normal = 1) */
  intensity: { light: number; heavy: number };
  /** how far the Conservatism dial moves the automation assumption */
  conservatismStress: number;
  /** digital fee compression p.a. used across scenarios */
  feeCompression: number;
  /** combined market-rate MD + CEO salaries */
  ownerComp: number;
  /** planned Zero-state AI/tooling budget */
  aiSpendZero: number;
  /** the profit line we don't want to fall below */
  profitFloor: number;
  /** avg payout weeks per departing role (redundancy) */
  redundancyWeeks: number;
}

export function defaultAssumptions(): Assumptions {
  return {
    financials: {
      gp: baseline.gp.value,
      tradNet: baseline.tradNet.value,
      digitalNet: baseline.digitalNet.value,
      peopleCost: baseline.peopleCost.value,
      otherOpex: baseline.otherOpex.value,
      tooling: baseline.tooling.value,
      fte: baseline.fte.value,
    },
    rates: {
      loadedHourlyToday: rates.loadedHourlyToday,
      loadedHourlyZero: rates.loadedHourlyZero,
      productiveHoursPerMonth: rates.productiveHoursPerMonth,
    },
    residual: { some: 0.5, most: 0.25, nearlyAll: 0.1 },
    intensity: { light: 0.5, heavy: 2 },
    conservatismStress: 0.2,
    feeCompression: 0.08,
    ownerComp: 400_000,
    aiSpendZero: 160_000,
    profitFloor: 1_000_000,
    redundancyWeeks: 8,
  };
}

/** Frozen default the engine falls back to when no override is supplied. */
export const DEFAULT_ASSUMPTIONS = defaultAssumptions();

const KEY = "az_assumptions_v1";

export function loadAssumptions(): Assumptions {
  if (typeof window === "undefined") return defaultAssumptions();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultAssumptions();
    // shallow-merge so new fields survive older saves
    const saved = JSON.parse(raw);
    const d = defaultAssumptions();
    return {
      ...d,
      ...saved,
      financials: { ...d.financials, ...saved.financials },
      rates: { ...d.rates, ...saved.rates },
      residual: { ...d.residual, ...saved.residual },
      intensity: { ...d.intensity, ...saved.intensity },
    };
  } catch {
    return defaultAssumptions();
  }
}

export function saveAssumptions(a: Assumptions) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(a));
}

export function resetAssumptions(): Assumptions {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  return defaultAssumptions();
}

/** Read-only hook for consumer screens: returns the saved assumptions (defaults on server/first paint). */
export function useAssumptions(): Assumptions {
  const [a, setA] = useState<Assumptions>(defaultAssumptions);
  useEffect(() => setA(loadAssumptions()), []);
  return a;
}
