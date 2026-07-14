"use client";

import { useEffect, useState } from "react";
import { baseline, rates } from "./baseline";
import { pullRemote, pushRemote } from "@/lib/remote";

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

const KEY = "az_assumptions_v1"; // localStorage
const RK = "assumptions"; // server key (matches the API allow-list)

/** Merge a saved/remote blob over defaults so new fields always exist. */
function merge(saved: Partial<Assumptions> | null): Assumptions {
  const d = defaultAssumptions();
  if (!saved) return d;
  return {
    ...d,
    ...saved,
    financials: { ...d.financials, ...saved.financials },
    rates: { ...d.rates, ...saved.rates },
    residual: { ...d.residual, ...saved.residual },
    intensity: { ...d.intensity, ...saved.intensity },
  };
}

export function loadAssumptions(): Assumptions {
  if (typeof window === "undefined") return defaultAssumptions();
  try {
    return merge(JSON.parse(window.localStorage.getItem(KEY) || "null"));
  } catch {
    return defaultAssumptions();
  }
}

export function saveAssumptions(a: Assumptions) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(a));
  pushRemote(RK, a);
}

export function resetAssumptions(): Assumptions {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  const d = defaultAssumptions();
  pushRemote(RK, d);
  return d;
}

/** Read-only hook for consumer screens: returns the saved assumptions (localStorage
 *  first for an instant paint, then the shared server copy if there is one). */
export function useAssumptions(): Assumptions {
  const [a, setA] = useState<Assumptions>(defaultAssumptions);
  useEffect(() => {
    setA(loadAssumptions());
    pullRemote<Partial<Assumptions>>(RK).then((r) => {
      if (r) {
        const merged = merge(r);
        setA(merged);
        if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(merged));
      }
    });
  }, []);
  return a;
}
