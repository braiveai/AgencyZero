"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { stages } from "@/lib/model/processes";
import {
  deriveZeroFteByStage,
  runModel,
  runModelBanded,
  totalTodayFte,
  type Conservatism,
  type ScenarioParams,
} from "@/lib/model/engine";
import { defaultParams, makePresets } from "@/lib/model/presets";
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
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 w-full"
      />
      {hint && <div className="mt-1 text-[11px] text-ink-300">{hint}</div>}
    </div>
  );
}

export default function ModelPage() {
  const [params, setParams] = useState<ScenarioParams>(() => defaultParams());
  const [showBands, setShowBands] = useState(true);
  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<ScenarioParams>) => setParams((p) => ({ ...p, ...patch }));

  const setConservatism = (c: Conservatism) =>
    setParams((p) => ({ ...p, conservatism: c, fteByStage: deriveZeroFteByStage(c) }));

  const banded = useMemo(() => runModelBanded(params), [params]);
  const out = banded.base;

  const statusQuo = useMemo(
    () =>
      runModel(
        makePresets(params.conservatism, params.horizonYear).find((p) => p.key === "status-quo")!.params,
      ),
    [params.conservatism, params.horizonYear],
  );

  const deltaVsSq = out.profit - statusQuo.profit;
  const totalFte = out.totalFte;
  const aboveFloor = out.profit >= 1_000_000;

  const rangeText = (lo: number, hi: number) =>
    showBands ? `${fmtMoneyShort(lo)} – ${fmtMoneyShort(hi)}` : fmtMoneyShort(out.profit);

  function doSave() {
    const name = saveName.trim() || `Scenario ${new Date().toLocaleDateString("en-AU")}`;
    saveScenario(name, params);
    setSaved(true);
    setSaveName("");
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <PageHead
        eyebrow="S3 · The model"
        title="Scenario builder"
        lead="Move the assumptions; watch the P&L, org shape and floor recalculate. The headcount is derived bottom-up from residual hours — challenge any line item on the Value Chain screen and it flows through here."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* ---- controls ---- */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="eyebrow">Market</div>
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
            <div className="grid gap-5 sm:grid-cols-2">
              <Slider label="Revenue growth p.a." value={params.revenueGrowth} min={-0.1} max={0.4} step={0.01} onChange={(v) => update({ revenueGrowth: v })} fmt={(v) => fmtPct(v)} />
              <Slider label="Digital fee compression p.a." value={params.feeCompression} min={0} max={0.3} step={0.01} onChange={(v) => update({ feeCompression: v })} fmt={(v) => fmtPct(v)} hint="The threat slider — our steadiest line is the first AI compresses." />
              <Slider label="Adoption rate" value={params.adoptionRate} min={0} max={1} step={0.05} onChange={(v) => update({ adoptionRate: v })} fmt={(v) => fmtPct(v)} hint="Scales realised absorption. Tools we own but don't use cost us here." />
              <Slider label="Horizon" value={params.horizonYear} min={0} max={5} step={1} onChange={(v) => update({ horizonYear: v })} fmt={(v) => (v === 0 ? "Now" : `Year ${v}`)} />
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-4 eyebrow">Cost structure</div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Slider label="Avg loaded cost / head" value={params.loadedCostPerHead} min={100_000} max={180_000} step={1_000} onChange={(v) => update({ loadedCostPerHead: v })} fmt={(v) => fmtMoneyShort(v)} hint="Zero-state skews senior — fewer people, paid more." />
              <Slider label="AI / tooling spend p.a." value={params.aiSpendPerYear} min={100_000} max={250_000} step={5_000} onChange={(v) => update({ aiSpendPerYear: v })} fmt={(v) => fmtMoneyShort(v)} />
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg bg-rule_soft px-3 py-2.5">
              <div>
                <div className="text-[13px] font-medium text-ink-700">Owner comp in opex</div>
                <div className="text-[11px] text-ink-300">Market-rate MD + CEO salaries ({fmtMoneyShort(params.ownerComp)}) — must be explicit or the model is dishonest.</div>
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
              <div className="eyebrow">FTE per value-chain stage (target)</div>
              <button onClick={() => setConservatism(params.conservatism)} className="text-[11px] font-semibold text-accent-dark hover:underline">
                Reset to derived
              </button>
            </div>
            <p className="mb-3 text-[11px] text-ink-300">Seeded from the derived Zero org. Total today {totalTodayFte().toFixed(1)} → target {Object.values(params.fteByStage).reduce((a, b) => a + b, 0).toFixed(1)}.</p>
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
          <div className={clsx("card overflow-hidden", aboveFloor ? "border-positive/40" : "border-negative/50")}>
            <div className="border-b border-rule p-5">
              <div className="flex items-center justify-between">
                <div className="eyebrow">Net profit {params.horizonYear === 0 ? "now" : `· year ${params.horizonYear}`}</div>
                <button onClick={() => setShowBands((b) => !b)} className="text-[11px] font-semibold text-accent-dark hover:underline">
                  {showBands ? "Point estimate" : "Show band"}
                </button>
              </div>
              <div className={clsx("tnum mt-1 text-3xl font-extrabold tracking-tight", aboveFloor ? "text-positive" : "text-negative")}>
                {rangeText(banded.low.profit, banded.high.profit)}
              </div>
              <div className="mt-1 text-[12px] text-ink-500">
                {aboveFloor ? "above" : "below"} the $1m floor by {fmtMoneyShort(Math.abs(out.floorHeadroom))} ·{" "}
                <span className={deltaVsSq >= 0 ? "text-positive" : "text-negative"}>
                  {deltaVsSq >= 0 ? "+" : "−"}{fmtMoneyShort(Math.abs(deltaVsSq))} vs status quo
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-rule">
              {[
                { label: "Total FTE", value: totalFte.toFixed(1), sub: `from ${totalTodayFte().toFixed(0)} today` },
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
              <div className="mt-2 text-[11px] text-ink-300">Thin-month cash cushion ≈ {fmtMoneyShort(out.thinMonthCushion)} (worst month proxy).</div>
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
