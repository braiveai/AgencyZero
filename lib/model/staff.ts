import type { StaffRole } from "./types";

// Today's roster, by ROLE (never names). Seeded from the brief's org description —
// a strawman to correct live in the workshop. A person's FTE splits evenly across
// the processes they're assigned to, so the process map auto-reconciles to headcount.

export const staff: StaffRole[] = [
  { id: "ceo", label: "CEO", fte: 1, group: "leadership" },

  { id: "dig-ad-1", label: "Digital Account Director — Pod 1", fte: 1, group: "digital" },
  { id: "dig-ad-2", label: "Digital Account Director — Pod 2", fte: 1, group: "digital" },
  { id: "dig-spec-1", label: "Digital Specialist 1", fte: 1, group: "digital" },
  { id: "dig-spec-2", label: "Digital Specialist 2", fte: 1, group: "digital" },
  { id: "dig-spec-3", label: "Digital Specialist 3", fte: 1, group: "digital" },
  { id: "dig-spec-4", label: "Digital Specialist 4", fte: 1, group: "digital" },
  { id: "dig-spec-5", label: "Digital Specialist 5", fte: 1, group: "digital" },
  { id: "dig-spec-6", label: "Digital Specialist 6", fte: 1, group: "digital" },

  { id: "trad-ad", label: "Traditional Account Director", fte: 1, group: "trad" },
  { id: "trad-am", label: "Traditional Account Manager", fte: 1, group: "trad" },
  { id: "trad-coord-1", label: "Account Coordinator 1", fte: 1, group: "trad" },
  { id: "trad-coord-2", label: "Account Coordinator 2", fte: 1, group: "trad" },

  { id: "strat-pt", label: "Media Strategist (P/T)", fte: 0.5, group: "strategy" },
  { id: "strat-hybrid", label: "Media Strategist / Sales hybrid", fte: 1, group: "strategy" },
  { id: "strat-tba", label: "Media Strategist (TBA)", fte: 0.5, group: "strategy" },

  { id: "cfo", label: "CFO", fte: 1, group: "finance" },
  { id: "accounts", label: "Accounts", fte: 1, group: "finance" },

  { id: "ea", label: "EA to CEO (P/T)", fte: 0.5, group: "support" },
  { id: "sales-internal", label: "Internal Sales (hybrid)", fte: 0.5, group: "sales" },
];

export const staffFteTotal = (roster: StaffRole[] = staff): number =>
  roster.reduce((s, r) => s + r.fte, 0);

export const GROUP_LABEL: Record<StaffRole["group"], string> = {
  leadership: "Leadership",
  digital: "Digital delivery",
  trad: "Traditional delivery",
  strategy: "Media strategy",
  finance: "Finance",
  support: "Support",
  sales: "Sales",
};
