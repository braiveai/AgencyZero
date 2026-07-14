import type { StaffRole } from "./types";

// Today's roster. `label`/`title` are the roles (shown by default, per the brief's
// "who would we hire, not who we fire" rule). `name` is the real person — revealed
// only when "Show names" is toggled on the Org Chart. `pod` is their manager, for
// the org-chart tree. FTE splits across the processes each role touches, so the map
// reconciles to headcount.

export const staff: StaffRole[] = [
  { id: "ceo", label: "CEO", title: "CEO", name: "Sarah McNeil", fte: 1, group: "leadership" },

  { id: "dig-ad-1", label: "Digital Account Director — Pod 1", title: "Account Director (Digital)", name: "Mallory Cassidy", fte: 1, group: "digital", pod: "ceo" },
  { id: "dig-ad-2", label: "Digital Account Director — Pod 2", title: "Account Director (Digital)", name: "Paige Netherwood", fte: 1, group: "digital", pod: "ceo" },
  { id: "dig-spec-3", label: "Digital Specialist", title: "Snr Media Specialist / Design", name: "Yasmine Delaney", fte: 1, group: "digital", pod: "dig-ad-1" },
  { id: "dig-spec-4", label: "Digital Specialist", title: "Senior Media Specialist", name: "Holly Dymock", fte: 1, group: "digital", pod: "dig-ad-1" },
  { id: "dig-spec-6", label: "Digital Specialist", title: "Jnr Media Specialist (hybrid)", name: "Darcy Renfrey", fte: 1, group: "digital", pod: "dig-ad-1" },
  { id: "dig-spec-1", label: "Digital Specialist", title: "Snr Media Specialist", name: "Vincent Whittington", fte: 1, group: "digital", pod: "dig-ad-2" },
  { id: "dig-spec-2", label: "Digital Specialist", title: "Senior Media Specialist", name: "Dale Hickey", fte: 1, group: "digital", pod: "dig-ad-2" },
  { id: "dig-spec-5", label: "Digital Specialist", title: "Jnr Media Specialist", name: "Melissa Fahey", fte: 1, group: "digital", pod: "dig-ad-2" },

  { id: "trad-ad", label: "Traditional Account Director", title: "Account Director (Traditional)", name: "Brittany Munro", fte: 1, group: "trad", pod: "ceo" },
  { id: "trad-am", label: "Traditional Account Manager", title: "Account Manager", name: "Ella Rupp", fte: 1, group: "trad", pod: "trad-ad" },
  { id: "trad-coord-1", label: "Account Coordinator 1", title: "Account Coordinator", name: "Lily Hunter", fte: 1, group: "trad", pod: "trad-ad" },
  { id: "trad-coord-2", label: "Account Coordinator 2", title: "Account Coordinator", name: "Ella Bowles", fte: 1, group: "trad", pod: "trad-ad" },

  { id: "strat-hybrid", label: "Media Strategist / Sales hybrid", title: "Media Strategist (Sales — hybrid)", name: "Darcy Renfrey", fte: 1, group: "sales", pod: "ceo" },
  { id: "strat-tba", label: "Media Strategist (TBA)", title: "Media Strategist", name: "TBA", fte: 0.5, group: "sales", pod: "ceo" },
  { id: "strat-pt", label: "Media Strategist (P/T)", title: "Media Strategist (P/T)", name: "Linda Powell", fte: 0.5, group: "strategy", pod: "dig-ad-1" },
  { id: "sales-internal", label: "Internal Sales (hybrid)", title: "Business Development", fte: 0.5, group: "sales", pod: "ceo" },

  { id: "cfo", label: "CFO", title: "CFO", name: "Sarah Allen", fte: 1, group: "finance", pod: "ceo" },
  { id: "accounts", label: "Accounts", title: "Accounts", name: "Sharon Larkins", fte: 1, group: "finance", pod: "cfo" },

  { id: "ea", label: "EA to CEO (P/T)", title: "Executive Assistant to CEO (P/T)", name: "Nicole Moore", fte: 0.5, group: "support", pod: "ceo" },
];

/** Partners / shareholders — on the org chart but OUTSIDE the model (excl. partners). */
export const partners = [
  { title: "Managing Director", name: "Roger Delaney" },
  { title: "Shareholder", name: "Trevor Larkins" },
  { title: "Shareholder (Consultant)", name: "Matt Travers" },
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
