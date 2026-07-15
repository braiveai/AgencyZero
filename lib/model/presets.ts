import { stages } from "./processes";
import { staff } from "./staff";
import {
  deriveZeroFteByStage,
  fteTodayForStage,
  totalTodayFte,
  type Conservatism,
  type DataCtx,
  type ScenarioParams,
} from "./engine";
import { DEFAULT_ASSUMPTIONS, type Assumptions } from "./assumptions";

export const OWNER_COMP_DEFAULT = 400_000;

const ctxWith = (a: Assumptions): DataCtx => ({ stages, staff, assumptions: a });

const todayFteByStage = (ctx: DataCtx): Record<string, number> =>
  Object.fromEntries(ctx.stages.map((s) => [s.id, fteTodayForStage(s, ctx)]));

const midpointFteByStage = (ctx: DataCtx): Record<string, number> => {
  const zero = deriveZeroFteByStage("base", ctx);
  const today = todayFteByStage(ctx);
  return Object.fromEntries(ctx.stages.map((s) => [s.id, (today[s.id] + zero[s.id]) / 2]));
};

export interface Preset {
  key: "status-quo" | "agency-zero" | "middle-path";
  name: string;
  blurb: string;
  params: ScenarioParams;
}

export function makePresets(
  conservatism: Conservatism = "base",
  horizonYear = 3,
  a: Assumptions = DEFAULT_ASSUMPTIONS,
  editedCtx?: DataCtx,
): Preset[] {
  // Prefer the edited Workshop ctx (its stages/staff drive the target org); fall
  // back to the seeded strawman. Assumptions always come from `a`.
  const ctx: DataCtx = editedCtx ? { ...editedCtx, assumptions: a } : ctxWith(a);
  // Today's loaded cost is anchored to verified payroll ÷ derived headcount.
  const loadedTodayAnnual = a.financials.peopleCost / totalTodayFte(ctx);
  const loadedZeroAnnual = a.rates.loadedHourlyZero * a.rates.productiveHoursPerMonth * 12;

  return [
    {
      key: "status-quo",
      name: "Status Quo",
      blurb: "Drift + digital fee compression. No restructure. Profit erodes toward the floor.",
      params: {
        revenueGrowth: 0,
        feeCompression: a.feeCompression,
        fteByStage: todayFteByStage(ctx),
        loadedCostPerHead: Math.round(loadedTodayAnnual),
        aiSpendPerYear: a.financials.tooling,
        adoptionRate: 0,
        ownerCompInOpex: false,
        ownerComp: a.ownerComp,
        horizonYear,
        conservatism,
        ctx,
      },
    },
    {
      key: "agency-zero",
      name: "Agency Zero",
      blurb: "The full zero-based rebuild. Fewer, more senior, systems-literate. Flat revenue.",
      params: {
        revenueGrowth: 0,
        feeCompression: a.feeCompression,
        fteByStage: deriveZeroFteByStage(conservatism, ctx),
        loadedCostPerHead: Math.round(loadedZeroAnnual),
        aiSpendPerYear: a.aiSpendZero,
        adoptionRate: 1,
        ownerCompInOpex: false,
        ownerComp: a.ownerComp,
        horizonYear,
        conservatism,
        ctx,
      },
    },
    {
      key: "middle-path",
      name: "Middle Path",
      blurb: "The likely reality — halfway restructure, partial adoption. Editable.",
      params: {
        revenueGrowth: 0.05,
        feeCompression: a.feeCompression,
        fteByStage: midpointFteByStage(ctx),
        loadedCostPerHead: Math.round((loadedTodayAnnual + loadedZeroAnnual) / 2),
        aiSpendPerYear: Math.round((a.financials.tooling + a.aiSpendZero) / 2),
        adoptionRate: 0.5,
        ownerCompInOpex: false,
        ownerComp: a.ownerComp,
        horizonYear,
        conservatism,
        ctx,
      },
    },
  ];
}

export const defaultParams = (
  a: Assumptions = DEFAULT_ASSUMPTIONS,
  editedCtx?: DataCtx,
): ScenarioParams =>
  makePresets("base", 3, a, editedCtx).find((p) => p.key === "agency-zero")!.params;
