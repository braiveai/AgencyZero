"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { stages as SEED } from "@/lib/model/processes";
import { rates } from "@/lib/model/baseline";
import { effectiveResidual, isDemoted } from "@/lib/model/engine";
import { LADDER, type AutomationLevel, type Process, type Stage } from "@/lib/model/types";
import { fmtMoney, fmtMoneyShort } from "@/lib/format";
import { PageHead, LadderBadge, Toggle } from "@/components/ui";

const BAND_MID: Record<AutomationLevel, number> = { L0: 1, L1: 0.55, L2: 0.22, L3: 0.1, L4: 0.03 };
const LEVELS: AutomationLevel[] = ["L0", "L1", "L2", "L3", "L4"];

const clone = (s: Stage[]): Stage[] => JSON.parse(JSON.stringify(s));

function stageZeroFte(s: Stage): number {
  return s.processes.reduce((a, p) => a + effectiveResidual(p, "base"), 0) / rates.productiveHoursPerMonth;
}

function humanCost(p: Process) {
  return p.hoursPerMonth * rates.loadedHourlyToday;
}
function aiCost(p: Process) {
  return p.aiRunCostPerMonth + p.residualHoursPerMonth * rates.loadedHourlyZero;
}

export default function ValueChain() {
  const [data, setData] = useState<Stage[]>(() => clone(SEED));
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"today" | "zero">("zero");

  const open = data.find((s) => s.id === openId) ?? null;

  const totals = useMemo(() => {
    const today = data.reduce((a, s) => a + s.fteToday.value, 0);
    const zero = data.reduce((a, s) => a + stageZeroFte(s), 0);
    return { today, zero };
  }, [data]);

  function setProcess(stageId: string, procId: string, patch: Partial<Process>) {
    setData((prev) =>
      prev.map((s) =>
        s.id !== stageId
          ? s
          : { ...s, processes: s.processes.map((p) => (p.id === procId ? { ...p, ...patch } : p)) },
      ),
    );
  }

  function changeLevel(stageId: string, p: Process, level: AutomationLevel) {
    setProcess(stageId, p.id, {
      automationLevel: level,
      residualHoursPerMonth: Math.round(p.hoursPerMonth * BAND_MID[level] * 10) / 10,
    });
  }

  return (
    <div>
      <PageHead
        eyebrow="S2 · Value chain"
        title="Eight stages, today → zero"
        lead="Every process maps to one stage. Open a stage to see the process-level cost model — re-level any line and the stage's derived FTE recalculates live. This is the mechanism behind the tolerance-band story."
      />

      <div className="mb-4 flex items-center justify-between">
        <Toggle value={view} onChange={(v) => setView(v as "today" | "zero")} options={[{ value: "today", label: "Today weights" }, { value: "zero", label: "Zero weights" }]} />
        <div className="text-[13px] text-ink-500">
          <span className="tnum font-bold text-ink-900">{totals.today.toFixed(1)}</span> FTE today →{" "}
          <span className="tnum font-bold text-accent-dark">{totals.zero.toFixed(1)}</span> at Zero
        </div>
      </div>

      {/* horizontal flow */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {data.map((s) => {
          const zero = stageZeroFte(s);
          const weight = view === "today" ? s.fteToday.value : zero;
          const maxW = view === "today" ? 4 : 2;
          return (
            <button
              key={s.id}
              onClick={() => setOpenId(s.id)}
              className={clsx(
                "flex flex-col rounded-xl border p-3 text-left transition-colors",
                openId === s.id ? "border-ink-900 bg-surface" : "border-rule bg-surface hover:border-ink-300",
              )}
            >
              <div className="eyebrow">{s.order}</div>
              <div className="mt-0.5 text-[13px] font-bold text-ink-900">{s.label}</div>
              <div className="mt-2 flex h-16 items-end">
                <div className="w-full rounded-t bg-gradient-to-t from-ink-900 to-ink-700" style={{ height: `${Math.max(6, (weight / maxW) * 100)}%` }} />
              </div>
              <div className="tnum mt-1 text-[12px] font-semibold text-ink-700">
                {view === "today" ? s.fteToday.value.toFixed(1) : zero.toFixed(2)} FTE
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-ink-300">Plan precedes Onboard by design — Sunny's proposals are full blueprints, so the expensive thinking happens pre-signature. Win and Plan overlap in time; the chain shows logical sequence, not a strict waterfall.</p>

      {/* drawer */}
      {open && (
        <div className="mt-6 card p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">Stage {open.order}</div>
              <h2 className="text-xl font-extrabold text-ink-900">{open.label}</h2>
              <p className="mt-0.5 max-w-2xl text-[13px] text-ink-500">{open.covers}</p>
            </div>
            <div className="text-right">
              <div className="eyebrow">Derived FTE at Zero</div>
              <div className="tnum text-2xl font-bold text-accent-dark">{stageZeroFte(open).toFixed(2)}</div>
              <div className="text-[11px] text-ink-300">from {open.fteToday.value.toFixed(1)} today</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-[12px]">
              <thead>
                <tr className="border-b border-rule text-left text-ink-300">
                  <th className="py-2 font-semibold">Process</th>
                  <th className="py-2 text-right font-semibold">Hrs/mo</th>
                  <th className="py-2 text-right font-semibold">Human cost</th>
                  <th className="py-2 font-semibold">Level</th>
                  <th className="py-2 text-right font-semibold">AI run</th>
                  <th className="py-2 text-right font-semibold">Residual hrs</th>
                  <th className="py-2 text-right font-semibold">Net saving/mo</th>
                  <th className="py-2 font-semibold">Escalation owner</th>
                </tr>
              </thead>
              <tbody>
                {open.processes.map((p) => {
                  const demoted = isDemoted(p);
                  const needsEsc = p.automationLevel === "L3" || p.automationLevel === "L4";
                  const saving = humanCost(p) - aiCost(p);
                  return (
                    <tr key={p.id} className="border-b border-rule_soft align-middle">
                      <td className="py-2 pr-2">
                        <span className="font-medium text-ink-900">{p.label}</span>
                        {p.clientFacing && <span className="ml-1.5 rounded bg-accent-wash px-1 text-[10px] font-semibold text-accent-dark">client-facing</span>}
                      </td>
                      <td className="tnum py-2 text-right">{p.hoursPerMonth}</td>
                      <td className="tnum py-2 text-right text-ink-500">{fmtMoney(humanCost(p))}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={p.automationLevel}
                            onChange={(e) => changeLevel(open.id, p, e.target.value as AutomationLevel)}
                            className="rounded border border-rule bg-paper px-1 py-0.5 text-[11px] font-semibold"
                          >
                            {LEVELS.map((l) => (
                              <option key={l} value={l}>{l} · {LADDER[l].label}</option>
                            ))}
                          </select>
                          {demoted && <LadderBadge level="L2" demoted />}
                        </div>
                      </td>
                      <td className="tnum py-2 text-right text-ink-500">{fmtMoney(p.aiRunCostPerMonth)}</td>
                      <td className="tnum py-2 text-right">{p.residualHoursPerMonth}</td>
                      <td className={clsx("tnum py-2 text-right font-semibold", saving >= 0 ? "text-positive" : "text-negative")}>{fmtMoney(saving)}</td>
                      <td className="py-2">
                        {needsEsc ? (
                          p.escalation ? (
                            <span className="text-ink-700" title={`${p.escalation.trigger} · SLA ${p.escalation.slaHours}h`}>
                              {p.escalation.owner}
                              {p.escalation.clientFacingRisk && <span className="ml-1 text-negative" title="client-facing risk">●</span>}
                            </span>
                          ) : (
                            <span className="rounded bg-negative/10 px-1.5 py-0.5 text-[10px] font-bold text-negative">no path → demoted to L2</span>
                          )
                        ) : (
                          <span className="text-ink-200">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-ink-300">
            Human cost @ ${rates.loadedHourlyToday}/hr · AI cost = run cost + residual hours @ ${rates.loadedHourlyZero}/hr. Selecting L3/L4 without an escalation owner demotes the process to L2 — no escalation, no autonomy claim.
          </p>
        </div>
      )}
    </div>
  );
}
