// Agency Zero — domain types.
// Every uncertain quantity is a Metric carrying its own confidence + tolerance,
// so the calc engine can propagate bands and the UI can surface provenance on hover.

export type Confidence = "verified" | "estimated" | "assumed";

/** A number that knows how much to trust itself. */
export interface Metric {
  value: number;
  confidence: Confidence;
  /** fractional band, e.g. 0.10 = ±10% */
  tolerance: number;
}

export const m = (
  value: number,
  confidence: Confidence,
  tolerance: number,
): Metric => ({ value, confidence, tolerance });

/** Default tolerance bands by confidence, per the brief. */
export const DEFAULT_TOLERANCE: Record<Confidence, number> = {
  verified: 0.05,
  estimated: 0.1,
  assumed: 0.2,
};

// ---- Automation ladder -----------------------------------------------------

export type AutomationLevel = "L0" | "L1" | "L2" | "L3" | "L4";

export const LADDER: Record<
  AutomationLevel,
  { label: string; blurb: string; typicalResidual: [number, number] }
> = {
  L0: { label: "Human only", blurb: "100% of today's hours", typicalResidual: [1, 1] },
  L1: { label: "Human-led, AI-assisted", blurb: "AI accelerates; human does the work", typicalResidual: [0.4, 0.7] },
  L2: { label: "AI-led, human-reviewed", blurb: "AI produces; human approves every output", typicalResidual: [0.15, 0.3] },
  L3: { label: "AI-autonomous, exceptions", blurb: "Human sees only escalations", typicalResidual: [0.05, 0.15] },
  L4: { label: "Fully hands-off", blurb: "~0% residual — treat with extreme scepticism", typicalResidual: [0, 0.05] },
};

/** Required for any process claiming L3/L4 autonomy — else it demotes to L2. */
export interface Escalation {
  trigger: string;
  owner: string;
  slaHours: number;
  clientFacingRisk?: boolean;
}

export interface Process {
  id: string;
  label: string;
  /** human hours/month today (assumed confidence — workshop seed) */
  hoursPerMonth: number;
  automationLevel: AutomationLevel;
  /** $/month to run the AI for this process */
  aiRunCostPerMonth: number;
  /** review time (L2) or exception-handling time (L3) that survives automation */
  residualHoursPerMonth: number;
  escalation: Escalation | null;
  clientFacing: boolean;
  /** ids into the tool catalogue */
  tools: string[];
}

export interface Stage {
  id: string;
  order: number;
  label: string;
  /** one-line "what it covers" */
  covers: string;
  fteToday: Metric;
  processes: Process[];
}

export interface Baseline {
  fy: string;
  gp: Metric;
  tradNet: Metric;
  digitalNet: Metric;
  peopleCost: Metric;
  /** non-people, non-tooling opex (reconciled — excludes the tooling line so the model can flex tooling separately) */
  otherOpex: Metric;
  tooling: Metric;
  netProfit: Metric;
  fte: Metric;
  /** 12 months of net profit, Jul→Jun (FY26) */
  monthlyProfit: number[];
  /** headline concentration mined from sunnyrev (gross-billings basis) */
  concentration: { top3: number; top5: number; top10: number; clients: number };
}

export interface Rates {
  loadedHourlyToday: number;
  loadedHourlyZero: number;
  productiveHoursPerMonth: number;
}

export interface ToolEntry {
  id: string;
  name: string;
  blurb: string;
  /** stage ids this tool serves */
  stages: string[];
  /** where it sits on the ladder when fully adopted */
  ladder: AutomationLevel;
  adoption: "high" | "partial" | "low";
}

export interface AgencyData {
  baseline: Baseline;
  rates: Rates;
  stages: Stage[];
  tools: ToolEntry[];
}
