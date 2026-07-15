"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { runModel, totalTodayFte, totalZeroFte, type DataCtx } from "@/lib/model/engine";
import { makePresets } from "@/lib/model/presets";
import { useWorkshopCtx } from "@/lib/model/useWorkshopCtx";
import {
  defaultAssumptions,
  loadAssumptions,
  resetAssumptions,
  saveAssumptions,
  type Assumptions,
} from "@/lib/model/assumptions";
import { fmtMoney, fmtMoneyShort, fmtNum } from "@/lib/format";
import { PageHead } from "@/components/ui";

type Tag = "verified" | "estimated" | "assumed" | "plan";
const tagStyle: Record<Tag, string> = {
  verified: "bg-positive/12 text-positive",
  estimated: "bg-flag/15 text-flag",
  assumed: "bg-negative/12 text-negative",
  plan: "bg-ink-900/8 text-ink-500",
};
const tagLabel: Record<Tag, string> = { verified: "Xero", estimated: "estimated", assumed: "assumed", plan: "planning" };

function Field({
  label,
  desc,
  value,
  onChange,
  kind,
  step = 1,
  tag,
}: {
  label: string;
  desc: string;
  value: number;
  onChange: (v: number) => void;
  kind: "money" | "percent" | "number";
  step?: number;
  tag: Tag;
}) {
  const shown = kind === "percent" ? Math.round(value * 1000) / 10 : value;
  const set = (raw: number) => onChange(kind === "percent" ? raw / 100 : raw);
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[13px] font-semibold text-ink-900">{label}</label>
        <span className={clsx("rounded px-1.5 py-0.5 text-[10px] font-semibold", tagStyle[tag])}>{tagLabel[tag]}</span>
      </div>
      <p className="mb-1.5 mt-0.5 text-[11px] leading-snug text-ink-400">{desc}</p>
      <div className="flex items-center rounded-lg border border-rule bg-paper focus-within:border-ink-300">
        {kind === "money" && <span className="pl-2.5 text-[13px] text-ink-300">$</span>}
        <input
          type="number"
          step={step}
          value={shown}
          onChange={(e) => set(parseFloat(e.target.value) || 0)}
          className="tnum w-full bg-transparent px-2 py-1.5 text-[13px] outline-none"
        />
        {kind === "percent" && <span className="pr-2.5 text-[13px] text-ink-300">%</span>}
      </div>
    </div>
  );
}

function Group({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="eyebrow">{title}</div>
      <p className="mb-2 mt-1 text-[12px] leading-snug text-ink-500">{intro}</p>
      <div className="grid gap-x-6 divide-y divide-rule_soft sm:grid-cols-2 sm:divide-y-0">{children}</div>
    </div>
  );
}

export default function Confirm() {
  const router = useRouter();
  const [a, setA] = useState<Assumptions>(defaultAssumptions);
  const [ready, setReady] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => { setA(loadAssumptions()); setReady(true); }, []);
  useEffect(() => { if (ready) saveAssumptions(a); }, [a, ready]);

  // Preview against the loaded Workshop org, but with THIS page's live-edited
  // assumptions — so the impact numbers match the rest of the app, not the seed.
  const wctx = useWorkshopCtx();
  const ctx = useMemo<DataCtx>(() => ({ stages: wctx.stages, staff: wctx.staff, assumptions: a }), [wctx, a]);
  const set = (patch: Partial<Assumptions>) => setA((p) => ({ ...p, ...patch }));
  const setF = (patch: Partial<Assumptions["financials"]>) => setA((p) => ({ ...p, financials: { ...p.financials, ...patch } }));
  const setR = (patch: Partial<Assumptions["rates"]>) => setA((p) => ({ ...p, rates: { ...p.rates, ...patch } }));
  const setRes = (patch: Partial<Assumptions["residual"]>) => setA((p) => ({ ...p, residual: { ...p.residual, ...patch } }));
  const setInt = (patch: Partial<Assumptions["intensity"]>) => setA((p) => ({ ...p, intensity: { ...p.intensity, ...patch } }));

  // live impact
  const impact = useMemo(() => {
    const zeroFte = totalZeroFte("base", ctx);
    const zero = runModel(makePresets("base", 3, a, ctx).find((p) => p.key === "agency-zero")!.params);
    const sq = runModel(makePresets("base", 3, a, ctx).find((p) => p.key === "status-quo")!.params);
    return { zeroFte, zeroProfit: zero.profit, sqProfit: sq.profit, todayFte: totalTodayFte(ctx) };
  }, [a, ctx]);

  const splitSum = a.financials.tradNet + a.financials.digitalNet;
  const splitGap = splitSum - a.financials.gp;

  if (!ready) return null;

  return (
    <div>
      <PageHead
        eyebrow="Step 2 · Confirm the assumptions"
        title="The assumptions behind every number"
        lead="Nothing in this tool is a black box. Here's everything baked into the maths — the financials from Xero, the rates, the planning defaults, and what the automation levels actually mean. Change anything that's wrong; it flows through the whole model."
      />

      {/* live impact + actions */}
      <div className="sticky top-14 z-20 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-900 px-5 py-3 text-paper">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px]">
          <span className="text-paper/60">With these assumptions →</span>
          <span>Zero org <b className="tnum">{fmtNum(impact.zeroFte)}</b> FTE</span>
          <span>Zero profit <b className="tnum">{fmtMoneyShort(impact.zeroProfit)}</b></span>
          <span className="text-paper/60">vs status quo {fmtMoneyShort(impact.sqProfit)}</span>
        </div>
        <div className="flex items-center gap-2">
          {savedFlash && <span className="text-[12px] text-paper/70">saved ✓</span>}
          <button onClick={() => { if (confirm("Reset every assumption to the source values?")) setA(resetAssumptions()); }} className="rounded-lg border border-paper/25 px-3 py-1.5 text-[12px] font-semibold text-paper/80 hover:text-paper">Reset to source</button>
          <button onClick={() => router.push("/rebuild")} className="rounded-lg bg-accent px-4 py-1.5 text-[13px] font-bold text-ink-900">Looks right — continue →</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Group title="1 · The financials" intro="Straight from the FY26 Xero P&L. These are the only numbers we'd defend unchallenged — everything else is built on them.">
          <Field label="Gross profit (real revenue)" desc="After media pass-through — the agency's actual revenue." value={a.financials.gp} onChange={(v) => setF({ gp: v })} kind="money" step={10000} tag="verified" />
          <Field label="Headcount (FTE)" desc="People today, incl. CEO, excl. partners." value={a.financials.fte} onChange={(v) => setF({ fte: v })} kind="number" step={0.5} tag="estimated" />
          <Field label="Traditional net" desc="Trad margin — rebates/fees + media margin." value={a.financials.tradNet} onChange={(v) => setF({ tradNet: v })} kind="money" step={10000} tag="estimated" />
          <Field label="Digital net" desc="Management fees, strategy, creative." value={a.financials.digitalNet} onChange={(v) => setF({ digitalNet: v })} kind="money" step={10000} tag="estimated" />
          <Field label="People cost" desc="Wages, super, payroll tax, retention." value={a.financials.peopleCost} onChange={(v) => setF({ peopleCost: v })} kind="money" step={10000} tag="verified" />
          <Field label="Other opex" desc="Non-people, non-software operating expense." value={a.financials.otherOpex} onChange={(v) => setF({ otherOpex: v })} kind="money" step={10000} tag="verified" />
          <Field label="Software & subscriptions" desc="All SaaS/tech (not AI-only)." value={a.financials.tooling} onChange={(v) => setF({ tooling: v })} kind="money" step={5000} tag="verified" />
          <div className="flex items-end pb-3 text-[11px] text-ink-400">
            Trad + digital = {fmtMoney(splitSum)} vs GP {fmtMoney(a.financials.gp)} · {Math.abs(splitGap) < 1000 ? "reconciled" : `${splitGap > 0 ? "+" : "−"}${fmtMoneyShort(Math.abs(splitGap))} gap`}
          </div>
        </Group>

        <Group title="2 · Rates & people" intro="What a person costs and how much productive time they have. Today's per-head cost is derived from payroll ÷ headcount.">
          <Field label="Zero-state senior rate ($/hr)" desc="Blended hourly cost of the fewer, more senior Zero team." value={a.rates.loadedHourlyZero} onChange={(v) => setR({ loadedHourlyZero: v })} kind="number" step={1} tag="assumed" />
          <Field label="Productive hours / month" desc="Billable hours per person per month." value={a.rates.productiveHoursPerMonth} onChange={(v) => setR({ productiveHoursPerMonth: v })} kind="number" step={1} tag="assumed" />
          <div className="py-3 text-[12px] text-ink-500">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-300">Derived — loaded cost / head</div>
            <div className="mt-1">Today <b className="tnum text-ink-900">{fmtMoneyShort(a.financials.peopleCost / (impact.todayFte || 1))}</b> · Zero <b className="tnum text-ink-900">{fmtMoneyShort(a.rates.loadedHourlyZero * a.rates.productiveHoursPerMonth * 12)}</b></div>
          </div>
        </Group>

        <Group title="3 · Planning defaults" intro="The assumptions the scenarios lean on. Every one is a judgement call — change it if you'd argue a different number.">
          <Field label="Digital fee compression p.a." desc="How fast digital fees erode as AI commoditises them." value={a.feeCompression} onChange={(v) => set({ feeCompression: v })} kind="percent" step={1} tag="assumed" />
          <Field label="Owner comp (MD + CEO)" desc="Combined market-rate salaries, when counted in opex." value={a.ownerComp} onChange={(v) => set({ ownerComp: v })} kind="money" step={10000} tag="assumed" />
          <Field label="Zero AI / tooling budget" desc="Planned annual AI-tooling spend for the rebuilt agency." value={a.aiSpendZero} onChange={(v) => set({ aiSpendZero: v })} kind="money" step={5000} tag="plan" />
          <Field label="Profit floor" desc="The annual profit we don't want to fall below." value={a.profitFloor} onChange={(v) => set({ profitFloor: v })} kind="money" step={50000} tag="plan" />
          <Field label="Redundancy payout (weeks)" desc="Avg weeks paid per departing role, in the restructure path." value={a.redundancyWeeks} onChange={(v) => set({ redundancyWeeks: v })} kind="number" step={1} tag="assumed" />
        </Group>

        <Group title="4 · What the automation levels mean" intro="The definitions that turn a judgement ('AI can take most of this') into a number. This is the deepest assumption — % of each process that STAYS human.">
          <Field label="'Some' — stays human" desc="AI assists; the human still does most of it." value={a.residual.some} onChange={(v) => setRes({ some: v })} kind="percent" step={5} tag="assumed" />
          <Field label="'Most' — stays human" desc="AI produces; a human reviews every output." value={a.residual.most} onChange={(v) => setRes({ most: v })} kind="percent" step={5} tag="assumed" />
          <Field label="'Nearly all' — stays human" desc="AI runs it; a human handles only exceptions." value={a.residual.nearlyAll} onChange={(v) => setRes({ nearlyAll: v })} kind="percent" step={5} tag="assumed" />
          <Field label="Conservatism stress" desc="How far the Conservative dial cuts assumed automation." value={a.conservatismStress} onChange={(v) => set({ conservatismStress: v })} kind="percent" step={5} tag="assumed" />
          <Field label="'Light' task weight" desc="A light task's share of someone's time vs a normal one (1.0)." value={a.intensity.light} onChange={(v) => setInt({ light: v })} kind="number" step={0.1} tag="assumed" />
          <Field label="'Heavy' task weight" desc="A heavy task's share of someone's time vs a normal one (1.0)." value={a.intensity.heavy} onChange={(v) => setInt({ heavy: v })} kind="number" step={0.5} tag="assumed" />
        </Group>
      </div>

      <p className="mt-5 text-[12px] leading-relaxed text-ink-300">
        Autosaves on this device and flows through every screen — the Rebuild, the Workshop, the Model, the numbers. Per-process detail (who does what, how automatable) lives in the Workshop; this is the world those processes sit in. <b className="text-ink-500">"None"</b> always means 100% human, so it isn't listed.
      </p>
    </div>
  );
}
