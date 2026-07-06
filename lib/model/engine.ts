import { baseline, rates } from "./baseline";
import { stages } from "./processes";
import type { AutomationLevel, Process, Stage } from "./types";

// ---------------------------------------------------------------------------
// Agency Zero calc engine — pure functions, no I/O, unit-tested.
// The headcount numbers are DERIVED from residual hours, never asserted, so any
// single process re-levelling flows through the whole model live.
// ---------------------------------------------------------------------------

export type Conservatism = "optimistic" | "base" | "conservative";

/** How far assumed inputs (residual hours) move under the conservatism dial. */
export const ASSUMED_STRESS = 0.2;
/** Financial tolerance flexed by the output band (revenue estimated ±10%). */
export const REVENUE_BAND = 0.1;
export const OPEX_BAND = 0.05;
/** L2 residual floor a demoted (unescalated L3/L4) process falls back to. */
export const L2_FLOOR_FRAC = 0.15;

export interface ScenarioParams {
  /** annual growth applied to both revenue lines unless overridden */
  revenueGrowth: number;
  tradGrowth?: number;
  digitalGrowth?: number;
  /** annual digital fee compression — the threat slider */
  feeCompression: number;
  /** target FTE per stage (defaults to derived fteZero) */
  fteByStage: Record<string, number>;
  /** annual loaded cost per head ($) */
  loadedCostPerHead: number;
  /** platform tooling $/yr on top of per-process AI run costs */
  aiSpendPerYear: number;
  /** 0..1 — scales how much of the today→zero delta is realised */
  adoptionRate: number;
  ownerCompInOpex: boolean;
  ownerComp: number;
  /** horizon year (0 = today) */
  horizonYear: number;
  conservatism: Conservatism;
  /** years to full realisation of the zero org (ramp) */
  rampYears?: number;
  /** one-off redundancy cost booked in this horizon year (0 if none) */
  redundancyThisYear?: number;
}

const consSign = (c: Conservatism): number =>
  c === "conservative" ? 1 : c === "optimistic" ? -1 : 0;

/** Demotion rule: L3/L4 without an escalation path can't claim autonomy residual. */
export function isDemoted(p: Process): boolean {
  return (p.automationLevel === "L3" || p.automationLevel === "L4") && p.escalation == null;
}

/** Effective residual hours after the demotion rule + conservatism stress. */
export function effectiveResidual(p: Process, c: Conservatism): number {
  let residual = p.residualHoursPerMonth;
  if (isDemoted(p)) {
    // can't claim hands-off — fall back to the L2 review floor if that's higher
    residual = Math.max(residual, p.hoursPerMonth * L2_FLOOR_FRAC);
  }
  return residual * (1 + consSign(c) * ASSUMED_STRESS);
}

/** Derived FTE-at-Zero for a stage = Σ residual ÷ productive hours/month. */
export function fteZeroForStage(stage: Stage, c: Conservatism = "base"): number {
  const residual = stage.processes.reduce((s, p) => s + effectiveResidual(p, c), 0);
  return residual / rates.productiveHoursPerMonth;
}

/** FTE-at-Zero map across all stages, seeding the Model screen steppers. */
export function deriveZeroFteByStage(c: Conservatism = "base"): Record<string, number> {
  return Object.fromEntries(stages.map((s) => [s.id, fteZeroForStage(s, c)]));
}

export function totalZeroFte(c: Conservatism = "base"): number {
  return stages.reduce((s, st) => s + fteZeroForStage(st, c), 0);
}

export const totalTodayFte = (): number =>
  stages.reduce((s, st) => s + st.fteToday.value, 0);

/** Ramp profile 0→1: full realisation by rampYears (default 2 ≈ H1–H2). */
export function ramp(t: number, rampYears = 2): number {
  if (t <= 0) return 0;
  return Math.min(1, t / rampYears);
}

// ---- outputs --------------------------------------------------------------

export interface ModelOutputs {
  netRevenue: number;
  peopleCost: number;
  aiOpex: number;
  otherOpex: number;
  redundancy: number;
  profit: number;
  totalFte: number;
  profitPerHead: number;
  gpPerHead: number;
  payrollRatio: number;
  /** proxy for the thinnest month's cash after the transition */
  thinMonthCushion: number;
  /** distance above the $1m profit floor */
  floorHeadroom: number;
}

const PROFIT_FLOOR = 1_000_000;

export function netRevenue(p: ScenarioParams): number {
  const tradG = p.tradGrowth ?? p.revenueGrowth;
  const digG = p.digitalGrowth ?? p.revenueGrowth;
  const t = p.horizonYear;
  const trad = baseline.tradNet.value * Math.pow(1 + tradG, t);
  const digital = baseline.digitalNet.value * Math.pow(1 + digG - p.feeCompression, t);
  return trad + digital;
}

/** Realised FTE for a stage glides today→target as adoption ramps. */
export function realisedFteForStage(stage: Stage, p: ScenarioParams): number {
  const today = stage.fteToday.value;
  const target = p.fteByStage[stage.id] ?? fteZeroForStage(stage, p.conservatism);
  return today - (today - target) * p.adoptionRate * ramp(p.horizonYear, p.rampYears);
}

export function totalRealisedFte(p: ScenarioParams): number {
  return stages.reduce((s, st) => s + realisedFteForStage(st, p), 0);
}

export function peopleCost(p: ScenarioParams): number {
  const fte = totalRealisedFte(p);
  const owner = p.ownerCompInOpex ? p.ownerComp : 0;
  return fte * p.loadedCostPerHead + owner;
}

export function aiOpex(p: ScenarioParams): number {
  const realise = p.adoptionRate * ramp(p.horizonYear, p.rampYears);
  const runCost = stages.reduce(
    (s, st) => s + st.processes.reduce((a, pr) => a + pr.aiRunCostPerMonth, 0),
    0,
  );
  return runCost * 12 * realise + p.aiSpendPerYear;
}

export function runModel(p: ScenarioParams): ModelOutputs {
  const nr = netRevenue(p);
  const people = peopleCost(p);
  const ai = aiOpex(p);
  const other = baseline.otherOpex.value;
  const redundancy = p.redundancyThisYear ?? 0;
  const profit = nr - people - ai - other - redundancy;
  const fte = totalRealisedFte(p);

  // thin-month proxy: preserve today's worst-month-to-average ratio, applied fwd.
  const avgBase = baseline.monthlyProfit.reduce((a, b) => a + b, 0) / 12;
  const minBase = Math.min(...baseline.monthlyProfit);
  const thinRatio = avgBase > 0 ? minBase / avgBase : 0;
  const thinMonthCushion = (profit / 12) * thinRatio;

  return {
    netRevenue: nr,
    peopleCost: people,
    aiOpex: ai,
    otherOpex: other,
    redundancy,
    profit,
    totalFte: fte,
    profitPerHead: fte > 0 ? profit / fte : 0,
    gpPerHead: fte > 0 ? nr / fte : 0,
    payrollRatio: nr > 0 ? people / nr : 0,
    thinMonthCushion,
    floorHeadroom: profit - PROFIT_FLOOR,
  };
}

// ---- sensitivity band ------------------------------------------------------

export interface Banded<T> {
  low: T;
  base: T;
  high: T;
}

/**
 * Financial tolerance band around the current (conservatism-set) point.
 * The conservatism dial owns the FTE/residual assumption; the band owns the
 * money — "even if revenue is ±10% and opex ±5%, here's the spread." No double
 * count: FTE is held fixed by the dial while the financials flex.
 */
export function runModelBanded(p: ScenarioParams): Banded<ModelOutputs> {
  const base = runModel(p);
  const flex = (revMul: number, opexMul: number): ModelOutputs => {
    const nr = netRevenue(p) * revMul;
    const people = peopleCost(p) * opexMul;
    const ai = aiOpex(p) * opexMul;
    const other = baseline.otherOpex.value * opexMul;
    const redundancy = p.redundancyThisYear ?? 0;
    const profit = nr - people - ai - other - redundancy;
    const fte = totalRealisedFte(p);
    const avgBase = baseline.monthlyProfit.reduce((a, b) => a + b, 0) / 12;
    const thinRatio = avgBase > 0 ? Math.min(...baseline.monthlyProfit) / avgBase : 0;
    return {
      netRevenue: nr,
      peopleCost: people,
      aiOpex: ai,
      otherOpex: other,
      redundancy,
      profit,
      totalFte: fte,
      profitPerHead: fte > 0 ? profit / fte : 0,
      gpPerHead: fte > 0 ? nr / fte : 0,
      payrollRatio: nr > 0 ? people / nr : 0,
      thinMonthCushion: (profit / 12) * thinRatio,
      floorHeadroom: profit - PROFIT_FLOOR,
    };
  };
  return {
    // profit-favourable: revenue up, costs down
    high: flex(1 + REVENUE_BAND, 1 - OPEX_BAND),
    base,
    // profit-unfavourable: revenue down, costs up
    low: flex(1 - REVENUE_BAND, 1 + OPEX_BAND),
  };
}

// ---- ladder helpers (for the UI) ------------------------------------------

export const ladderResidualFrac = (p: Process): number =>
  p.hoursPerMonth > 0 ? p.residualHoursPerMonth / p.hoursPerMonth : 0;

export function levelOf(p: Process): AutomationLevel {
  return isDemoted(p) ? "L2" : p.automationLevel;
}
