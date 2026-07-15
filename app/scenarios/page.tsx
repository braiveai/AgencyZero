"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { runModel, type ScenarioParams } from "@/lib/model/engine";
import { makePresets } from "@/lib/model/presets";
import { fmtMoneyShort, fmtPct } from "@/lib/format";
import { PageHead } from "@/components/ui";
import { deleteScenario, loadScenarios, pullScenarios, type SavedScenario } from "@/lib/scenario-store";
import { useWorkshopCtx } from "@/lib/model/useWorkshopCtx";

interface Card {
  key: string;
  name: string;
  blurb?: string;
  params: ScenarioParams;
  removable?: boolean;
}

function metrics(p: ScenarioParams) {
  const o = runModel({ ...p, horizonYear: 3 });
  return o;
}

export default function Scenarios() {
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  useEffect(() => {
    setSaved(loadScenarios());
    pullScenarios().then((r) => { if (r) setSaved(r); });
  }, []);
  const ctx = useWorkshopCtx();
  const a = ctx.assumptions;

  const presets = makePresets("base", 3, a, ctx);
  const cards: Card[] = useMemo(
    () => [
      ...presets.map((p) => ({ key: p.key, name: p.name, blurb: p.blurb, params: p.params })),
      ...saved.map((s) => ({ key: s.id, name: s.name, blurb: "Saved on this device.", params: s.params, removable: true })),
    ],
    [saved, ctx],
  );

  const best = Math.max(...cards.map((c) => metrics(c.params).profit));

  const rows: { label: string; get: (o: ReturnType<typeof metrics>) => string; hi?: boolean }[] = [
    { label: "Net profit (Y3)", get: (o) => fmtMoneyShort(o.profit), hi: true },
    { label: "Total FTE", get: (o) => o.totalFte.toFixed(1) },
    { label: "Profit / head", get: (o) => fmtMoneyShort(o.profitPerHead) },
    { label: "GP / head", get: (o) => fmtMoneyShort(o.gpPerHead) },
    { label: "Payroll ratio", get: (o) => fmtPct(o.payrollRatio) },
    { label: "Net revenue", get: (o) => fmtMoneyShort(o.netRevenue) },
  ];

  return (
    <div>
      <PageHead
        eyebrow="Step 6 · Scenarios"
        title="Compare"
        lead="The capacity dividend is a choice: take it as profit (same revenue, half the people) or as growth (same people, more revenue). Growth is the preferred use — lead with it."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const o = metrics(c.params);
          const isBest = Math.abs(o.profit - best) < 1;
          return (
            <div key={c.key} className={clsx("card p-5", isBest && "border-positive/50 ring-1 ring-positive/20")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-extrabold text-ink-900">{c.name}</h3>
                    {isBest && <span className="rounded bg-positive/12 px-1.5 py-0.5 text-[10px] font-bold text-positive">TOP PROFIT</span>}
                  </div>
                  {c.blurb && <p className="mt-1 text-[12px] leading-snug text-ink-500">{c.blurb}</p>}
                </div>
                {c.removable && (
                  <button onClick={() => setSaved(deleteScenario(c.key))} className="text-[11px] text-ink-300 hover:text-negative">Delete</button>
                )}
              </div>
              <dl className="mt-4 space-y-1.5">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-baseline justify-between">
                    <dt className="text-[12px] text-ink-500">{r.label}</dt>
                    <dd className={clsx("tnum font-semibold", r.hi ? "text-[15px] text-ink-900" : "text-[13px] text-ink-700")}>{r.get(o)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      {saved.length === 0 && (
        <p className="mt-4 text-[12px] text-ink-300">Build and save scenarios on The Model screen — they appear here alongside the three presets for side-by-side comparison.</p>
      )}
    </div>
  );
}
