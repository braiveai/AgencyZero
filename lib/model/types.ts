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

// ---- staff roster ----------------------------------------------------------
// The workshop backbone: today's people, by ROLE (never names). A person's FTE
// splits evenly across every process they're assigned to, so the whole map
// auto-reconciles to real headcount — no hour estimates required.

export type StaffGroup =
  | "leadership"
  | "digital"
  | "trad"
  | "strategy"
  | "finance"
  | "support"
  | "sales";

export interface StaffRole {
  id: string;
  label: string;
  /** FTE — 1 = full time, 0.5 = part time */
  fte: number;
  group: StaffGroup;
}

export const GROUP_LABEL_ORDER: StaffGroup[] = [
  "leadership",
  "digital",
  "trad",
  "strategy",
  "finance",
  "support",
  "sales",
];

/** How time-heavy a process is per person who does it — weights the FTE split so
 * high-touch work (the phone, negotiation, strategy) isn't diluted by admin rows. */
export type Intensity = "light" | "normal" | "heavy";
export const INTENSITY_WEIGHT: Record<Intensity, number> = { light: 0.5, normal: 1, heavy: 2 };
export const INTENSITY_LABEL: Record<Intensity, string> = {
  light: "Light — a small slice of their time",
  normal: "Normal",
  heavy: "Heavy — a big slice of their time",
};

/** How much of a process AI can take. Plain-English front for the L0–L4 ladder. */
export type Automatability = "none" | "some" | "most" | "nearly-all";

/** Fraction of the work that STAYS human at each automatability level. */
export const RESIDUAL_FRAC: Record<Automatability, number> = {
  none: 1, // L0/L1 — human
  some: 0.5, // L1
  most: 0.25, // L2
  "nearly-all": 0.1, // L3
};

export const AUTOMATABILITY_LABEL: Record<Automatability, string> = {
  none: "None — stays human",
  some: "Some — AI assists",
  most: "Most — AI does it, human reviews",
  "nearly-all": "Nearly all — AI runs it, human handles exceptions",
};

export const AUTO_TO_LADDER: Record<Automatability, AutomationLevel> = {
  none: "L1",
  some: "L1",
  most: "L2",
  "nearly-all": "L3",
};

export interface Process {
  id: string;
  label: string;
  /** plain-English "what this actually is" — shown on hover */
  description: string;
  /** would the rebuilt agency even do this? false ⇒ 0 at Zero */
  required: boolean;
  /** staff role ids who touch this process today (drives derived FTE) */
  staffIds: string[];
  /** how much of it AI can take */
  automatability: Automatability;
  /** how time-heavy it is per assigned person (weights the FTE split) */
  intensity: Intensity;
  escalation: Escalation | null;
  clientFacing: boolean;
  /** ids into the tool catalogue */
  tools: string[];

  // ---- legacy strawman fields (kept for reference; superseded by staff allocation) ----
  hoursPerMonth?: number;
  automationLevel?: AutomationLevel;
  aiRunCostPerMonth?: number;
  residualHoursPerMonth?: number;
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
