import type { Stage } from "./types";

// Per-process inventory across the client value chain — now a WORKSHOP ARTEFACT.
//
// Each process carries: a plain-English description (hover), whether the rebuilt
// agency would even do it (`required`), which staff roles touch it today
// (`staffIds` → drives derived FTE via even allocation), and how much AI can take
// (`automatability`). Everything here is a strawman to correct live in the room.
//
// FTE is DERIVED from staff allocation, not asserted: a person's FTE splits evenly
// across every process they're assigned to, so the map auto-reconciles to headcount.
// Zero-FTE per process = required ? todayFTE × residualFrac(automatability) : 0.
//
// The relationship layer (the phone, firefighting, entertainment, supplier & talent
// relationships, training) is seeded explicitly — it's the least automatable work
// and the strongest answer to "who would we hire."

export const stages: Stage[] = [
  {
    id: "win",
    order: 1,
    label: "Win",
    covers: "Inbound, outbound, pitching, RFPs",
    fteToday: { value: 1.5, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "lead-qualification", label: "Lead qualification & meeting prep", description: "Sorting inbound enquiries, researching the prospect, prepping for the first meeting.", required: true, staffIds: ["sales-internal", "strat-hybrid"], automatability: "most", intensity: "normal", escalation: null, clientFacing: false, tools: ["architect-search"] },
      { id: "discovery-calls", label: "Discovery calls & relationship", description: "The first conversations with a prospect — understanding their business, building rapport.", required: true, staffIds: ["strat-hybrid", "dig-ad-1", "dig-ad-2", "ceo"], automatability: "none", intensity: "heavy", escalation: null, clientFacing: true, tools: [] },
      { id: "rfp-drafting", label: "RFP responses", description: "Writing formal responses to tenders and requests for proposal, drafted from the win library.", required: true, staffIds: ["strat-hybrid", "dig-ad-1", "strat-pt"], automatability: "most", intensity: "normal", escalation: null, clientFacing: true, tools: ["architect-search", "sa-briefing-tool"] },
      { id: "pitch-decks", label: "Pitch decks", description: "Building the slides and story for a new-business pitch.", required: true, staffIds: ["dig-ad-1", "dig-ad-2", "strat-pt"], automatability: "most", intensity: "normal", escalation: null, clientFacing: true, tools: ["architect-search"] },
      { id: "pricing-negotiation", label: "Pricing & the room", description: "Setting the price and winning the deal in person — reading the room, handling objections.", required: true, staffIds: ["ceo", "strat-hybrid", "trad-ad"], automatability: "none", intensity: "heavy", escalation: null, clientFacing: true, tools: [] },
      { id: "networking-newbiz", label: "Networking & new-business profile", description: "Referral cultivation, industry events, awards, keeping Sunny visible in the market.", required: true, staffIds: ["ceo", "strat-hybrid", "sales-internal"], automatability: "none", intensity: "normal", escalation: null, clientFacing: true, tools: [] },
      { id: "client-entertainment", label: "Client entertainment", description: "Lunches, events, hospitality — the relationship maintenance that keeps clients close.", required: true, staffIds: ["ceo", "trad-ad", "dig-ad-1"], automatability: "none", intensity: "light", escalation: null, clientFacing: true, tools: [] },
    ],
  },
  {
    id: "plan",
    order: 2,
    label: "Plan",
    covers: "Strategy, media planning, budgeting, channel selection — begins pre-signature",
    fteToday: { value: 2.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "research-audience", label: "Research & audience work", description: "Market, competitor and audience research to underpin a strategy.", required: true, staffIds: ["dig-spec-1", "strat-pt", "strat-tba"], automatability: "most", intensity: "normal", escalation: null, clientFacing: false, tools: ["architect-search"] },
      { id: "channel-planning", label: "Channel planning", description: "Deciding which media channels to use and how they work together.", required: true, staffIds: ["strat-hybrid", "strat-pt", "dig-ad-1"], automatability: "some", intensity: "normal", escalation: null, clientFacing: false, tools: [] },
      { id: "budget-splits", label: "Budget splits & flowcharts", description: "Allocating spend across channels and months; building the media flowchart.", required: true, staffIds: ["strat-tba", "dig-spec-2"], automatability: "most", intensity: "light", escalation: null, clientFacing: false, tools: [] },
      { id: "strategy-decks", label: "Strategy decks", description: "Turning the plan into a client-ready strategy presentation.", required: true, staffIds: ["strat-hybrid", "dig-ad-2", "strat-pt"], automatability: "most", intensity: "normal", escalation: null, clientFacing: true, tools: ["architect-search"] },
      { id: "proposal-blueprints", label: "Proposal blueprints (senior-owned)", description: "The full pre-signature blueprint — Sunny's most expensive speculative thinking.", required: true, staffIds: ["strat-hybrid", "dig-ad-1", "strat-pt"], automatability: "some", intensity: "heavy", escalation: null, clientFacing: true, tools: ["architect-search", "sa-briefing-tool"] },
    ],
  },
  {
    id: "onboard",
    order: 3,
    label: "Onboard",
    covers: "Contracts, briefing intake, account setup, access, kickoff",
    fteToday: { value: 1.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "contracts", label: "Agreements", description: "Drawing up and sending the client agreement.", required: true, staffIds: ["trad-am", "accounts"], automatability: "most", intensity: "light", escalation: null, clientFacing: true, tools: [] },
      { id: "brief-intake", label: "Briefing intake & structuring", description: "Capturing the client brief and turning it into a structured, usable form.", required: true, staffIds: ["dig-ad-1", "trad-am", "strat-pt"], automatability: "most", intensity: "normal", escalation: null, clientFacing: true, tools: ["sa-briefing-tool"] },
      { id: "access-provisioning", label: "Platform access & account setup", description: "Getting access to the client's ad accounts, analytics and platforms.", required: true, staffIds: ["dig-spec-3", "trad-coord-1"], automatability: "nearly-all", intensity: "light", escalation: { trigger: "provisioning failure or permission mismatch", owner: "Performance Lead", slaHours: 24 }, clientFacing: false, tools: ["insitu"] },
      { id: "tracking-setup", label: "Account & tracking setup", description: "Setting up conversion tracking, tags and reporting connections.", required: true, staffIds: ["dig-spec-3", "dig-spec-4"], automatability: "nearly-all", intensity: "light", escalation: { trigger: "tracking/tag misfire on QA", owner: "Performance Lead", slaHours: 24 }, clientFacing: false, tools: ["autotracker"] },
      { id: "kickoff-packs", label: "Kickoff packs", description: "The onboarding pack that starts the engagement, seeded from the winning blueprint.", required: true, staffIds: ["dig-ad-2", "trad-am"], automatability: "most", intensity: "normal", escalation: null, clientFacing: true, tools: ["sa-briefing-tool"] },
    ],
  },
  {
    id: "make-buy",
    order: 4,
    label: "Make / Buy",
    covers: "Creative production, trad media buying & booking, digital build & trafficking",
    fteToday: { value: 4.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "trad-bookings", label: "Trad bookings & confirmations", description: "Placing traditional media bookings and confirming them with media owners.", required: true, staffIds: ["trad-coord-1", "trad-coord-2"], automatability: "nearly-all", intensity: "normal", escalation: { trigger: "booking mismatch vs confirmation", owner: "Trad Buyer", slaHours: 8, clientFacingRisk: true }, clientFacing: false, tools: [] },
      { id: "trad-negotiation", label: "Trad negotiation", description: "Negotiating rates and deals with media owners — the relationship moat.", required: true, staffIds: ["trad-ad", "trad-am"], automatability: "none", intensity: "heavy", escalation: null, clientFacing: true, tools: [] },
      { id: "material-dispatch", label: "Material deadlines & dispatch", description: "Chasing creative, hitting material deadlines, sending assets to media owners.", required: true, staffIds: ["trad-coord-1", "trad-coord-2"], automatability: "nearly-all", intensity: "light", escalation: { trigger: "missed material deadline", owner: "Trad Buyer", slaHours: 4, clientFacingRisk: true }, clientFacing: false, tools: [] },
      { id: "digital-build", label: "Digital campaign build", description: "Building the campaigns, ad groups, keywords and settings in the ad platforms.", required: true, staffIds: ["dig-spec-1", "dig-spec-2", "dig-spec-5"], automatability: "most", intensity: "heavy", escalation: null, clientFacing: false, tools: ["gads-suite", "architect-search"] },
      { id: "trafficking-qa", label: "Trafficking & QA", description: "Loading ads, checking everything is set up correctly before it goes live.", required: true, staffIds: ["dig-spec-3", "dig-spec-6"], automatability: "most", intensity: "normal", escalation: null, clientFacing: false, tools: ["gads-suite"] },
      { id: "creative-variants", label: "Creative production & variants", description: "Producing the ads and resizing/variant work across formats.", required: true, staffIds: ["dig-spec-4", "dig-spec-5", "dig-ad-1"], automatability: "some", intensity: "heavy", escalation: null, clientFacing: true, tools: ["ceed"] },
      { id: "talent-freelancer", label: "Talent & freelancer wrangling", description: "Booking and managing photographers, production crews and contractors.", required: true, staffIds: ["trad-am", "dig-ad-2"], automatability: "some", intensity: "normal", escalation: null, clientFacing: false, tools: [] },
      { id: "supplier-relationships", label: "Supplier & media-owner relationships", description: "Ongoing relationships with reps — intel, added value, first call on opportunities.", required: true, staffIds: ["trad-ad", "strat-hybrid"], automatability: "none", intensity: "normal", escalation: null, clientFacing: false, tools: [] },
    ],
  },
  {
    id: "optimise",
    order: 5,
    label: "Optimise",
    covers: "Campaign management, pacing, bid/budget optimisation, QA",
    fteToday: { value: 4.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "daily-checks", label: "Daily checks & pacing", description: "Daily monitoring that campaigns are delivering and spending on pace.", required: true, staffIds: ["dig-spec-1", "dig-spec-2", "dig-spec-3", "dig-spec-6"], automatability: "nearly-all", intensity: "heavy", escalation: { trigger: "pacing or delivery threshold breach", owner: "Performance Lead", slaHours: 12 }, clientFacing: false, tools: ["redflags"] },
      { id: "bid-budget", label: "Bid & budget optimisation", description: "Adjusting bids and budgets to hit performance targets.", required: true, staffIds: ["dig-spec-1", "dig-spec-2", "dig-ad-1"], automatability: "most", intensity: "heavy", escalation: null, clientFacing: false, tools: ["gads-suite", "redflags"] },
      { id: "anomaly-response", label: "Anomaly detection & response", description: "Catching and fixing sudden spend, tracking or performance problems.", required: true, staffIds: ["dig-spec-4", "dig-spec-6"], automatability: "nearly-all", intensity: "normal", escalation: { trigger: "spend / CTR / conversion anomaly", owner: "Performance Lead", slaHours: 6, clientFacingRisk: true }, clientFacing: false, tools: ["redflags"] },
      { id: "cross-account-qa", label: "Cross-account QA", description: "Senior spot-checks across accounts to catch what individual checks miss.", required: true, staffIds: ["dig-ad-1", "dig-ad-2", "dig-spec-5"], automatability: "most", intensity: "normal", escalation: null, clientFacing: false, tools: ["redflags"] },
      { id: "senior-exception-mgmt", label: "Senior exception management", description: "Senior judgement on the calls the system escalates — the human in the loop.", required: true, staffIds: ["dig-ad-1", "dig-ad-2"], automatability: "some", intensity: "heavy", escalation: null, clientFacing: true, tools: [] },
    ],
  },
  {
    id: "prove",
    order: 6,
    label: "Prove",
    covers: "Reporting, WIPs, client comms, results storytelling, ongoing account care",
    fteToday: { value: 3.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "monthly-reports", label: "Monthly reports", description: "Producing the monthly performance report for each client.", required: true, staffIds: ["dig-spec-1", "dig-spec-2", "dig-spec-5", "dig-ad-1", "dig-ad-2", "trad-am"], automatability: "nearly-all", intensity: "heavy", escalation: { trigger: "report figure fails variance/sanity check", owner: "Performance Lead", slaHours: 24, clientFacingRisk: true }, clientFacing: true, tools: ["reporting"] },
      { id: "weekly-wip", label: "Weekly WIP prep & attendance", description: "Preparing for and attending weekly work-in-progress meetings.", required: true, staffIds: ["dig-ad-1", "dig-ad-2", "trad-am"], automatability: "most", intensity: "normal", escalation: null, clientFacing: true, tools: ["reporting"] },
      { id: "adhoc-questions", label: "Ad-hoc client questions", description: "Answering the one-off questions and requests that come in through the month.", required: true, staffIds: ["dig-ad-1", "dig-ad-2", "trad-am", "dig-spec-5"], automatability: "most", intensity: "normal", escalation: null, clientFacing: true, tools: ["reporting"] },
      { id: "results-narratives", label: "Results narratives", description: "Turning the numbers into a story the client understands and values.", required: true, staffIds: ["dig-ad-1", "strat-hybrid"], automatability: "most", intensity: "normal", escalation: null, clientFacing: true, tools: ["reporting", "architect-search"] },
      { id: "account-management", label: "Account management — the phone", description: "Being available. Picking up the phone, hand-holding, absorbing the client's anxiety, being trusted.", required: true, staffIds: ["dig-ad-1", "dig-ad-2", "trad-ad", "trad-am"], automatability: "none", intensity: "heavy", escalation: null, clientFacing: true, tools: [] },
      { id: "firefighting", label: "Firefighting & complaints", description: "Managing the client when something goes wrong — the call nobody wants but somebody has to take.", required: true, staffIds: ["dig-ad-1", "dig-ad-2", "trad-ad", "ceo"], automatability: "none", intensity: "normal", escalation: null, clientFacing: true, tools: [] },
    ],
  },
  {
    id: "collect",
    order: 7,
    label: "Collect",
    covers: "Billing, media reconciliation, loadings, debtors",
    fteToday: { value: 2.0, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "invoicing", label: "Invoicing", description: "Raising and sending client invoices.", required: true, staffIds: ["accounts"], automatability: "nearly-all", intensity: "light", escalation: { trigger: "invoice mismatch vs booking data", owner: "Fractional CFO", slaHours: 48 }, clientFacing: false, tools: [] },
      { id: "media-reconciliation", label: "Media reconciliation", description: "Matching what was booked against what ran and what was billed.", required: true, staffIds: ["accounts", "trad-coord-2"], automatability: "most", intensity: "normal", escalation: null, clientFacing: false, tools: [] },
      { id: "loadings-payments", label: "Loadings & supplier payments", description: "Applying loadings and paying media owners and suppliers.", required: true, staffIds: ["accounts", "trad-coord-2"], automatability: "nearly-all", intensity: "light", escalation: { trigger: "supplier payment / loading exception", owner: "Fractional CFO", slaHours: 48 }, clientFacing: false, tools: [] },
      { id: "debtors", label: "Debtor chasing", description: "Chasing overdue invoices — sensitive because it touches the relationship.", required: true, staffIds: ["accounts", "cfo"], automatability: "nearly-all", intensity: "normal", escalation: { trigger: "overdue >30d or disputed", owner: "Fractional CFO", slaHours: 48, clientFacingRisk: true }, clientFacing: true, tools: [] },
      { id: "month-end", label: "Month-end", description: "Closing the books each month.", required: true, staffIds: ["cfo", "accounts"], automatability: "some", intensity: "normal", escalation: null, clientFacing: false, tools: [] },
    ],
  },
  {
    id: "spine",
    order: 8,
    label: "Spine",
    covers: "Leadership, finance ops, HR, IT, culture, training",
    fteToday: { value: 1.5, confidence: "assumed", tolerance: 0.2 },
    processes: [
      { id: "leadership", label: "Leadership, clients & culture", description: "Running the business, senior client relationships, setting culture. The non-negotiable human layer.", required: true, staffIds: ["ceo"], automatability: "none", intensity: "heavy", escalation: null, clientFacing: true, tools: [] },
      { id: "finance-ops", label: "Finance ops oversight", description: "Cash flow, forecasting, financial control.", required: true, staffIds: ["cfo"], automatability: "most", intensity: "normal", escalation: null, clientFacing: false, tools: [] },
      { id: "hr-people", label: "HR & people", description: "Hiring, contracts, performance, the people admin.", required: true, staffIds: ["ceo", "ea"], automatability: "most", intensity: "normal", escalation: null, clientFacing: false, tools: [] },
      { id: "it-chief-of-staff", label: "IT & chief-of-staff admin", description: "Systems, tooling, internal admin, the EA/chief-of-staff load.", required: true, staffIds: ["ea", "dig-spec-6"], automatability: "nearly-all", intensity: "light", escalation: { trigger: "system / access incident", owner: "CEO", slaHours: 24 }, clientFacing: false, tools: [] },
      { id: "training-development", label: "Training & development", description: "Growing the team's skills — increasingly, teaching people to run the systems.", required: true, staffIds: ["ceo", "dig-ad-1", "dig-ad-2"], automatability: "some", intensity: "normal", escalation: null, clientFacing: false, tools: [] },
    ],
  },
];
