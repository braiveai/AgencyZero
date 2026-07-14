"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { stages } from "@/lib/model/processes";
import { staff } from "@/lib/model/staff";
import { tools } from "@/lib/model/tools";
import { runModel, todayFteForProcess, totalTodayFte, totalZeroFte, zeroFteForProcess, type DataCtx } from "@/lib/model/engine";
import { makePresets } from "@/lib/model/presets";
import { useAssumptions } from "@/lib/model/assumptions";
import { fmtMoneyShort, fmtNum } from "@/lib/format";
import { PageHead } from "@/components/ui";

const toolMap = Object.fromEntries(tools.map((t) => [t.id, t]));

export default function StartHere() {
  const a = useAssumptions();
  const ctx = useMemo<DataCtx>(() => ({ stages, staff, assumptions: a }), [a]);
  const opps = useMemo(() => {
    const rows = stages.flatMap((s) =>
      s.processes
        .filter((p) => p.required)
        .map((p) => {
          const today = todayFteForProcess(p, ctx);
          const zero = zeroFteForProcess(p, "base", ctx);
          return { id: p.id, label: p.label, stage: s.label, today, zero, freed: today - zero, tool: p.tools[0] ? toolMap[p.tools[0]] : null };
        }),
    );
    return rows.sort((x, y) => y.freed - x.freed);
  }, [ctx]);

  const top = opps.slice(0, 10);
  const maxFreed = top[0]?.freed || 1;
  const totalFreed = totalTodayFte(ctx) - totalZeroFte("base", ctx);

  // no-regrets tools = the tools behind the biggest owned opportunities
  const startTools = useMemo(() => {
    const seen = new Set<string>();
    const list: typeof tools = [];
    for (const o of opps) {
      if (o.tool && !seen.has(o.tool.id)) { seen.add(o.tool.id); list.push(o.tool); }
      if (list.length >= 3) break;
    }
    return list;
  }, [opps]);

  const middle = runModel(makePresets("base", 3, a).find((p) => p.key === "middle-path")!.params);

  return (
    <div>
      <PageHead
        eyebrow="The decision · start here"
        title="Where the overhead is — and where to start"
        lead="Zero is the marker; the Middle Path is the target; this is where you start on Monday. Every process ranked by the human time AI can take back. The deepest pools that sit behind tools we already own — start there."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-900 px-6 py-4 text-paper">
        <div>
          <div className="text-[13px] uppercase tracking-[0.14em] text-paper/60">Automatable human overhead</div>
          <div className="tnum text-3xl font-extrabold">~{fmtNum(totalFreed)} FTE</div>
        </div>
        <p className="max-w-md text-[13px] leading-snug text-paper/70">of today's {totalTodayFte(ctx).toFixed(0)} people is work AI can take — concentrated in a handful of places. You don't boil the ocean; you drain the deepest pools first.</p>
      </div>

      {/* opportunity ranking */}
      <div className="card p-5">
        <div className="eyebrow mb-3">The opportunity map — biggest freed FTE first</div>
        <div className="space-y-2.5">
          {top.map((o, i) => (
            <div key={o.id} className="flex items-center gap-3">
              <span className="tnum w-4 shrink-0 text-[12px] text-ink-300">{i + 1}</span>
              <div className="w-48 shrink-0">
                <div className="truncate text-[13px] font-semibold text-ink-900">{o.label}</div>
                <div className="text-[11px] text-ink-300">{o.stage}</div>
              </div>
              <div className="flex-1">
                <div className="h-5 w-full overflow-hidden rounded-md bg-rule">
                  <div className="flex h-full items-center rounded-md bg-accent-dark px-2" style={{ width: `${Math.max(8, (o.freed / maxFreed) * 100)}%` }}>
                    <span className="tnum text-[10px] font-bold text-paper">{fmtNum(o.freed)} FTE freed</span>
                  </div>
                </div>
              </div>
              <div className="tnum w-20 shrink-0 text-right text-[11px] text-ink-400">{fmtNum(o.today)} → {fmtNum(o.zero)}</div>
              <div className="w-32 shrink-0">
                {o.tool ? (
                  <span className="rounded-md bg-positive/12 px-1.5 py-0.5 text-[10px] font-semibold text-positive" title={`${o.tool.adoption} adoption today`}>{o.tool.name} · own it</span>
                ) : (
                  <span className="rounded-md bg-flag/12 px-1.5 py-0.5 text-[10px] font-semibold text-flag">no tool yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-ink-300">Green = we already own the tool, so the only gap is adoption. Amber = the one place we'd need to build or buy.</p>
      </div>

      {/* start here */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border-2 border-positive/40 bg-surface p-5 lg:col-span-2">
          <div className="eyebrow mb-3 text-positive">Start here — the next 6 months (no regrets)</div>
          <ol className="space-y-3 text-[14px] text-ink-700">
            <li className="flex gap-3">
              <span className="tnum font-bold text-positive">1</span>
              <span><b className="text-ink-900">Mandate adoption of what we already own.</b> The biggest pools sit behind {startTools.map((t) => t.name).join(", ")} — tools already built, used inconsistently. Full adoption on every account costs nothing new and captures most of the win. The constraint is adoption, not capability.</span>
            </li>
            <li className="flex gap-3">
              <span className="tnum font-bold text-positive">2</span>
              <span><b className="text-ink-900">Don't backfill the next one or two departures.</b> Let the org glide toward the target naturally — no redundancies, no drama, just don't re-hire into roles the systems now cover.</span>
            </li>
            <li className="flex gap-3">
              <span className="tnum font-bold text-positive">3</span>
              <span><b className="text-ink-900">Re-decide at month 6, on evidence.</b> With adoption real and the numbers moving, make the restructure call from data — not from this slide.</span>
            </li>
          </ol>
        </div>
        <div className="rounded-2xl border border-rule bg-rule_soft/50 p-5">
          <div className="eyebrow mb-2">The target we're steering to</div>
          <div className="text-[13px] text-ink-500">Middle Path · Year 3</div>
          <div className="tnum mt-1 text-3xl font-extrabold text-ink-900">{fmtMoneyShort(middle.profit)}</div>
          <div className="text-[12px] text-ink-300">net profit (vs $1.43m today)</div>
          <div className="mt-4 space-y-1.5 text-[13px]">
            <div className="flex justify-between"><span className="text-ink-500">People</span><span className="tnum font-semibold">{middle.totalFte.toFixed(0)} <span className="text-ink-300">(from 19)</span></span></div>
            <div className="flex justify-between"><span className="text-ink-500">Profit / head</span><span className="tnum font-semibold">{fmtMoneyShort(middle.profitPerHead)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Payroll ratio</span><span className="tnum font-semibold">{Math.round(middle.payrollRatio * 100)}%</span></div>
          </div>
          <p className="mt-3 text-[11px] text-ink-300">Not the full Zero — the deliberate middle. Editable on the Model screen.</p>
        </div>
      </div>

      <p className="mt-5 text-[12px] leading-relaxed text-ink-300">
        This isn't "fire people Monday." It's: adopt what we own, stop backfilling, and decide the rest with real numbers in six months. The Zero state is the outer marker that makes the middle path a deliberate choice — not a drift.
      </p>
    </div>
  );
}
