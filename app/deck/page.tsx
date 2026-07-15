"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import Link from "next/link";
import { baseline } from "@/lib/model/baseline";
import { tools } from "@/lib/model/tools";
import { runModel, totalTodayFte, totalZeroFte, type DataCtx, type ModelOutputs } from "@/lib/model/engine";
import { makePresets } from "@/lib/model/presets";
import { useWorkshopCtx } from "@/lib/model/useWorkshopCtx";
import { fmtMoneyShort, fmtPct } from "@/lib/format";
import { MonthlyProfitChart } from "@/components/charts";
import { LadderBadge } from "@/components/ui";
import { LADDER, type Stage } from "@/lib/model/types";

// ---- live figures, derived from the edited Workshop + Confirm ctx -----------
interface DeckFigures {
  stages: Stage[];
  todayFte: number;
  zeroBase: number;
  zeroCons: number;
  azBase: ModelOutputs;
  azCons: ModelOutputs;
  sqY3: ModelOutputs;
}

function deckFigures(ctx: DataCtx): DeckFigures {
  return {
    stages: ctx.stages,
    todayFte: totalTodayFte(ctx),
    zeroBase: totalZeroFte("base", ctx),
    zeroCons: totalZeroFte("conservative", ctx),
    azBase: runModel(makePresets("base", 3, ctx.assumptions, ctx).find((p) => p.key === "agency-zero")!.params),
    azCons: runModel(makePresets("conservative", 3, ctx.assumptions, ctx).find((p) => p.key === "agency-zero")!.params),
    sqY3: runModel(makePresets("base", 3, ctx.assumptions, ctx).find((p) => p.key === "status-quo")!.params),
  };
}

// ---- slide primitives ------------------------------------------------------
function Kicker({ children }: { children: ReactNode }) {
  return <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-accent-dark">{children}</div>;
}
function H({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={clsx("font-extrabold tracking-tight text-ink-900", className)}>{children}</h2>;
}
function Slide({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("mx-auto flex h-full w-full max-w-5xl flex-col justify-center px-14 py-16", className)}>{children}</div>;
}

// today→zero comparison row
function TZ({ label, today, zero }: { label: string; today: string; zero: string }) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr] items-baseline gap-4 border-b border-rule py-2.5">
      <div className="text-[15px] font-medium text-ink-700">{label}</div>
      <div className="tnum text-[15px] text-ink-300">{today}</div>
      <div className="tnum text-[15px] font-semibold text-ink-900">{zero}</div>
    </div>
  );
}

// ---- the 17 slides ---------------------------------------------------------
function makeSlides(f: DeckFigures): ReactNode[] {
  const { stages, azBase, azCons, sqY3, zeroBase, zeroCons } = f;
  return [
  // 1
  <Slide key="1" className="items-start">
    <div className="text-[15px] font-bold tracking-[0.2em] text-ink-300">SUNNY ADVERTISING · CONFIDENTIAL</div>
    <H className="mt-6 text-7xl leading-[0.95]">AGENCY<br />ZERO</H>
    <p className="mt-8 max-w-2xl text-2xl leading-snug text-ink-700">
      If we founded Sunny today — with today's tools, at today's revenue — <span className="font-bold text-ink-900">who would we hire?</span>
    </p>
    <div className="mt-10 text-[13px] text-ink-300">Prepared for Roger Delaney &amp; Sarah McNeil · BRAIVE · July 2026</div>
  </Slide>,
  // 2
  <Slide key="2">
    <Kicker>The clock</Kicker>
    <H className="mt-3 text-5xl">Agencies are on a ticking clock.</H>
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      {[
        ["Fee compression", "Clients will ask why optimisation, reporting and campaign management cost human hours."],
        ["AI-native competitors", "Pitching at half the retainer, with a fraction of the people."],
        ["Client in-housing", "Platforms automate the service layer we sell."],
        ["Our steadiest line goes first", "Digital management fees are the most stable — and the first AI compresses."],
      ].map(([t, d]) => (
        <div key={t} className="rounded-xl border border-rule bg-surface p-5">
          <div className="text-[17px] font-bold text-ink-900">{t}</div>
          <div className="mt-1.5 text-[14px] leading-snug text-ink-500">{d}</div>
        </div>
      ))}
    </div>
  </Slide>,
  // 3
  <Slide key="3">
    <Kicker>Today, honestly</Kicker>
    <H className="mt-3 text-5xl">We are healthy. That's exactly why now.</H>
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-1">
        {[
          ["Gross profit (real revenue)", fmtMoneyShort(baseline.gp.value)],
          ["Net profit (pre-tax)", fmtMoneyShort(baseline.netProfit.value)],
          ["Headcount", `~${baseline.fte.value} FTE`],
          ["People cost", `${fmtMoneyShort(baseline.peopleCost.value)} · ${fmtPct(baseline.peopleCost.value / baseline.gp.value)} of GP`],
          ["GP / head", fmtMoneyShort(baseline.gp.value / baseline.fte.value)],
          ["Profit / head", fmtMoneyShort(baseline.netProfit.value / baseline.fte.value)],
        ].map(([l, v]) => (
          <div key={l} className="flex items-baseline justify-between border-b border-rule py-2">
            <span className="text-[15px] text-ink-500">{l}</span>
            <span className="tnum text-[17px] font-bold text-ink-900">{v}</span>
          </div>
        ))}
      </div>
      <div>
        <div className="eyebrow mb-2">Monthly net profit — FY26</div>
        <MonthlyProfitChart data={baseline.monthlyProfit} />
        <p className="mt-2 text-[13px] text-ink-500">Restructure from strength, not distress.</p>
      </div>
    </div>
    <p className="mt-4 text-[11px] text-ink-300">Figures from Xero FY26 export; trad/digital splits and FTE allocations are estimates for validation. The argument survives ±20% on every assumption.</p>
  </Slide>,
  // 4
  <Slide key="4">
    <Kicker>What's actually carrying us</Kicker>
    <H className="mt-3 text-5xl">A 50/50 net split nobody realises.</H>
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      <div className="rounded-xl border border-rule bg-surface p-6">
        <div className="text-[13px] font-semibold uppercase tracking-wide text-ink-300">Traditional — {fmtPct(baseline.tradNet.value / baseline.gp.value)}</div>
        <div className="tnum mt-1 text-3xl font-extrabold text-ink-900">{fmtMoneyShort(baseline.tradNet.value)}</div>
        <p className="mt-2 text-[14px] text-ink-500">Lumpy but thick. Defensible — the moat is the relationship. Top 3 clients ≈ {fmtPct(baseline.concentration.top3)} of billings, all traditional.</p>
      </div>
      <div className="rounded-xl border border-rule bg-surface p-6">
        <div className="text-[13px] font-semibold uppercase tracking-wide text-accent-dark">Digital — {fmtPct(baseline.digitalNet.value / baseline.gp.value)}</div>
        <div className="tnum mt-1 text-3xl font-extrabold text-ink-900">{fmtMoneyShort(baseline.digitalNet.value)}</div>
        <p className="mt-2 text-[14px] text-ink-500">Stable month-to-month — and the most compressible. Labour-intensive optimisation and reporting: the work AI absorbs first.</p>
      </div>
    </div>
    <p className="mt-6 text-[16px] text-ink-700">Four near-breakeven months in FY26. <span className="font-semibold text-ink-900">The profit engine is more fragile than the topline suggests.</span></p>
  </Slide>,
  // 5
  <Slide key="5">
    <Kicker>The method</Kicker>
    <H className="mt-3 text-5xl">Build forward from zero. Never subtract from today.</H>
    <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-ink-500">
      Same GP, same clients, same service lines, same trad/digital split — blank org chart, today's tools. Work is allocated to roles from zero. Not a generic AI-first archetype; not a teardown of the current chart. <span className="font-semibold text-ink-900">The Sunny that would be founded today.</span>
    </p>
    <div className="mt-8 flex flex-wrap gap-2">
      {stages.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <div className="rounded-lg border border-rule bg-surface px-3 py-2">
            <div className="text-[10px] font-semibold text-ink-300">{s.order}</div>
            <div className="text-[14px] font-bold text-ink-900">{s.label}</div>
          </div>
          {s.order < stages.length && <span className="text-ink-200">→</span>}
        </div>
      ))}
    </div>
    <p className="mt-6 text-[14px] text-ink-500">Plan precedes Onboard — our proposals are full blueprints, so the expensive thinking happens pre-signature. No sacred cows.</p>
  </Slide>,
  // 6
  <Slide key="6">
    <Kicker>The automation ladder</Kicker>
    <H className="mt-3 text-5xl">We are not claiming humans evaporate.</H>
    <p className="mt-2 text-[16px] text-ink-700">We are pricing exactly where they remain.</p>
    <div className="mt-6 space-y-2">
      {(["L0", "L1", "L2", "L3", "L4"] as const).map((l) => (
        <div key={l} className="flex items-center gap-4 rounded-lg border border-rule bg-surface px-4 py-3">
          <LadderBadge level={l} />
          <div className="text-[15px] font-semibold text-ink-900">{LADDER[l].label}</div>
          <div className="text-[14px] text-ink-500">{LADDER[l].blurb}</div>
        </div>
      ))}
    </div>
    <p className="mt-5 text-[14px] text-ink-500"><span className="font-semibold text-ink-900">L4 scepticism is a feature.</span> Every L3+ process needs a defined escalation path — trigger, owner, SLA — or it demotes to L2. No escalation, no autonomy claim.</p>
  </Slide>,
  // 7
  <Slide key="7">
    <Kicker>Win + Plan · today → zero</Kicker>
    <H className="mt-3 text-4xl">Give away the most expensive thinking for free — deliberately.</H>
    <div className="mt-6 grid grid-cols-[1.4fr_1fr_1fr] gap-4 border-b-2 border-ink-900 pb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-300">
      <div>Stage</div><div>Today</div><div>At Zero</div>
    </div>
    <TZ label="Win — inbound, pitching, RFPs" today="~1.5 FTE" zero="~1.0 FTE" />
    <TZ label="Plan — strategy, blueprints, budgets" today="~2.0 FTE" zero="~1.0 FTE" />
    <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-ink-700">
      AI-drafted planning collapses the cost of speculative pitch-stage work. Sunny can <span className="font-bold text-ink-900">out-blueprint competitors at pitch without burning senior capacity</span> — turning blueprint quality into a win-rate weapon, not a sunk cost.
    </p>
  </Slide>,
  // 8
  <Slide key="8">
    <Kicker>Onboard + Make/Buy · today → zero</Kicker>
    <H className="mt-3 text-4xl">Trad negotiation stays human. The admin around it doesn't.</H>
    <div className="mt-6 grid grid-cols-[1.4fr_1fr_1fr] gap-4 border-b-2 border-ink-900 pb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-300">
      <div>Stage</div><div>Today</div><div>At Zero</div>
    </div>
    <TZ label="Onboard — contracts, access, kickoff" today="~1.0 FTE" zero="~0.25 FTE" />
    <TZ label="Make / Buy — build, buy, create" today="~4.0 FTE" zero="~2.0 FTE" />
    <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-ink-700">
      Kickoff packs seed directly from the winning blueprint. Digital builds semi-automate with human QA; creative variants AI-generated. The moat is the relationship — not the booking admin around it.
    </p>
  </Slide>,
  // 9
  <Slide key="9">
    <Kicker>Optimise · today → zero</Kicker>
    <H className="mt-3 text-5xl">Systems watch accounts. Seniors watch systems.</H>
    <div className="mt-6 grid grid-cols-[1.4fr_1fr_1fr] gap-4 border-b-2 border-ink-900 pb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-300">
      <div>Stage</div><div>Today</div><div>At Zero</div>
    </div>
    <TZ label="Optimise — pacing, bids, anomaly, QA" today="~4.0 FTE" zero="~1.5 FTE" />
    <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-ink-700">
      Continuous automated monitoring and anomaly detection (Red Flags v2 at full adoption); AI-proposed changes with human approve/override. <span className="font-bold text-ink-900">Exception-based management</span> — senior performance leads managing systems, not accounts.
    </p>
  </Slide>,
  // 10
  <Slide key="10">
    <Kicker>Prove + Collect · today → zero</Kicker>
    <H className="mt-3 text-4xl">The reporting tax: ~3 FTE of hidden hours. Everyone reports.</H>
    <div className="mt-6 grid grid-cols-[1.4fr_1fr_1fr] gap-4 border-b-2 border-ink-900 pb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-300">
      <div>Stage</div><div>Today</div><div>At Zero</div>
    </div>
    <TZ label="Prove — reports, WIPs, narratives" today="~3.0 FTE" zero="~0.75 FTE" />
    <TZ label="Collect — billing, reconciliation, debtors" today="~2.0 FTE" zero="~0.75 FTE" />
    <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-ink-700">
      The single biggest absorption in the model. Automated reports with AI-written insight narratives and client self-serve dashboards — landing at L2/L3 with a <span className="font-bold text-ink-900">named escalation owner</span> for every figure that reaches a client.
    </p>
  </Slide>,
  // 11
  <Slide key="11">
    <Kicker>We already own most of this</Kicker>
    <H className="mt-3 text-5xl">The constraint is adoption, not capability.</H>
    <p className="mt-3 text-[16px] text-ink-500">{tools.length} internal tools already built and mapped onto the value chain. Adoption is inconsistent — which de-risks the whole proposal.</p>
    <div className="mt-6 flex flex-wrap gap-2">
      {tools.map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded-lg border border-rule bg-surface px-3 py-1.5">
          <LadderBadge level={t.ladder} />
          <span className="text-[13px] font-semibold text-ink-900">{t.name}</span>
          <span className={clsx("h-1.5 w-1.5 rounded-full", t.adoption === "high" ? "bg-positive" : t.adoption === "partial" ? "bg-flag" : "bg-negative")} title={`${t.adoption} adoption`} />
        </div>
      ))}
    </div>
    <div className="mt-5 flex gap-4 text-[12px] text-ink-500">
      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-positive" /> high adoption</span>
      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-flag" /> partial</span>
      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-negative" /> low</span>
    </div>
  </Slide>,
  // 12
  <Slide key="12">
    <Kicker>The Zero org</Kicker>
    <H className="mt-3 text-5xl">{f.todayFte.toFixed(0)} roles → ~{zeroBase.toFixed(1)}, derived bottom-up.</H>
    <p className="mt-3 max-w-3xl text-[16px] text-ink-500">Fewer, more senior, systems-literate. Not asserted — every number is Σ residual hours ÷ productive hours, so any line can be challenged live.</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {[
        ["Account Coordinator", "→ gone", "negative"],
        ["Media Specialist", "→ Performance Lead", "flag"],
        ["Reporting hours", "→ software's job, with a named escalation owner", "positive"],
      ].map(([a, b, tone]) => (
        <div key={a} className="rounded-xl border border-rule bg-surface p-5">
          <div className="text-[15px] font-bold text-ink-900">{a}</div>
          <div className={clsx("mt-1 text-[14px] font-semibold", tone === "negative" ? "text-negative" : tone === "flag" ? "text-flag" : "text-positive")}>{b}</div>
        </div>
      ))}
    </div>
    <p className="mt-6 text-[15px] text-ink-700">Base case ~{zeroBase.toFixed(1)} roles · conservative case ~{zeroCons.toFixed(1)} roles. The org shape recalculates as you re-level any process.</p>
  </Slide>,
  // 13
  <Slide key="13">
    <Kicker>The gap map</Kicker>
    <H className="mt-3 text-5xl">Three buckets. The third is what we don't yet employ.</H>
    <div className="mt-8 grid gap-5 sm:grid-cols-3">
      {[
        ["Maps cleanly", "Exists today and at Zero — senior strategist, trad negotiator, CEO.", "positive"],
        ["Doesn't exist at Zero", "The work persists; software does it — coordination, report production, campaign admin.", "flag"],
        ["Zero needs it, Sunny lacks it", "Systems operation, agent orchestration, tooling ownership, escalation management.", "negative"],
      ].map(([t, d, tone]) => (
        <div key={t} className={clsx("rounded-xl border-2 bg-surface p-5", tone === "positive" ? "border-positive/40" : tone === "flag" ? "border-flag/40" : "border-negative/50")}>
          <div className="text-[16px] font-bold text-ink-900">{t}</div>
          <div className="mt-2 text-[14px] leading-snug text-ink-500">{d}</div>
        </div>
      ))}
    </div>
    <p className="mt-6 text-[15px] text-ink-700">The subtraction is an <span className="font-bold text-ink-900">output</span> of this comparison — never the method. We frame every role as "who would we hire," never "who do we fire."</p>
  </Slide>,
  // 14
  <Slide key="14">
    <Kicker>The numbers at Zero</Kicker>
    <H className="mt-3 text-5xl">Same revenue, half the people — or same people, more revenue.</H>
    <div className="mt-6 grid grid-cols-3 gap-4">
      {[
        { name: "Status Quo (Y3)", profit: sqY3.profit, fte: sqY3.totalFte, ratio: sqY3.payrollRatio, tone: "negative" as const },
        { name: "Agency Zero (base)", profit: azBase.profit, fte: azBase.totalFte, ratio: azBase.payrollRatio, tone: "positive" as const },
        { name: "Agency Zero (conservative)", profit: azCons.profit, fte: azCons.totalFte, ratio: azCons.payrollRatio, tone: "positive" as const },
      ].map((c) => (
        <div key={c.name} className={clsx("rounded-xl border-2 bg-surface p-5", c.tone === "positive" ? "border-positive/40" : "border-negative/50")}>
          <div className="text-[13px] font-semibold text-ink-500">{c.name}</div>
          <div className={clsx("tnum mt-2 text-3xl font-extrabold", c.tone === "positive" ? "text-positive" : "text-negative")}>{fmtMoneyShort(c.profit)}</div>
          <div className="mt-1 text-[12px] text-ink-300">net profit</div>
          <div className="mt-3 space-y-1 text-[13px] text-ink-700">
            <div className="flex justify-between"><span>FTE</span><span className="tnum font-semibold">{c.fte.toFixed(1)}</span></div>
            <div className="flex justify-between"><span>Payroll ratio</span><span className="tnum font-semibold">{fmtPct(c.ratio)}</span></div>
          </div>
        </div>
      ))}
    </div>
    <p className="mt-6 text-[16px] text-ink-700"><span className="font-bold text-ink-900">Even the conservative case beats status quo.</span> The preferred use of the capacity dividend is growth — same people, $6m+ revenue.</p>
  </Slide>,
  // 15
  <Slide key="15">
    <Kicker>Three horizons · 18–24 months</Kicker>
    <H className="mt-3 text-5xl">Zero is the marker. This is the plan.</H>
    <div className="mt-8 space-y-4">
      {[
        ["H1 · 0–6 months", "Don't backfill attrition. Force adoption in Optimise + Prove — where the tools already exist and the hours are hidden."],
        ["H2 · 6–12 months", "Restructure roles around the new workflows. Redundancy costs modelled honestly, not hidden."],
        ["H3 · 12–24 months", "Compounding — grow revenue on flat headcount. The capacity dividend taken as growth."],
      ].map(([t, d]) => (
        <div key={t} className="flex gap-4 border-l-2 border-accent pl-5">
          <div>
            <div className="text-[17px] font-bold text-ink-900">{t}</div>
            <div className="mt-1 text-[15px] text-ink-500">{d}</div>
          </div>
        </div>
      ))}
    </div>
    <p className="mt-6 text-[15px] text-ink-700">Break-even on the transition inside Year 1; cumulative gain vs status quo ≈ {fmtMoneyShort(3_550_000)} over four years.</p>
  </Slide>,
  // 16
  <Slide key="16">
    <Kicker>What we are NOT saying</Kicker>
    <H className="mt-3 text-5xl">The Zero state is the marker. The middle path is the plan.</H>
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {[
        "We are not firing everyone Monday.",
        "We are not removing humans from client relationships.",
        "We are not claiming anything is 100% hands-off without an escalation path.",
        "We are not betting the agency on unproven tech — the tools already exist in-house.",
      ].map((t) => (
        <div key={t} className="flex items-start gap-3 rounded-xl border border-rule bg-surface p-5">
          <span className="mt-0.5 text-[18px] font-bold text-negative">✕</span>
          <span className="text-[15px] font-medium text-ink-700">{t}</span>
        </div>
      ))}
    </div>
  </Slide>,
  // 17
  <Slide key="17">
    <Kicker>Decision</Kicker>
    <H className="mt-3 text-6xl leading-tight">Here's the machine.<br />Let's play with it.</H>
    <p className="mt-6 max-w-2xl text-[18px] text-ink-500">Move the assumptions. Challenge any line. Watch the P&amp;L, the org shape and the glide path recalculate — live.</p>
    <Link href="/model" className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-ink-900 px-6 py-3 text-[16px] font-semibold text-paper">
      Open the model →
    </Link>
  </Slide>,
  ];
}

export default function Deck() {
  const ctx = useWorkshopCtx();
  const SLIDES = useMemo(() => makeSlides(deckFigures(ctx)), [ctx]);
  const [i, setI] = useState(0);
  const n = SLIDES.length;
  const go = useCallback((d: number) => setI((v) => Math.max(0, Math.min(n - 1, v + d))), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, n]);

  return (
    <div className="fixed inset-0 z-50 bg-paper">
      {SLIDES.map((s, idx) => (
        <div
          key={idx}
          className={clsx(
            "deck-slide absolute inset-0 transition-opacity duration-300",
            idx === i ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={idx !== i}
        >
          {s}
        </div>
      ))}

      {/* click zones */}
      <button className="deck-chrome absolute inset-y-0 left-0 w-1/4 cursor-w-resize" onClick={() => go(-1)} aria-label="Previous" />
      <button className="deck-chrome absolute inset-y-0 right-0 w-1/4 cursor-e-resize" onClick={() => go(1)} aria-label="Next" />

      {/* chrome */}
      <div className="deck-chrome pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-6 py-4 text-[12px] text-ink-300">
        <Link href="/today" className="pointer-events-auto font-semibold uppercase tracking-[0.16em] text-ink-300 hover:text-ink-700">Agency Zero</Link>
        <div className="flex items-center gap-2">
          {SLIDES.map((_, idx) => (
            <button key={idx} onClick={() => setI(idx)} className={clsx("pointer-events-auto h-1.5 rounded-full transition-all", idx === i ? "w-5 bg-ink-900" : "w-1.5 bg-ink-200 hover:bg-ink-300")} aria-label={`Slide ${idx + 1}`} />
          ))}
        </div>
        <div className="tnum">{i + 1} / {n}</div>
      </div>
    </div>
  );
}
