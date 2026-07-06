import type { Stage } from "./types";

// Per-process inventory across the 8-stage client value chain.
//
// ALL hours + residuals are `assumed` confidence — workshop seeds for the pre-build
// session with Matt. residualHoursPerMonth is chosen to sit inside the ladder band
// for its level (L1 40–70%, L2 15–30%, L3 5–15%), EXCEPT genuinely human-owned work
// (negotiation, discovery, leadership, senior exception handling) which stays high on
// purpose — the moat is the relationship, not the admin around it.
//
// Every L3 process carries a defined escalation path; without one the engine's
// demotion rule treats it as L2 (see lib/model/engine.ts). No escalation, no autonomy.
//
// FTE-at-Zero for each stage is DERIVED = Σ residualHoursPerMonth ÷ productiveHoursPerMonth.
// The stage `fteToday` figures are the estimated current allocation; the per-process
// `hoursPerMonth` sum to fteToday × productiveHours by construction.

export const stages: Stage[] = [
  {
    id: "win",
    order: 1,
    label: "Win",
    covers: "Inbound, outbound, pitching, RFPs",
    fteToday: { value: 1.5, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "lead-qualification", label: "Lead qualification & meeting prep", hoursPerMonth: 25, automationLevel: "L2", aiRunCostPerMonth: 20, residualHoursPerMonth: 7, escalation: null, clientFacing: false, tools: ["architect-search"] },
      { id: "discovery-calls", label: "Discovery calls & relationship", hoursPerMonth: 45, automationLevel: "L1", aiRunCostPerMonth: 8, residualHoursPerMonth: 34, escalation: null, clientFacing: true, tools: [] },
      { id: "rfp-drafting", label: "RFP responses (drafted from win library)", hoursPerMonth: 40, automationLevel: "L2", aiRunCostPerMonth: 55, residualHoursPerMonth: 12, escalation: null, clientFacing: true, tools: ["architect-search", "sa-briefing-tool"] },
      { id: "pitch-decks", label: "Pitch decks", hoursPerMonth: 30, automationLevel: "L2", aiRunCostPerMonth: 45, residualHoursPerMonth: 9, escalation: null, clientFacing: true, tools: ["architect-search"] },
      { id: "pricing-negotiation", label: "Pricing & the room", hoursPerMonth: 60, automationLevel: "L1", aiRunCostPerMonth: 12, residualHoursPerMonth: 54, escalation: null, clientFacing: true, tools: [] },
    ],
  },
  {
    id: "plan",
    order: 2,
    label: "Plan",
    covers: "Strategy, media planning, budgeting, channel selection — begins pre-signature",
    fteToday: { value: 2.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "research-audience", label: "Research & audience work", hoursPerMonth: 55, automationLevel: "L2", aiRunCostPerMonth: 60, residualHoursPerMonth: 15, escalation: null, clientFacing: false, tools: ["architect-search"] },
      { id: "channel-planning", label: "Channel planning", hoursPerMonth: 50, automationLevel: "L1", aiRunCostPerMonth: 25, residualHoursPerMonth: 31, escalation: null, clientFacing: false, tools: [] },
      { id: "budget-splits", label: "Budget splits & flowcharts", hoursPerMonth: 40, automationLevel: "L2", aiRunCostPerMonth: 20, residualHoursPerMonth: 11, escalation: null, clientFacing: false, tools: [] },
      { id: "strategy-decks", label: "Strategy decks", hoursPerMonth: 55, automationLevel: "L2", aiRunCostPerMonth: 45, residualHoursPerMonth: 15, escalation: null, clientFacing: true, tools: ["architect-search"] },
      { id: "proposal-blueprints", label: "Proposal blueprints (senior-owned)", hoursPerMonth: 66, automationLevel: "L1", aiRunCostPerMonth: 40, residualHoursPerMonth: 48, escalation: null, clientFacing: true, tools: ["architect-search", "sa-briefing-tool"] },
    ],
  },
  {
    id: "onboard",
    order: 3,
    label: "Onboard",
    covers: "Contracts, briefing intake, account setup, access, kickoff",
    fteToday: { value: 1.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "contracts", label: "Templated agreements", hoursPerMonth: 25, automationLevel: "L2", aiRunCostPerMonth: 15, residualHoursPerMonth: 6, escalation: null, clientFacing: true, tools: [] },
      { id: "brief-intake", label: "Briefing intake & structuring", hoursPerMonth: 40, automationLevel: "L2", aiRunCostPerMonth: 40, residualHoursPerMonth: 10, escalation: null, clientFacing: true, tools: ["sa-briefing-tool"] },
      { id: "access-provisioning", label: "Platform access & account setup", hoursPerMonth: 24, automationLevel: "L3", aiRunCostPerMonth: 15, residualHoursPerMonth: 3, escalation: { trigger: "provisioning failure or permission mismatch", owner: "Performance Lead", slaHours: 24 }, clientFacing: false, tools: ["insitu"] },
      { id: "tracking-setup", label: "Account & tracking setup", hoursPerMonth: 24, automationLevel: "L3", aiRunCostPerMonth: 20, residualHoursPerMonth: 3, escalation: { trigger: "tracking/tag misfire on QA", owner: "Performance Lead", slaHours: 24 }, clientFacing: false, tools: ["autotracker"] },
      { id: "kickoff-packs", label: "Kickoff packs (seeded from winning blueprint)", hoursPerMonth: 20, automationLevel: "L2", aiRunCostPerMonth: 25, residualHoursPerMonth: 5, escalation: null, clientFacing: true, tools: ["sa-briefing-tool"] },
    ],
  },
  {
    id: "make-buy",
    order: 4,
    label: "Make / Buy",
    covers: "Creative production, trad media buying & booking, digital build & trafficking",
    fteToday: { value: 4.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "trad-bookings", label: "Trad bookings & confirmations", hoursPerMonth: 90, automationLevel: "L3", aiRunCostPerMonth: 40, residualHoursPerMonth: 13, escalation: { trigger: "booking mismatch vs confirmation", owner: "Trad Buyer", slaHours: 8, clientFacingRisk: true }, clientFacing: false, tools: [] },
      { id: "trad-negotiation", label: "Trad negotiation (relationship moat)", hoursPerMonth: 80, automationLevel: "L1", aiRunCostPerMonth: 10, residualHoursPerMonth: 70, escalation: null, clientFacing: true, tools: [] },
      { id: "material-dispatch", label: "Material deadlines & dispatch", hoursPerMonth: 60, automationLevel: "L3", aiRunCostPerMonth: 20, residualHoursPerMonth: 8, escalation: { trigger: "missed material deadline", owner: "Trad Buyer", slaHours: 4, clientFacingRisk: true }, clientFacing: false, tools: [] },
      { id: "digital-build", label: "Digital campaign build", hoursPerMonth: 110, automationLevel: "L2", aiRunCostPerMonth: 70, residualHoursPerMonth: 42, escalation: null, clientFacing: false, tools: ["gads-suite", "architect-search"] },
      { id: "trafficking-qa", label: "Trafficking & QA", hoursPerMonth: 70, automationLevel: "L2", aiRunCostPerMonth: 40, residualHoursPerMonth: 19, escalation: null, clientFacing: false, tools: ["gads-suite"] },
      { id: "creative-variants", label: "Creative production & variants", hoursPerMonth: 122, automationLevel: "L1", aiRunCostPerMonth: 90, residualHoursPerMonth: 60, escalation: null, clientFacing: true, tools: ["ceed"] },
    ],
  },
  {
    id: "optimise",
    order: 5,
    label: "Optimise",
    covers: "Campaign management, pacing, bid/budget optimisation, QA",
    fteToday: { value: 4.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "daily-checks", label: "Daily checks & pacing", hoursPerMonth: 150, automationLevel: "L3", aiRunCostPerMonth: 60, residualHoursPerMonth: 20, escalation: { trigger: "pacing or delivery threshold breach", owner: "Performance Lead", slaHours: 12 }, clientFacing: false, tools: ["redflags"] },
      { id: "bid-budget", label: "Bid & budget optimisation", hoursPerMonth: 120, automationLevel: "L2", aiRunCostPerMonth: 70, residualHoursPerMonth: 38, escalation: null, clientFacing: false, tools: ["gads-suite", "redflags"] },
      { id: "anomaly-response", label: "Anomaly detection & response", hoursPerMonth: 90, automationLevel: "L3", aiRunCostPerMonth: 40, residualHoursPerMonth: 12, escalation: { trigger: "spend / CTR / conversion anomaly", owner: "Performance Lead", slaHours: 6, clientFacingRisk: true }, clientFacing: false, tools: ["redflags"] },
      { id: "cross-account-qa", label: "Cross-account QA", hoursPerMonth: 100, automationLevel: "L2", aiRunCostPerMonth: 45, residualHoursPerMonth: 33, escalation: null, clientFacing: false, tools: ["redflags"] },
      { id: "senior-exception-mgmt", label: "Senior exception management", hoursPerMonth: 72, automationLevel: "L1", aiRunCostPerMonth: 15, residualHoursPerMonth: 56, escalation: null, clientFacing: true, tools: [] },
    ],
  },
  {
    id: "prove",
    order: 6,
    label: "Prove",
    covers: "Reporting, WIPs, client comms, results storytelling — the hidden tax",
    fteToday: { value: 3.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "monthly-reports", label: "Monthly reports", hoursPerMonth: 140, automationLevel: "L3", aiRunCostPerMonth: 55, residualHoursPerMonth: 18, escalation: { trigger: "report figure fails variance/sanity check", owner: "Performance Lead", slaHours: 24, clientFacingRisk: true }, clientFacing: true, tools: ["reporting"] },
      { id: "weekly-wip", label: "Weekly WIP prep & attendance", hoursPerMonth: 80, automationLevel: "L2", aiRunCostPerMonth: 30, residualHoursPerMonth: 27, escalation: null, clientFacing: true, tools: ["reporting"] },
      { id: "adhoc-questions", label: "Ad-hoc client questions", hoursPerMonth: 90, automationLevel: "L2", aiRunCostPerMonth: 25, residualHoursPerMonth: 30, escalation: null, clientFacing: true, tools: ["reporting"] },
      { id: "results-narratives", label: "Results narratives", hoursPerMonth: 89, automationLevel: "L2", aiRunCostPerMonth: 40, residualHoursPerMonth: 30, escalation: null, clientFacing: true, tools: ["reporting", "architect-search"] },
    ],
  },
  {
    id: "collect",
    order: 7,
    label: "Collect",
    covers: "Billing, media reconciliation, loadings, debtors",
    fteToday: { value: 2.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "invoicing", label: "Auto-invoicing", hoursPerMonth: 60, automationLevel: "L3", aiRunCostPerMonth: 25, residualHoursPerMonth: 8, escalation: { trigger: "invoice mismatch vs booking data", owner: "Fractional CFO", slaHours: 48 }, clientFacing: false, tools: [] },
      { id: "media-reconciliation", label: "Media reconciliation", hoursPerMonth: 80, automationLevel: "L2", aiRunCostPerMonth: 40, residualHoursPerMonth: 28, escalation: null, clientFacing: false, tools: [] },
      { id: "loadings-payments", label: "Loadings & supplier payments", hoursPerMonth: 50, automationLevel: "L3", aiRunCostPerMonth: 20, residualHoursPerMonth: 7, escalation: { trigger: "supplier payment / loading exception", owner: "Fractional CFO", slaHours: 48 }, clientFacing: false, tools: [] },
      { id: "debtors", label: "Debtor chasing (exception-only)", hoursPerMonth: 40, automationLevel: "L3", aiRunCostPerMonth: 15, residualHoursPerMonth: 6, escalation: { trigger: "overdue >30d or disputed", owner: "Fractional CFO", slaHours: 48, clientFacingRisk: true }, clientFacing: true, tools: [] },
      { id: "month-end", label: "Month-end (fractional CFO oversight)", hoursPerMonth: 36, automationLevel: "L1", aiRunCostPerMonth: 15, residualHoursPerMonth: 30, escalation: null, clientFacing: false, tools: [] },
    ],
  },
  {
    id: "spine",
    order: 8,
    label: "Spine",
    covers: "Leadership, finance ops, HR, IT, culture",
    fteToday: { value: 1.5, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "leadership", label: "Leadership, clients & culture (CEO — non-negotiable human layer)", hoursPerMonth: 120, automationLevel: "L1", aiRunCostPerMonth: 10, residualHoursPerMonth: 108, escalation: null, clientFacing: true, tools: [] },
      { id: "finance-ops", label: "Finance ops oversight", hoursPerMonth: 30, automationLevel: "L2", aiRunCostPerMonth: 15, residualHoursPerMonth: 8, escalation: null, clientFacing: false, tools: [] },
      { id: "hr-people", label: "HR & people", hoursPerMonth: 25, automationLevel: "L2", aiRunCostPerMonth: 15, residualHoursPerMonth: 7, escalation: null, clientFacing: false, tools: [] },
      { id: "it-chief-of-staff", label: "IT & AI chief-of-staff admin", hoursPerMonth: 24, automationLevel: "L3", aiRunCostPerMonth: 25, residualHoursPerMonth: 4, escalation: { trigger: "system / access incident", owner: "CEO", slaHours: 24 }, clientFacing: false, tools: [] },
    ],
  },
];
