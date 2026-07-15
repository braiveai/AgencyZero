"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  deriveZeroFteByStage,
  runModel,
  runModelBanded,
  totalTodayFte,
  type Conservatism,
  type ScenarioParams,
} from "@/lib/model/engine";
import { defaultParams, makePresets } from "@/lib/model/presets";
import { useWorkshopCtx } from "@/lib/model/useWorkshopCtx";
import { clearActiveModel, loadActiveModel, saveActiveModel } from "@/lib/scenario-store";
import { fmtMoney, fmtMoneyShort, fmtPct } from "@/lib/format";
import { PageHead, Toggle } from "@/components/ui";
import { saveScenario } from "@/lib/scenario-store";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt: (v: number) => string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-[13px] font-medium text-ink-700">{label}</label>
        <span className="tnum text-[13px] font-bold text-ink-900">{fmt(value)}</span>
      </div>
      {hint && <div className="mb-1.5 mt-0.5 text-[11px] leading-snug text-ink-400">{hint}</div>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1 w-full"
      />
    </div>
  );
}

export default function ModelPage() {
  const ctx = useWorkshopCtx();
  const a = ctx.assumptions;
  const stages = ctx.stages;
  const [params, setParams] = useState<ScenarioParams>(() => defaultParams());
  const [showBands, setShowBands] = useState(true);
  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState(false);

  // If a scenario has been loaded as the active model, lock to it once (its exact
  // dials) and don't clobber. Otherwise track the edited Workshop + assumptions as
  // they load, reseeding the derived preset — the original behaviour.
  const lockedRef = useRef(false);
  useEffect(() => {
    if (lockedRef.current) return;
    const active = loadActiveModel();
    if (active) {
      lockedRef.current = true;
      setParams(active);
      return;
    }
    setParams(defaultParams(a, ctx));
  }, [ctx, a]);

  const update = (patch: Partial<ScenarioParams>) => setParams((p) => ({ ...p, ...patch }));

  const setConservatism = (c: Conservatism) =>
    setParams((p) => ({ ...p, conservatism: c, fteByStage: deriveZeroFteByStage(c, ctx) }));

  // Full reset: drop any loaded scenario and re-derive every dial from the current
  // Workshop + Confirm assumptions, then let the page track them again.
  const resetToDerived = () => {
    clearActiveModel();
    lockedRef.current = false;
    setParams(defaultParams(a, ctx));
  };

  const banded = useMemo(() => runModelBanded(params), [params]);
  const out = banded.base;

  const statusQuo = useMemo(
    () => runModel(makePresets(params.conservatism, params.horizonYear, a, ctx).find((p) => p.key === "status-quo")!.params),
    [params.conservatism, params.horizonYear, a, ctx],
  );

  const deltaVsSq = out.profit - statusQuo.profit;
  const totalFte = out.totalFte;
  const aboveFloor = out.floorHeadroom >= 0;

  const rangeText = (lo: number, hi: number) =>
    showBands ? `${fmtMoneyShort(lo)} – ${fmtMoneyShort(hi)}` : fmtMoneyShort(out.profit);

  function doSave() {
    const name = saveName.trim() || `Scenario ${new Date().toLocaleDateString("en-AU")}`;
    saveScenario(name, params);
    saveActiveModel(params); // make the just-saved model the active one (drives the Report)
    setSaved(true);
    setSaveName("");
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <PageHead
        eyebrow="Step 4 · The model"
        title="Scenario builder"
        lead="Move the assumptions on the left; the P&L, org size and profit floor on the right recalculate instantly. Every input is plain-English below — nothing here is a black box."
      />

      <div className="mb-5 rounded-xl border border-rule bg-rule_soft/50 px-4 py-3 text-[12px] leading-relaxed text-ink-500">
        <b className="text-ink-700">How to read this:</b> the sliders are the assumptions you can argue about; the panel on the right is what they produce. Green means profit is above the $1m floor, red means below. Start with the <b>Conservatism</b> dial top-right — if the story holds on <b>Conservative</b>, it holds.
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* ---- controls ---- */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="mb-1 flex items-center justify-between">
              <div className="eyebrow">Market — the world we're in</div>
              <Toggle
                value={params.conservatism}
                onChange={(v) => setConservatism(v as Conservatism)}
                options={[
                  { value: "optimistic", label: "Optimistic" },
                  { value: "base", label: "Base" },
                  { value: "conservative", label: "Conservative" },
                ]}
              />
            </div>
            <p className="mb-4 text-[11px] leading-snug text-ink-400">
              The <b>Conservatism</b> dial (top-right) sets how cautious every assumption is in one move: <b>Conservative</b> assumes AI takes less and the org stays bigger. The whole case has to survive it.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Slider label="Revenue growth p.a." value={params.revenueGrowth} min={-0.1} max={0.4} step={0.01} onChange={(v) => update({ revenueGrowth: v })} fmt={(v) => fmtPct(v)} hint="How fast gross profit grows each year. 0% = deliberately flat, so the case never leans on winning more work." />
              <Slider label="Digital fee compression p.a." value={params.feeCompression} min={0} max={0.3} step={0.01} onChange={(v) => update({ feeCompression: v })} fmt={(v) => fmtPct(v)} hint="How fast digital management fees shrink as AI commoditises them. This is the threat — turn it up to stress-test doing nothing." />
              <Slider label="Adoption rate" value={params.adoptionRate} min={0} max={1} step={0.05} onChange={(v) => update({ adoptionRate: v })} fmt={(v) => fmtPct(v)} hint="How much of the AI opportunity we actually realise. 100% = every tool used on every account. Low = we own the tools but leave the savings on the table." />
              <Slider label="Horizon" value={params.horizonYear} min={0} max={5} step={1} onChange={(v) => update({ horizonYear: v })} fmt={(v) => (v === 0 ? "Now" : `Year ${v}`)} hint="Which year we're looking at. The rebuild phases in over ~2 years, so Year 0 ≈ today and the full effect lands by Year 2–3." />
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-1 eyebrow">Cost structure — what the rebuilt agency costs</div>
            <p className="mb-4 text-[11px] leading-snug text-ink-400">The two big cost levers: what people cost, and what the tools cost.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Slider label="Avg loaded cost / head" value={params.loadedCostPerHead} min={100_000} max={180_000} step={1_000} onChange={(v) => update({ loadedCostPerHead: v })} fmt={(v) => fmtMoneyShort(v)} hint="Fully-loaded annual cost of an average person (salary + super + on-costs). The Zero org is fewer, more senior people — so higher than today's ~$117k/head." />
              <Slider label="AI / tooling spend p.a." value={params.aiSpendPerYear} min={100_000} max={250_000} step={5_000} onChange={(v) => update({ aiSpendPerYear: v })} fmt={(v) => fmtMoneyShort(v)} hint="A forward estimate of the rebuilt agency's AI-tooling budget. NOTE: today's Xero 'software & subscriptions' line (~$153k) is all SaaS/tech, not AI — so this is a planning number to confirm, not that figure." />
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg bg-rule_soft px-3 py-2.5">
              <div>
                <div className="text-[13px] font-medium text-ink-700">Count owners' salaries as a cost</div>
                <div className="text-[11px] text-ink-300">Puts market-rate MD + CEO pay ({fmtMoneyShort(params.ownerComp)}) into expenses. On = honest profit after paying the owners properly; off = profit before owner pay. Keep it explicit either way.</div>
              </div>
              <button
                onClick={() => update({ ownerCompInOpex: !params.ownerCompInOpex })}
                className={clsx("h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors", params.ownerCompInOpex ? "bg-ink-900" : "bg-ink-200")}
              >
                <span className={clsx("block h-5 w-5 rounded-full bg-surface transition-transform", params.ownerCompInOpex && "translate-x-5")} />
              </button>
            </div>
          </div>

          {/* FTE steppers */}
          <div className="card p-5">
            <div className="mb-1 flex items-center justify-between">
              <div className="eyebrow">Team size per stage — the target org</div>
              <button onClick={resetToDerived} className="text-[11px] font-semibold text-accent-dark hover:underline">
                Reset to derived
              </button>
            </div>
            <p className="mb-3 text-[11px] leading-snug text-ink-400">How many people each part of the agency keeps in the rebuild. Seeded from the Workshop; nudge any stage to test "what if we kept one more here?". Total today <b className="text-ink-700">{totalTodayFte(ctx).toFixed(1)}</b> → target <b className="text-accent-dark">{Object.values(params.fteByStage).reduce((a, b) => a + b, 0).toFixed(1)}</b>.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {stages.map((s) => {
                const v = params.fteByStage[s.id] ?? 0;
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-rule px-3 py-2">
                    <span className="text-[13px] text-ink-700">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => update({ fteByStage: { ...params.fteByStage, [s.id]: Math.max(0, +(v - 0.25).toFixed(2)) } })} className="h-6 w-6 rounded-md border border-rule text-ink-500 hover:bg-rule_soft">−</button>
                      <span className="tnum w-9 text-center text-[13px] font-bold text-ink-900">{v.toFixed(2)}</span>
                      <button onClick={() => update({ fteByStage: { ...params.fteByStage, [s.id]: +(v + 0.25).toFixed(2) } })} className="h-6 w-6 rounded-md border border-rule text-ink-500 hover:bg-rule_soft">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- live outputs ---- */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">What it produces →</div>
          <div className={clsx("card overflow-hidden", aboveFloor ? "border-positive/40" : "border-negative/50")}>
            <div className="border-b border-rule p-5">
              <div className="flex items-center justify-between">
                <div className="eyebrow">Net profit {params.horizonYear === 0 ? "now" : `· year ${params.horizonYear}`}</div>
                <button onClick={() => setShowBands((b) => !b)} title="A range allows for ±10% error on revenue and ±5% on costs. A single number is the mid-point." className="text-[11px] font-semibold text-accent-dark hover:underline">
                  {showBands ? "Show one number" : "Show the range"}
                </button>
              </div>
              <div className={clsx("tnum mt-1 text-3xl font-extrabold tracking-tight", aboveFloor ? "text-positive" : "text-negative")}>
                {rangeText(banded.low.profit, banded.high.profit)}
              </div>
              <div className="mt-1 text-[11px] text-ink-400">{showBands ? "range — allowing ±10% error on revenue, ±5% on cost" : "mid-point estimate"}</div>
              <div className="mt-1.5 text-[12px] text-ink-500">
                {aboveFloor ? "above" : "below"} the <span title="A self-imposed line: we don't want annual profit to fall under $1m.">$1m floor</span> by {fmtMoneyShort(Math.abs(out.floorHeadroom))} ·{" "}
                <span className={deltaVsSq >= 0 ? "text-positive" : "text-negative"}>
                  {deltaVsSq >= 0 ? "+" : "−"}{fmtMoneyShort(Math.abs(deltaVsSq))} vs doing nothing
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-rule">
              {[
                { label: "Total FTE", value: totalFte.toFixed(1), sub: `from ${totalTodayFte(ctx).toFixed(0)} today` },
                { label: "Profit / head", value: fmtMoneyShort(out.profitPerHead), sub: "$75k today" },
                { label: "GP / head", value: fmtMoneyShort(out.gpPerHead), sub: "$235k today" },
                { label: "Payroll ratio", value: fmtPct(out.payrollRatio), sub: "47% today" },
              ].map((r, i) => (
                <div key={r.label} className={clsx("p-4", i >= 2 && "border-t border-rule")}>
                  <div className="eyebrow">{r.label}</div>
                  <div className="tnum mt-1 text-xl font-bold text-ink-900">{r.value}</div>
                  <div className="text-[11px] text-ink-300">{r.sub}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-rule bg-rule_soft/60 p-4">
              <div className="eyebrow mb-2">P&amp;L bridge</div>
              <dl className="space-y-1 text-[12px]">
                {[
                  ["Net revenue", out.netRevenue, false],
                  ["People", -out.peopleCost, true],
                  ["AI / tooling", -out.aiOpex, true],
                  ["Other opex", -out.otherOpex, true],
                ].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between">
                    <dt className="text-ink-500">{l as string}</dt>
                    <dd className={clsx("tnum font-medium", (v as number) < 0 ? "text-negative" : "text-ink-900")}>{fmtMoney(v as number)}</dd>
                  </div>
                ))}
                <div className="mt-1 flex justify-between border-t border-rule pt-1">
                  <dt className="font-semibold text-ink-900">Net profit</dt>
                  <dd className="tnum font-bold text-ink-900">{fmtMoney(out.profit)}</dd>
                </div>
              </dl>
              <div className="mt-2 text-[11px] leading-snug text-ink-300">Thin-month cash cushion ≈ {fmtMoneyShort(out.thinMonthCushion)} — what's left in the year's worst month (today several months run near breakeven, so this is the resilience test).</div>
            </div>
          </div>

          <div className="mt-3 card p-4">
            <div className="eyebrow mb-2">Save scenario</div>
            <div className="flex gap-2">
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Name (e.g. Middle Path v2)" className="flex-1 rounded-lg border border-rule bg-paper px-3 py-1.5 text-[13px] outline-none focus:border-ink-300" />
              <button onClick={doSave} className="rounded-lg bg-ink-900 px-3 py-1.5 text-[13px] font-semibold text-paper">{saved ? "Saved ✓" : "Save"}</button>
            </div>
            <p className="mt-2 text-[11px] text-ink-300">Stored on this device. Compare saved scenarios on the Scenarios screen.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
