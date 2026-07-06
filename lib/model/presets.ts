import { baseline, rates } from "./baseline";
import { stages } from "./processes";
import {
  deriveZeroFteByStage,
  fteTodayForStage,
  totalTodayFte,
  type Conservatism,
  type ScenarioParams,
} from "./engine";

export const OWNER_COMP_DEFAULT = 400_000; // combined MD + CEO market-rate placeholder

// Today's loaded cost is anchored to verified payroll ÷ derived headcount, so the
// status-quo scenario reconciles to the real people-cost line regardless of roster size.
const loadedTodayAnnual = baseline.peopleCost.value / totalTodayFte();
const loadedZeroAnnual = rates.loadedHourlyZero * rates.productiveHoursPerMonth * 12; // ~144k

const todayFteByStage = (): Record<string, number> =>
  Object.fromEntries(stages.map((s) => [s.id, fteTodayForStage(s)]));

const midpointFteByStage = (): Record<string, number> => {
  const zero = deriveZeroFteByStage("base");
  const today = todayFteByStage();
  return Object.fromEntries(stages.map((s) => [s.id, (today[s.id] + zero[s.id]) / 2]));
};

export interface Preset {
  key: "status-quo" | "agency-zero" | "middle-path";
  name: string;
  blurb: string;
  params: ScenarioParams;
}

export function makePresets(conservatism: Conservatism = "base", horizonYear = 3): Preset[] {
  return [
    {
      key: "status-quo",
      name: "Status Quo",
      blurb: "Drift + digital fee compression. No restructure. Profit erodes toward the floor.",
      params: {
        revenueGrowth: 0,
        feeCompression: 0.08,
        fteByStage: todayFteByStage(),
        loadedCostPerHead: Math.round(loadedTodayAnnual),
        aiSpendPerYear: baseline.tooling.value,
        adoptionRate: 0,
        ownerCompInOpex: false,
        ownerComp: OWNER_COMP_DEFAULT,
        horizonYear,
        conservatism,
      },
    },
    {
      key: "agency-zero",
      name: "Agency Zero",
      blurb: "The full zero-based rebuild. Fewer, more senior, systems-literate. Flat revenue.",
      params: {
        revenueGrowth: 0,
        feeCompression: 0.08,
        fteByStage: deriveZeroFteByStage(conservatism),
        loadedCostPerHead: Math.round(loadedZeroAnnual),
        aiSpendPerYear: 160_000,
        adoptionRate: 1,
        ownerCompInOpex: false,
        ownerComp: OWNER_COMP_DEFAULT,
        horizonYear,
        conservatism,
      },
    },
    {
      key: "middle-path",
      name: "Middle Path",
      blurb: "The likely reality — halfway restructure, partial adoption. Editable.",
      params: {
        revenueGrowth: 0.05,
        feeCompression: 0.08,
        fteByStage: midpointFteByStage(),
        loadedCostPerHead: Math.round((loadedTodayAnnual + loadedZeroAnnual) / 2),
        aiSpendPerYear: 155_000,
        adoptionRate: 0.5,
        ownerCompInOpex: false,
        ownerComp: OWNER_COMP_DEFAULT,
        horizonYear,
        conservatism,
      },
    },
  ];
}

export const defaultParams = (): ScenarioParams =>
  makePresets("base", 3).find((p) => p.key === "agency-zero")!.params;
