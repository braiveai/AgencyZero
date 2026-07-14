"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ramp, runModel, totalRealisedFte, totalTodayFte, type DataCtx, type ScenarioParams } from "@/lib/model/engine";
import { makePresets } from "@/lib/model/presets";
import { useAssumptions } from "@/lib/model/assumptions";
import { stages } from "@/lib/model/processes";
import { staff } from "@/lib/model/staff";
import { fmtMoneyShort } from "@/lib/format";
import { PageHead, Toggle, StatCard } from "@/components/ui";
import { ProfitLines } from "@/components/charts";

const YEARS = [0, 1, 2, 3, 4];

export default function Horizons() {
  const [path, setPath] = useState<"attrition" | "restructure">("restructure");
  const a = useAssumptions();
  const ctx = useMemo<DataCtx>(() => ({ stages, staff, assumptions: a }), [a]);
  const PAYOUT_WEEKS = a.redundancyWeeks;

  const zeroPreset = makePresets("base", 0, a).find((p) => p.key === "agency-zero")!.params;
  const sqPreset = makePresets("base", 0, a).find((p) => p.key === "status-quo")!.params;

  const rampYears = path === "restructure" ? 1.5 : 3;
  const departingFte = totalTodayFte(ctx) - Object.values(zeroPreset.fteByStage).reduce((x, y) => x + y, 0);
  const loadedToday = a.financials.peopleCost / totalTodayFte(ctx);
  const loadedZero = a.rates.loadedHourlyZero * a.rates.productiveHoursPerMonth * 12;
  const weeklyCost = loadedToday / 52;
  const redundancyCost = path === "restructure" ? departingFte * weeklyCost * PAYOUT_WEEKS : 0;

  const proj = useMemo(() => {
    let cumZero = 0;
    let cumSq = 0;
    let breakEven: number | null = null;
    return YEARS.map((t) => {
      // Loaded cost glides today→senior with the ramp, so Year 0 reconciles to
      // today's economics rather than paying the whole org senior rates on day one.
      const loaded = loadedToday + (loadedZero - loadedToday) * ramp(t, rampYears);
      const zp: ScenarioParams = {
        ...zeroPreset,
        loadedCostPerHead: loaded,
        horizonYear: t,
        rampYears,
        redundancyThisYear: path === "restructure" && t === 1 ? redundancyCost : 0,
      };
      const sp: ScenarioParams = { ...sqPreset, horizonYear: t };
      const zProfit = runModel(zp).profit;
      const sProfit = runModel(sp).profit;
      cumZero += zProfit;
      cumSq += sProfit;
      if (breakEven === null && t > 0 && cumZero > cumSq) breakEven = t;
      return {
        year: t,
        zProfit,
        sProfit,
        headcount: totalRealisedFte(zp),
        cumZero,
        cumSq,
        cumDelta: cumZero - cumSq,
        breakEven,
      };
    });
  }, [path, rampYears, redundancyCost, a]);

  const breakEven = proj.find((p) => p.breakEven)?.breakEven ?? null;
  const endDelta = proj[proj.length - 1].cumDelta;

  return (
    <div>
      <PageHead
        eyebrow="S4 · Horizons"
        title="The glide path (18–24 months)"
        lead="Zero is the marker; this is the plan. H1: don't backfill attrition, force adoption in Optimise + Prove. H2: restructure roles around new workflows. H3: compound — grow revenue on flat headcount."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Toggle value={path} onChange={(v) => setPath(v as "attrition" | "restructure")} options={[{ value: "attrition", label: "Attrition-led" }, { value: "restructure", label: "Restructure-led" }]} />
        <div className="text-[12px] text-ink-300">
          {path === "restructure" ? `Faster (~18mo), redundancy modelled at ${PAYOUT_WEEKS}wk payout.` : "Slower (~3yr), no redundancy cost — don't backfill departures."}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Redundancy cost" value={fmtMoneyShort(redundancyCost)} sub={path === "restructure" ? `~${departingFte.toFixed(0)} roles × ${PAYOUT_WEEKS}wk` : "avoided via attrition"} tone={redundancyCost > 0 ? "negative" : "positive"} />
        <StatCard label="Transition break-even" value={breakEven ? `Year ${breakEven}` : "—"} sub="cumulative profit clears status quo" tone="positive" />
        <StatCard label="Cumulative gain vs status quo" value={fmtMoneyShort(endDelta)} sub="over 4 years" tone="accent" />
        <StatCard label="Headcount by year 3" value={proj[3].headcount.toFixed(1)} sub={`from ${totalTodayFte(ctx).toFixed(0)} today`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="eyebrow mb-1">Annual net profit — Zero vs Status Quo</div>
          <p className="mb-1 text-[13px] leading-snug text-ink-500">
            Two paths over four years. <b className="text-accent-dark">Gold — Agency Zero:</b> profit climbs as the rebuild lands. <b className="text-negative">Red — Status Quo:</b> profit sinks toward the dashed <b>$1m floor</b> as digital fees compress and costs stay put.
          </p>
          <p className="mb-3 text-[12px] leading-snug text-ink-400">
            Read it as the <b>gap between the lines</b> — that's the annual cost of doing nothing{breakEven ? `, opening up from the Year ${breakEven} crossover` : ""}. By Year&nbsp;4 it's ~{fmtMoneyShort(proj[proj.length - 1].zProfit - proj[proj.length - 1].sProfit)} a year.
          </p>
          <ProfitLines
            years={YEARS}
            series={[
              { key: "z", label: "Agency Zero", color: "gold", values: proj.map((p) => p.zProfit) },
              { key: "s", label: "Status Quo", color: "neg", values: proj.map((p) => p.sProfit) },
            ]}
          />
        </div>
        <div className="card p-5">
          <div className="eyebrow mb-1">Headcount curve</div>
          <p className="mb-1 text-[13px] leading-snug text-ink-500">
            One line: total headcount gliding from ~{proj[0].headcount.toFixed(0)} today down to ~{proj[proj.length - 1].headcount.toFixed(0)} as roles aren't backfilled and the work shifts to systems.
          </p>
          <p className="mb-3 text-[12px] leading-snug text-ink-400">
            The <b>{path === "restructure" ? "Restructure-led" : "Attrition-led"}</b> toggle sets the pace — {path === "restructure" ? "faster (~18 months), with a redundancy cost" : "slower (~3 years), no redundancy — you simply don't re-hire departures"}. The steeper the drop, the sooner the savings.
          </p>
          <ProfitLines
            years={YEARS}
            series={[{ key: "h", label: "FTE", color: "ink", values: proj.map((p) => p.headcount) }]}
          />
          <p className="mt-1 text-[11px] text-ink-300">Read the shape of the descent, not the axis labels — this chart reuses the profit chart's dollar scale, so the numbers on the left don't apply here.</p>
        </div>
      </div>

      <div className="mt-4 card overflow-x-auto p-5">
        <div className="eyebrow mb-1">Year-by-year</div>
        <p className="mb-3 text-[12px] leading-snug text-ink-400">The two profit columns behind the chart. <b>Cumulative gain</b> adds up the yearly difference (incl. any redundancy) — it starts negative while you invest, then turns positive at break-even and compounds. That final figure is the total profit Zero earns over Status Quo across the four years.</p>
        <table className="w-full min-w-[560px] text-[12px]">
          <thead>
            <tr className="border-b border-rule text-left text-ink-300">
              <th className="py-2 font-semibold">Year</th>
              <th className="py-2 text-right font-semibold">Headcount</th>
              <th className="py-2 text-right font-semibold">Zero profit</th>
              <th className="py-2 text-right font-semibold">Status-quo profit</th>
              <th className="py-2 text-right font-semibold">Cumulative gain</th>
            </tr>
          </thead>
          <tbody>
            {proj.map((p) => (
              <tr key={p.year} className="border-b border-rule_soft">
                <td className="py-2 font-medium text-ink-900">{p.year === 0 ? "Now" : `Year ${p.year}`}</td>
                <td className="tnum py-2 text-right">{p.headcount.toFixed(1)}</td>
                <td className="tnum py-2 text-right text-positive">{fmtMoneyShort(p.zProfit)}</td>
                <td className="tnum py-2 text-right text-ink-500">{fmtMoneyShort(p.sProfit)}</td>
                <td className={clsx("tnum py-2 text-right font-semibold", p.cumDelta >= 0 ? "text-positive" : "text-negative")}>{fmtMoneyShort(p.cumDelta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
