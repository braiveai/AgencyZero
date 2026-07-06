import type { ToolEntry } from "./types";

// The internal AI estate, mapped onto the value chain × ladder.
// Deck framing: "The constraint is adoption, not capability."
// `adoption` is the honest current state — several capable tools sit under-used,
// which the Model screen prices as a real cost via the adoption slider.

export const tools: ToolEntry[] = [
  { id: "redflags", name: "Red Flags v2", blurb: "Continuous anomaly detection & account monitoring", stages: ["optimise"], ladder: "L3", adoption: "partial" },
  { id: "architect-search", name: "Architect Search / GAds Suite", blurb: "Research + first-draft plans, RFP/pitch drafting patterns", stages: ["win", "plan", "make-buy"], ladder: "L2", adoption: "partial" },
  { id: "gads-suite", name: "GAds Suite", blurb: "Google Ads build, trafficking & bid/budget tooling", stages: ["make-buy", "optimise"], ladder: "L2", adoption: "partial" },
  { id: "sa-briefing-tool", name: "SA Briefing Tool", blurb: "Structured brief intake & kickoff pack generation", stages: ["win", "plan", "onboard"], ladder: "L2", adoption: "high" },
  { id: "insitu", name: "Insitu approval workflow", blurb: "Approval / provisioning workflow", stages: ["onboard", "make-buy"], ladder: "L3", adoption: "partial" },
  { id: "autotracker", name: "Autotracker", blurb: "Tag & conversion tracking setup / QA", stages: ["onboard"], ladder: "L3", adoption: "partial" },
  { id: "ceed", name: "Ceed", blurb: "AI creative variant generation", stages: ["make-buy"], ladder: "L2", adoption: "low" },
  { id: "reporting", name: "Reporting suite", blurb: "Automated report generation + insight narratives", stages: ["prove"], ladder: "L3", adoption: "partial" },
  { id: "sunnyrev", name: "Sunny Budget (sunnyrev)", blurb: "Revenue / retainer book intelligence", stages: ["spine", "collect"], ladder: "L2", adoption: "high" },
  { id: "signal", name: "Signal", blurb: "Market / intent signal monitoring", stages: ["win", "plan"], ladder: "L2", adoption: "low" },
  { id: "blueprint", name: "Blueprint", blurb: "Proposal blueprint scaffolding", stages: ["plan"], ladder: "L2", adoption: "partial" },
  { id: "gj-discovery", name: "GJ Discovery", blurb: "Discovery & qualification support", stages: ["win"], ladder: "L2", adoption: "low" },
  { id: "bdmsales", name: "BDM Sales", blurb: "Outbound / BD workflow support", stages: ["win"], ladder: "L1", adoption: "low" },
  { id: "cards", name: "Cards", blurb: "Client-facing results / card generation", stages: ["prove"], ladder: "L2", adoption: "low" },
  { id: "reactive", name: "Reactive", blurb: "Reactive campaign / social response", stages: ["make-buy", "optimise"], ladder: "L2", adoption: "low" },
  { id: "sunnystandard", name: "Sunny Standard", blurb: "QA / standards enforcement", stages: ["optimise", "prove"], ladder: "L2", adoption: "partial" },
  { id: "swa", name: "SWA", blurb: "Workflow automation glue", stages: ["onboard", "collect"], ladder: "L3", adoption: "low" },
  { id: "rackley", name: "Rackley", blurb: "Client-specific delivery tooling", stages: ["make-buy", "prove"], ladder: "L2", adoption: "partial" },
];
