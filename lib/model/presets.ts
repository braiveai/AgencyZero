import { baseline, rates } from "./baseline";
import { stages } from "./processes";
import { deriveZeroFteByStage, type Conservatism, type ScenarioParams } from "./engine";

export const OWNER_COMP_DEFAULT = 400_000; // combined MD + CEO market-rate placeholder

const loadedTodayAnnual = rates.loadedHourlyToday * rates.productiveHoursPerMonth * 12; // ~110k
const loadedZeroAnnual = rates.loadedHourlyZero * rates.productiveHoursPerMonth * 12; // ~144k

const todayFteByStage = (): Record<string, number> =>
  Object.fromEntries(stages.map((s) => [s.id, s.fteToday.value]));

const midpointFteByStage = (): Record<string, number> => {
  const zero = deriveZeroFteByStage("base");
  return Object.fromEntries(
    stages.map((s) => [s.id, (s.fteToday.value + zero[s.id]) / 2]),
  );
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
): Preset[] {
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

/** Default Model-screen starting point = the Agency Zero preset at base. */
export const defaultParams = (): ScenarioParams =>
  makePresets("base", 3).find((p) => p.key === "agency-zero")!.params;
