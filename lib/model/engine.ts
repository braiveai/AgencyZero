import { baseline } from "./baseline";
import { stages as defaultStages } from "./processes";
import { staff as defaultStaff } from "./staff";
import {
  INTENSITY_WEIGHT,
  RESIDUAL_FRAC,
  type Automatability,
  type Process,
  type Stage,
  type StaffRole,
} from "./types";

// ---------------------------------------------------------------------------
// Agency Zero calc engine — pure functions, no I/O, unit-tested.
//
// FTE is DERIVED from staff allocation, never asserted: each person's FTE splits
// evenly across every process they touch, so the whole map auto-reconciles to
// headcount. Zero-FTE per process = required ? todayFTE × residualFrac : 0.
// Any re-assignment, cut, or automatability change flows through the whole model.
// ---------------------------------------------------------------------------

export type Conservatism = "optimistic" | "base" | "conservative";

/** How far the conservatism dial moves the automation assumption. */
export const ASSUMED_STRESS = 0.2;
export const REVENUE_BAND = 0.1;
export const OPEX_BAND = 0.05;

/** Editable data context — defaults to the seeded strawman; the workshop passes edits. */
export interface DataCtx {
  stages: Stage[];
  staff: StaffRole[];
}
const ctxOf = (c?: DataCtx): DataCtx => c ?? { stages: defaultStages, staff: defaultStaff };

const consSign = (c: Conservatism): number =>
  c === "conservative" ? 1 : c === "optimistic" ? -1 : 0;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// ---- allocation ------------------------------------------------------------

const pWeight = (p: Process): number => INTENSITY_WEIGHT[p.intensity];

/** Total intensity-weight of processes each staff role is assigned to. Also counts
 *  raw assignments (for the "unallocated" gap). */
export function assignmentCounts(ctx?: DataCtx): Record<string, number> {
  const { stages } = ctxOf(ctx);
  const counts: Record<string, number> = {};
  for (const st of stages) for (const p of st.processes) for (const id of p.staffIds) {
    counts[id] = (counts[id] ?? 0) + pWeight(p);
  }
  return counts;
}

const rosterMap = (ctx?: DataCtx) => {
  const m: Record<string, StaffRole> = {};
  for (const r of ctxOf(ctx).staff) m[r.id] = r;
  return m;
};

/** Derived FTE a process consumes today = Σ (assigned staff FTE × this process's
 *  weight ÷ that person's total assigned weight). Heavy work isn't diluted by admin. */
export function todayFteForProcess(p: Process, ctx?: DataCtx, weights?: Record<string, number>): number {
  const w = weights ?? assignmentCounts(ctx);
  const roster = rosterMap(ctx);
  return p.staffIds.reduce((s, id) => {
    const role = roster[id];
    if (!role || !w[id]) return s;
    return s + (role.fte * pWeight(p)) / w[id];
  }, 0);
}

/** Demotion rule: "nearly-all" without an escalation path can't claim autonomy. */
export function effectiveAutomatability(p: Process): Automatability {
  if (p.automatability === "nearly-all" && p.escalation == null) return "most";
  return p.automatability;
}

/** Fraction of a process that stays human, after demotion + conservatism stress. */
export function residualFrac(p: Process, c: Conservatism = "base"): number {
  const base = RESIDUAL_FRAC[effectiveAutomatability(p)];
  const automated = 1 - base;
  const adjusted = clamp01(automated * (1 - consSign(c) * ASSUMED_STRESS));
  return 1 - adjusted; // 1 = fully human
}

/** Zero-state FTE for a process: cut if not required, else the human residual. */
export function zeroFteForProcess(p: Process, c: Conservatism = "base", ctx?: DataCtx, counts?: Record<string, number>): number {
  if (!p.required) return 0;
  return todayFteForProcess(p, ctx, counts) * residualFrac(p, c);
}

export function fteTodayForStage(stage: Stage, ctx?: DataCtx, counts?: Record<string, number>): number {
  const c = counts ?? assignmentCounts(ctx);
  return stage.processes.reduce((s, p) => s + todayFteForProcess(p, ctx, c), 0);
}
export function fteZeroForStage(stage: Stage, con: Conservatism = "base", ctx?: DataCtx, counts?: Record<string, number>): number {
  const c = counts ?? assignmentCounts(ctx);
  return stage.processes.reduce((s, p) => s + zeroFteForProcess(p, con, ctx, c), 0);
}

export function deriveZeroFteByStage(con: Conservatism = "base", ctx?: DataCtx): Record<string, number> {
  const c = assignmentCounts(ctx);
  return Object.fromEntries(ctxOf(ctx).stages.map((s) => [s.id, fteZeroForStage(s, con, ctx, c)]));
}
export function totalZeroFte(con: Conservatism = "base", ctx?: DataCtx): number {
  const c = assignmentCounts(ctx);
  return ctxOf(ctx).stages.reduce((s, st) => s + fteZeroForStage(st, con, ctx, c), 0);
}
export function totalTodayFte(ctx?: DataCtx): number {
  const c = assignmentCounts(ctx);
  return ctxOf(ctx).stages.reduce((s, st) => s + fteTodayForStage(st, ctx, c), 0);
}

/** Roster FTE not assigned to any process — the "where's the time going" gap. */
export function unallocatedFte(ctx?: DataCtx): number {
  const counts = assignmentCounts(ctx);
  return ctxOf(ctx).staff.reduce((s, r) => s + (counts[r.id] ? 0 : r.fte), 0);
}

export function ramp(t: number, rampYears = 2): number {
  if (t <= 0) return 0;
  return Math.min(1, t / rampYears);
}

// ---- scenario --------------------------------------------------------------

export interface ScenarioParams {
  revenueGrowth: number;
  tradGrowth?: number;
  digitalGrowth?: number;
  feeCompression: number;
  /** target FTE per stage; when absent for a stage, the derived Zero value is used */
  fteByStage: Record<string, number>;
  loadedCostPerHead: number;
  aiSpendPerYear: number;
  adoptionRate: number;
  ownerCompInOpex: boolean;
  ownerComp: number;
  horizonYear: number;
  conservatism: Conservatism;
  rampYears?: number;
  redundancyThisYear?: number;
  /** edited stages/roster from the workshop; defaults to the seeded strawman */
  ctx?: DataCtx;
}

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
  thinMonthCushion: number;
  floorHeadroom: number;
}

const PROFIT_FLOOR = 1_000_000;

export function netRevenue(p: ScenarioParams): number {
  const tradG = p.tradGrowth ?? p.revenueGrowth;
  const digG = p.digitalGrowth ?? p.revenueGrowth;
  const t = p.horizonYear;
  return (
    baseline.tradNet.value * Math.pow(1 + tradG, t) +
    baseline.digitalNet.value * Math.pow(1 + digG - p.feeCompression, t)
  );
}

export function realisedFteForStage(stage: Stage, p: ScenarioParams): number {
  const counts = assignmentCounts(p.ctx);
  const today = fteTodayForStage(stage, p.ctx, counts);
  const target = p.fteByStage[stage.id] ?? fteZeroForStage(stage, p.conservatism, p.ctx, counts);
  return today - (today - target) * p.adoptionRate * ramp(p.horizonYear, p.rampYears);
}
export function totalRealisedFte(p: ScenarioParams): number {
  return ctxOf(p.ctx).stages.reduce((s, st) => s + realisedFteForStage(st, p), 0);
}

export function peopleCost(p: ScenarioParams): number {
  return totalRealisedFte(p) * p.loadedCostPerHead + (p.ownerCompInOpex ? p.ownerComp : 0);
}
export function aiOpex(p: ScenarioParams): number {
  return p.aiSpendPerYear;
}

function assemble(p: ScenarioParams, nr: number, people: number, ai: number, other: number): ModelOutputs {
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
}

export function runModel(p: ScenarioParams): ModelOutputs {
  return assemble(p, netRevenue(p), peopleCost(p), aiOpex(p), baseline.otherOpex.value);
}

export interface Banded<T> { low: T; base: T; high: T }

export function runModelBanded(p: ScenarioParams): Banded<ModelOutputs> {
  const base = runModel(p);
  const flex = (revMul: number, opexMul: number) =>
    assemble(p, netRevenue(p) * revMul, peopleCost(p) * opexMul, aiOpex(p) * opexMul, baseline.otherOpex.value * opexMul);
  return {
    high: flex(1 + REVENUE_BAND, 1 - OPEX_BAND),
    base,
    low: flex(1 - REVENUE_BAND, 1 + OPEX_BAND),
  };
}
