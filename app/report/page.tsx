"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { baseline } from "@/lib/model/baseline";
import { useWorkshopCtx } from "@/lib/model/useWorkshopCtx";
import { loadActiveModel } from "@/lib/scenario-store";
import type { ScenarioParams } from "@/lib/model/engine";
import {
  fteTodayForStage,
  fteZeroForStage,
  roleAbsorption,
  runModel,
  todayFteForProcess,
  totalTodayFte,
  totalZeroFte,
  zeroFteForProcess,
} from "@/lib/model/engine";
import { makePresets } from "@/lib/model/presets";
import { fmtMoney, fmtMoneyShort, fmtNum, fmtPct } from "@/lib/format";
import { MonthlyProfitChart, ProfitLines, RevenueMixDonut } from "@/components/charts";

const YEARS = [0, 1, 2, 3, 4];

function SectionTitle({ n, kicker, title }: { n: string; kicker: string; title: string }) {
  return (
    <div className="mb-4 border-b border-rule pb-2">
      <div className="flex items-baseline gap-3">
        <span className="text-[11px] font-bold tracking-[0.16em] text-accent-dark">{n}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">{kicker}</span>
      </div>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900">{title}</h2>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="report-avoid rounded-xl border border-rule bg-surface p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-300">{label}</div>
      <div className="tnum mt-0.5 text-xl font-extrabold text-ink-900">{value}</div>
      {sub && <div className="text-[10px] text-ink-300">{sub}</div>}
    </div>
  );
}

// "Digital Specialist 3", "Account Coordinator 1", "… — Pod 2", "(P/T)" → the base
// role, so people doing the same job collapse into one line.
function roleType(label: string): string {
  return label
    .replace(/\s*[—-]\s*Pod\s*\d+/i, "")
    .replace(/\s*\(P\/T\)/i, "")
    .replace(/\s*\(TBA\)/i, "")
    .replace(/\s+\d+$/, "")
    .trim();
}

export default function Report() {
  const ctx = useWorkshopCtx();
  const a = ctx.assumptions;
  const f = a.financials;

  // The scenario currently driving the app (set on "Load into Workshop" / Save).
  const [active, setActive] = useState<ScenarioParams | null>(null);
  useEffect(() => setActive(loadActiveModel()), []);
  const activeOut = useMemo(() => (active ? runModel(active) : null), [active]);

  const model = useMemo(() => {
    const presets = makePresets("base", 3, a, ctx);
    const p = (k: string) => presets.find((x) => x.key === k)!;
    const sq = runModel(p("status-quo").params);
    const zero = runModel(p("agency-zero").params);
    const mid = runModel(p("middle-path").params);

    // ---- savings by process ----
    const procs = ctx.stages.flatMap((s) =>
      s.processes
        .filter((pr) => pr.required)
        .map((pr) => {
          const today = todayFteForProcess(pr, ctx);
          const freed = today - zeroFteForProcess(pr, "base", ctx);
          return { stage: s.label, label: pr.label, auto: pr.automatability, today, freed, pct: today > 0 ? freed / today : 0 };
        }),
    );
    procs.sort((x, y) => y.freed - x.freed);

    // ---- savings by role, aggregated by role type (same job, different people) ----
    const roleMap = new Map<string, { label: string; today: number; freed: number; count: number }>();
    for (const r of ctx.staff) {
      const ab = roleAbsorption(r.id, "base", ctx);
      if (ab.today <= 0.01) continue;
      const key = roleType(r.label);
      const cur = roleMap.get(key) ?? { label: key, today: 0, freed: 0, count: 0 };
      cur.today += ab.today;
      cur.freed += ab.today - ab.residual;
      cur.count += 1;
      roleMap.set(key, cur);
    }
    const roles = [...roleMap.values()]
      .map((r) => ({ ...r, aid: r.today > 0 ? r.freed / r.today : 0 }))
      .sort((x, y) => y.freed - x.freed);

    // ---- stage roll-up ----
    const stageRoll = ctx.stages.map((s) => ({ label: s.label, today: fteTodayForStage(s, ctx), freed: fteTodayForStage(s, ctx) - fteZeroForStage(s, "base", ctx) }));

    // ---- glide path ----
    const zeroP = p("agency-zero").params;
    const sqP = p("status-quo").params;
    let cz = 0;
    let cs = 0;
    let be: number | null = null;
    const proj = YEARS.map((t) => {
      const z = runModel({ ...zeroP, horizonYear: t }).profit;
      const s = runModel({ ...sqP, horizonYear: t }).profit;
      cz += z;
      cs += s;
      if (be === null && t > 0 && cz > cs) be = t;
      return { t, z, s, cumDelta: cz - cs };
    });

    return {
      sq, zero, mid, procs, roles, stageRoll, proj,
      breakEven: be, endDelta: proj[proj.length - 1].cumDelta,
      today: totalTodayFte(ctx), zeroFte: totalZeroFte("base", ctx),
    };
  }, [ctx, a]);

  const netProfitToday = f.gp - f.peopleCost - f.tooling - f.otherOpex;
  const totalFreed = model.today - model.zeroFte;
  const printedOn = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="report mx-auto max-w-3xl bg-paper px-6 py-8 text-ink-900">
      {/* screen-only toolbar */}
      <div className="report-noprint mb-6 flex items-center justify-between rounded-xl border border-rule bg-rule_soft/50 px-4 py-3">
        <div className="text-[12px] text-ink-500">
          Reads the loaded model. To pin it to a saved session, <Link href="/scenarios" className="font-semibold text-accent-dark hover:underline">load that scenario</Link> first.
        </div>
        <div className="flex items-center gap-2">
          <Link href="/today" className="rounded-lg border border-rule px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:border-ink-300">← Back</Link>
          <button onClick={() => window.print()} className="rounded-lg bg-ink-900 px-4 py-1.5 text-[12px] font-semibold text-paper">Print / Save as PDF</button>
        </div>
      </div>

      {/* ===== COVER + TODAY ===== */}
      <section className="report-section">
        <div className="report-avoid mb-8">
          <div className="text-[11px] font-bold tracking-[0.2em] text-ink-300">SUNNY ADVERTISING · CONFIDENTIAL</div>
          <h1 className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-tight">AGENCY ZERO</h1>
          <p className="mt-4 max-w-xl text-lg leading-snug text-ink-700">Where the work goes, the org it implies, and the numbers behind it — from the loaded model.</p>
          <div className="mt-4 text-[11px] text-ink-300">Prepared for Roger Delaney &amp; Sarah McNeil · BRAIVE · {printedOn}</div>
        </div>

        <SectionTitle n="01" kicker="Today, honestly" title="The FY26 baseline" />
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Gross profit" value={fmtMoneyShort(f.gp)} sub="real revenue" />
          <Stat label="Net profit" value={fmtMoneyShort(netProfitToday)} sub="pre-tax" />
          <Stat label="Headcount" value={`~${f.fte}`} sub="FTE, excl. partners" />
          <Stat label="Payroll ratio" value={fmtPct(f.peopleCost / f.gp)} sub="of GP" />
        </div>
        <div className="report-avoid mt-4 grid grid-cols-[1.5fr_1fr] gap-4">
          <div className="rounded-xl border border-rule bg-surface p-4">
            <div className="eyebrow mb-2">Monthly net profit — FY26</div>
            <MonthlyProfitChart data={baseline.monthlyProfit} />
            <p className="mt-2 text-[11px] text-ink-500">Several near-breakeven months — the engine is more fragile than the topline. Restructure from strength, not distress.</p>
          </div>
          <div className="rounded-xl border border-rule bg-surface p-4">
            <div className="eyebrow mb-2">Revenue mix — net</div>
            <RevenueMixDonut trad={f.tradNet} digital={f.digitalNet} />
            <div className="mt-2 text-center text-[11px] text-ink-500">The ~50/50 split nobody realises. Digital is the stable line AI compresses first.</div>
          </div>
        </div>
      </section>

      {/* ===== WHERE THE SAVINGS ARE — PROCESSES ===== */}
      <section className="report-section">
        <SectionTitle n="02" kicker="Where the savings are · the work" title="The biggest pools of absorbable work" />
        <div className="report-avoid mb-4 flex items-center justify-between rounded-xl bg-ink-900 px-5 py-3 text-paper">
          <span className="text-[13px] font-semibold uppercase tracking-[0.12em]">Absorbable human overhead</span>
          <span className="tnum text-2xl font-extrabold">~{fmtNum(totalFreed)} FTE</span>
        </div>
        <div className="space-y-1.5">
          {model.procs.slice(0, 12).map((p, i) => (
            <div key={p.stage + p.label} className="report-avoid flex items-center gap-3">
              <span className="tnum w-4 text-[11px] text-ink-300">{i + 1}</span>
              <div className="w-52 shrink-0">
                <div className="truncate text-[12px] font-semibold text-ink-900">{p.label}</div>
                <div className="text-[10px] text-ink-300">{p.stage}</div>
              </div>
              <div className="flex-1">
                <div className="h-4 overflow-hidden rounded bg-rule">
                  <div className="flex h-full items-center rounded bg-accent-dark px-1.5" style={{ width: `${Math.max(10, (p.freed / (model.procs[0]?.freed || 1)) * 100)}%` }}>
                    <span className="tnum text-[9px] font-bold text-paper">{fmtNum(p.freed)} FTE</span>
                  </div>
                </div>
              </div>
              <span className="tnum w-10 shrink-0 text-right text-[10px] text-ink-400">{fmtPct(p.pct)}</span>
            </div>
          ))}
        </div>
        <div className="report-avoid mt-5">
          <div className="eyebrow mb-2">By stage — where it concentrates</div>
          <div className="grid grid-cols-3 gap-2">
            {[...model.stageRoll].sort((x, y) => y.freed - x.freed).slice(0, 6).map((s) => (
              <div key={s.label} className="rounded-lg border border-rule bg-surface p-2.5">
                <div className="text-[11px] font-semibold text-ink-900">{s.label}</div>
                <div className="tnum text-[15px] font-extrabold text-accent-dark">{fmtNum(s.freed)} <span className="text-[10px] font-normal text-ink-300">freed</span></div>
                <div className="text-[10px] text-ink-300">of {fmtNum(s.today)} today</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== THE ORG IT IMPLIES + THE NUMBERS ===== */}
      <section className="report-section">
        <SectionTitle n="03" kicker="Where the savings are · the org" title="Where work shifts to systems + senior oversight" />
        <p className="mb-3 text-[12px] leading-snug text-ink-500">Grouped by role — people doing the same job are counted together. Read as <b>where the work goes</b>, not a cut list: the share absorbed by systems is what we would <b>not</b> re-hire; the residual is what we would.</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {model.roles.slice(0, 12).map((r) => (
            <div key={r.label} className="report-avoid flex items-center gap-2">
              <div className="w-44 shrink-0 text-[11px] font-medium leading-tight text-ink-700">
                {r.label}
                {r.count > 1 && <span className="ml-1 text-ink-300">×{r.count}</span>}
              </div>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-rule">
                <div className="h-full rounded-full bg-accent-dark" style={{ width: `${Math.round(r.aid * 100)}%` }} />
              </div>
              <span className="tnum w-16 shrink-0 text-right text-[10px] text-ink-400">
                <b className="text-accent-dark">{Math.round(r.aid * 100)}%</b> · {fmtNum(r.freed)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-7">
          <SectionTitle n="04" kicker="The numbers" title="Same revenue, fewer people — or same people, more revenue" />
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "Status Quo (Y3)", o: model.sq, tone: "neg" as const, hero: false },
              activeOut
                ? { name: `This session · ${active!.horizonYear === 0 ? "now" : `Year ${active!.horizonYear}`}`, o: activeOut, tone: "hero" as const, hero: true }
                : { name: "Middle Path (Y3)", o: model.mid, tone: "mid" as const, hero: false },
              { name: "Agency Zero (Y3)", o: model.zero, tone: "pos" as const, hero: false },
            ].map((c) => (
              <div key={c.name} className={clsx("report-avoid rounded-xl border-2 bg-surface p-4", c.tone === "hero" ? "border-accent-dark ring-1 ring-accent-dark/20" : c.tone === "pos" ? "border-positive/40" : c.tone === "neg" ? "border-negative/50" : "border-rule")}>
                <div className={clsx("text-[11px] font-semibold", c.hero ? "text-accent-dark" : "text-ink-500")}>{c.name}</div>
                <div className={clsx("tnum mt-1 text-2xl font-extrabold", c.tone === "hero" ? "text-accent-dark" : c.tone === "pos" ? "text-positive" : c.tone === "neg" ? "text-negative" : "text-ink-900")}>{fmtMoneyShort(c.o.profit)}</div>
                <div className="text-[10px] text-ink-300">net profit</div>
                <dl className="mt-3 space-y-1 text-[11px]">
                  <div className="flex justify-between"><dt className="text-ink-500">FTE</dt><dd className="tnum font-semibold">{c.o.totalFte.toFixed(1)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-500">Profit / head</dt><dd className="tnum font-semibold">{fmtMoneyShort(c.o.profitPerHead)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-500">Payroll ratio</dt><dd className="tnum font-semibold">{fmtPct(c.o.payrollRatio)}</dd></div>
                </dl>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink-500">
            {activeOut
              ? <>Centre column is the model from this session; Status Quo and the full Agency Zero are the bookends around it. </>
              : <>Even the cautious read clears today&apos;s ~{fmtMoneyShort(netProfitToday)}. </>}
            The preferred use of the freed capacity is <b>growth</b> — same people, more revenue — not cuts.
          </p>
        </div>
      </section>

      {/* ===== GLIDE PATH + START ===== */}
      <section className="report-section">
        <SectionTitle n="05" kicker="The glide path" title="Zero is the marker. This is the plan." />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Break-even" value={model.breakEven ? `Year ${model.breakEven}` : "—"} sub="cumulative clears status quo" />
          <Stat label="4-yr cumulative gain" value={fmtMoneyShort(model.endDelta)} sub="vs doing nothing" />
          <Stat label="Headcount" value={`~${model.zeroFte.toFixed(1)}`} sub={`from ${model.today.toFixed(0)} today`} />
        </div>
        <div className="report-avoid mt-4 rounded-xl border border-rule bg-surface p-4">
          <div className="eyebrow mb-2">Annual net profit — Zero vs Status Quo</div>
          <ProfitLines
            years={YEARS}
            series={[
              { key: "z", label: "Agency Zero", color: "gold", values: model.proj.map((p) => p.z) },
              { key: "s", label: "Status Quo", color: "neg", values: model.proj.map((p) => p.s) },
            ]}
          />
          <p className="mt-2 text-[11px] text-ink-500">The gap between the lines is the annual cost of doing nothing — it opens as digital fees compress and costs stay put.</p>
        </div>

        <div className="report-avoid mt-6 rounded-2xl border-2 border-positive/40 bg-surface p-5">
          <div className="eyebrow mb-3 text-positive">Where we start — the next 6 months (no regrets)</div>
          <ol className="space-y-2 text-[12px] text-ink-700">
            <li className="flex gap-2"><span className="tnum font-bold text-positive">1</span><span><b className="text-ink-900">Adopt what we already own.</b> The biggest pools sit behind tools already built (Red Flags, reporting, GAds suite) — used inconsistently. Full adoption costs nothing new and captures most of the win.</span></li>
            <li className="flex gap-2"><span className="tnum font-bold text-positive">2</span><span><b className="text-ink-900">Don&apos;t backfill the next departures.</b> Let the org glide toward the target — no redundancies, just don&apos;t re-hire into roles the systems now cover.</span></li>
            <li className="flex gap-2"><span className="tnum font-bold text-positive">3</span><span><b className="text-ink-900">Re-decide at month 6, on evidence.</b> With adoption real and the numbers moving, make the restructure call from data — not from this page.</span></li>
          </ol>
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-ink-300">Confidential — prepared for the owners only. Figures derive from the loaded operating model; role percentages describe where work moves to systems, not individual performance or a redundancy list.</p>
      </section>
    </div>
  );
}
