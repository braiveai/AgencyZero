"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { rates } from "@/lib/model/baseline";
import {
  assignmentCounts,
  deriveZeroFteByStage,
  fteTodayForStage,
  fteZeroForStage,
  todayFteForProcess,
  totalTodayFte,
  totalZeroFte,
  unallocatedFte,
  zeroFteForProcess,
  type DataCtx,
  type ScenarioParams,
} from "@/lib/model/engine";
import {
  AUTOMATABILITY_LABEL,
  GROUP_LABEL_ORDER,
  INTENSITY_LABEL,
  type Automatability,
  type Intensity,
  type Process,
  type StaffGroup,
  type StaffRole,
} from "@/lib/model/types";
import { GROUP_LABEL } from "@/lib/model/staff";
import { fmtNum } from "@/lib/format";
import { PageHead } from "@/components/ui";
import {
  defaultWorkshop,
  loadWorkshop,
  resetWorkshop,
  saveWorkshop,
  type WorkshopState,
} from "@/lib/workshop-store";
import { saveScenario } from "@/lib/scenario-store";

const AUTO_OPTS: Automatability[] = ["none", "some", "most", "nearly-all"];
const AUTO_SHORT: Record<Automatability, string> = { none: "None", some: "Some", most: "Most", "nearly-all": "Nearly all" };
const INT_OPTS: Intensity[] = ["light", "normal", "heavy"];
const INT_SHORT: Record<Intensity, string> = { light: "Light", normal: "Normal", heavy: "Heavy" };

function Seg<T extends string>({ opts, value, onChange, labelFor, titleFor }: { opts: T[]; value: T; onChange: (v: T) => void; labelFor: (v: T) => string; titleFor?: (v: T) => string }) {
  return (
    <div className="inline-flex rounded-lg border border-rule bg-paper p-0.5">
      {opts.map((o) => (
        <button key={o} title={titleFor?.(o)} onClick={() => onChange(o)}
          className={clsx("rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors", value === o ? "bg-ink-900 text-paper" : "text-ink-500 hover:text-ink-900")}>
          {labelFor(o)}
        </button>
      ))}
    </div>
  );
}

export default function ValueChainWorkshop() {
  const router = useRouter();
  const [state, setState] = useState<WorkshopState>(() => defaultWorkshop());
  const [ready, setReady] = useState(false);
  const [openStages, setOpenStages] = useState<Record<string, boolean>>({});
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState<{ label: string; group: StaffGroup }>({ label: "", group: "digital" });
  const [addProcFor, setAddProcFor] = useState<string | null>(null);
  const [newProcLabel, setNewProcLabel] = useState("");

  useEffect(() => {
    const s = loadWorkshop();
    setState(s);
    setOpenStages({ [s.stages[0]?.id]: true });
    setReady(true);
  }, []);
  useEffect(() => { if (ready) saveWorkshop(state); }, [state, ready]);

  const ctx: DataCtx = useMemo(() => ({ stages: state.stages, staff: state.staff }), [state]);
  const weights = useMemo(() => assignmentCounts(ctx), [ctx]);
  const totals = useMemo(() => ({
    today: totalTodayFte(ctx),
    zero: totalZeroFte("base", ctx),
    unalloc: unallocatedFte(ctx),
  }), [ctx]);
  const allProcIds = useMemo(() => state.stages.flatMap((s) => s.processes.map((p) => p.id)), [state.stages]);
  const reviewedCount = state.reviewed.filter((id) => allProcIds.includes(id)).length;

  // ---- mutations ----
  const mutateProc = (procId: string, patch: Partial<Process>) =>
    setState((s) => ({ ...s, stages: s.stages.map((st) => ({ ...st, processes: st.processes.map((p) => (p.id === procId ? { ...p, ...patch } : p)) })) }));
  const toggleStaffOnProc = (proc: Process, staffId: string) =>
    mutateProc(proc.id, { staffIds: proc.staffIds.includes(staffId) ? proc.staffIds.filter((x) => x !== staffId) : [...proc.staffIds, staffId] });
  const removeProc = (procId: string) =>
    setState((s) => ({ ...s, stages: s.stages.map((st) => ({ ...st, processes: st.processes.filter((p) => p.id !== procId) })), reviewed: s.reviewed.filter((x) => x !== procId) }));
  const toggleReviewed = (procId: string) =>
    setState((s) => ({ ...s, reviewed: s.reviewed.includes(procId) ? s.reviewed.filter((x) => x !== procId) : [...s.reviewed, procId] }));
  const addProc = (stageId: string) => {
    const label = newProcLabel.trim();
    if (!label) return;
    const id = `custom-${stageId}-${state.stages.length}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)}`;
    const proc: Process = { id, label, description: "Added in the workshop.", required: true, staffIds: [], automatability: "some", intensity: "normal", escalation: null, clientFacing: false, tools: [] };
    setState((s) => ({ ...s, stages: s.stages.map((st) => (st.id === stageId ? { ...st, processes: [...st.processes, proc] } : st)) }));
    setNewProcLabel(""); setAddProcFor(null);
  };
  const setStaffFte = (id: string, fte: number) =>
    setState((s) => ({ ...s, staff: s.staff.map((r) => (r.id === id ? { ...r, fte } : r)) }));
  const removeStaff = (id: string) =>
    setState((s) => ({ ...s, staff: s.staff.filter((r) => r.id !== id), stages: s.stages.map((st) => ({ ...st, processes: st.processes.map((p) => ({ ...p, staffIds: p.staffIds.filter((x) => x !== id) })) })) }));
  const addStaff = () => {
    const label = newStaff.label.trim();
    if (!label) return;
    const id = `role-${state.staff.length}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 16)}`;
    setState((s) => ({ ...s, staff: [...s.staff, { id, label, fte: 1, group: newStaff.group }] }));
    setNewStaff({ label: "", group: newStaff.group });
  };

  function runModel() {
    const params: ScenarioParams = {
      revenueGrowth: 0, feeCompression: 0.08,
      fteByStage: deriveZeroFteByStage("base", ctx),
      loadedCostPerHead: Math.round(rates.loadedHourlyZero * rates.productiveHoursPerMonth * 12),
      aiSpendPerYear: 160_000, adoptionRate: 1, ownerCompInOpex: false, ownerComp: 400_000,
      horizonYear: 3, conservatism: "base", ctx,
    };
    saveScenario("Workshop build", params);
    router.push("/scenarios");
  }

  const rosterByGroup = useMemo(() => {
    const m: Record<string, StaffRole[]> = {};
    for (const r of state.staff) (m[r.group] ??= []).push(r);
    return m;
  }, [state.staff]);

  if (!ready) return null;

  return (
    <div>
      <PageHead
        eyebrow="S2 · Value chain — workshop"
        title="Build it with them, process by process"
        lead="For each thing the agency does: is it required, who does it today, and how much can AI take? The headcount falls out of your answers — no hour estimates. Add anything we've missed."
      />

      {/* sticky control bar */}
      <div className="sticky top-14 z-20 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule bg-paper/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
          <span>Today <b className="tnum text-ink-900">{fmtNum(totals.today)}</b> FTE</span>
          <span>→ Zero <b className="tnum text-accent-dark">{fmtNum(totals.zero)}</b> FTE</span>
          <span className="text-ink-300">reviewed {reviewedCount}/{allProcIds.length}</span>
          {totals.unalloc > 0.05 && <span className="text-negative">{fmtNum(totals.unalloc)} FTE unallocated</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { if (confirm("Reset to the seeded strawman? This clears your workshop edits.")) setState(resetWorkshop()); }} className="rounded-lg border border-rule px-3 py-1.5 text-[12px] font-semibold text-ink-500 hover:text-ink-900">Reset</button>
          <button onClick={runModel} className="rounded-lg bg-ink-900 px-4 py-1.5 text-[13px] font-semibold text-paper">Run the model →</button>
        </div>
      </div>

      {/* roster */}
      <details className="card mb-5 p-4">
        <summary className="cursor-pointer text-[13px] font-semibold text-ink-900">Staff roster — {state.staff.length} roles, {fmtNum(totals.today)} FTE <span className="font-normal text-ink-300">(edit before you start)</span></summary>
        <div className="mt-4 space-y-3">
          {GROUP_LABEL_ORDER.filter((g) => rosterByGroup[g]?.length).map((g) => (
            <div key={g}>
              <div className="eyebrow mb-1.5">{GROUP_LABEL[g]}</div>
              <div className="flex flex-wrap gap-2">
                {rosterByGroup[g].map((r) => (
                  <span key={r.id} className="flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-2 py-1 text-[12px]">
                    <span className="text-ink-700">{r.label}</span>
                    <input type="number" step={0.5} min={0} max={1} value={r.fte} onChange={(e) => setStaffFte(r.id, Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))} className="tnum w-10 rounded border border-rule bg-paper px-1 text-[11px]" />
                    <button onClick={() => removeStaff(r.id)} className="text-ink-200 hover:text-negative" title="Remove role">×</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input value={newStaff.label} onChange={(e) => setNewStaff((n) => ({ ...n, label: e.target.value }))} placeholder="Add a role…" className="rounded-lg border border-rule bg-paper px-2 py-1 text-[12px]" />
            <select value={newStaff.group} onChange={(e) => setNewStaff((n) => ({ ...n, group: e.target.value as StaffGroup }))} className="rounded-lg border border-rule bg-paper px-2 py-1 text-[12px]">
              {GROUP_LABEL_ORDER.map((g) => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}
            </select>
            <button onClick={addStaff} className="rounded-lg border border-rule px-2 py-1 text-[12px] font-semibold text-ink-700 hover:bg-rule_soft">+ Add role</button>
          </div>
        </div>
      </details>

      {/* stages */}
      <div className="space-y-3">
        {state.stages.map((stage) => {
          const open = openStages[stage.id];
          const sToday = fteTodayForStage(stage, ctx, weights);
          const sZero = fteZeroForStage(stage, "base", ctx, weights);
          return (
            <div key={stage.id} className="card overflow-hidden">
              <button onClick={() => setOpenStages((o) => ({ ...o, [stage.id]: !o[stage.id] }))} className="flex w-full items-center justify-between px-5 py-3 text-left">
                <div className="flex items-baseline gap-3">
                  <span className="eyebrow">{stage.order}</span>
                  <span className="text-[15px] font-bold text-ink-900">{stage.label}</span>
                  <span className="hidden text-[12px] text-ink-300 sm:inline">{stage.covers}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="tnum text-ink-300">{fmtNum(sToday)} → <b className="text-accent-dark">{fmtNum(sZero)}</b></span>
                  <span className="text-ink-300">{open ? "▾" : "▸"}</span>
                </div>
              </button>

              {open && (
                <div className="border-t border-rule">
                  {stage.processes.map((p) => {
                    const tFte = todayFteForProcess(p, ctx, weights);
                    const zFte = zeroFteForProcess(p, "base", ctx, weights);
                    const reviewed = state.reviewed.includes(p.id);
                    return (
                      <div key={p.id} className={clsx("border-b border-rule_soft px-5 py-3", !p.required && "opacity-50")}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <button onClick={() => toggleReviewed(p.id)} title="Mark reviewed" className={clsx("mt-0.5 flex h-4 w-4 items-center justify-center rounded border text-[10px]", reviewed ? "border-positive bg-positive text-paper" : "border-rule text-transparent")}>✓</button>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[14px] font-semibold text-ink-900">{p.label}</span>
                                <span className="cursor-help text-ink-200" title={p.description}>ⓘ</span>
                                {p.clientFacing && <span className="rounded bg-accent-wash px-1 text-[10px] font-semibold text-accent-dark">client</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="tnum text-[12px] text-ink-300">{fmtNum(tFte)} → <b className="text-accent-dark">{p.required ? fmtNum(zFte) : "0.0"}</b></span>
                            {/* required toggle */}
                            <button onClick={() => mutateProc(p.id, { required: !p.required })} title="Required in the rebuilt agency?" className={clsx("rounded-md px-2 py-0.5 text-[11px] font-bold", p.required ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative")}>
                              {p.required ? "Required" : "Not required"}
                            </button>
                            <button onClick={() => removeProc(p.id)} className="text-ink-200 hover:text-negative" title="Delete process">×</button>
                          </div>
                        </div>

                        {/* controls */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 pl-6">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-ink-300">AI can take</span>
                            <Seg opts={AUTO_OPTS} value={p.automatability} onChange={(v) => mutateProc(p.id, { automatability: v })} labelFor={(v) => AUTO_SHORT[v]} titleFor={(v) => AUTOMATABILITY_LABEL[v]} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-ink-300">Time</span>
                            <Seg opts={INT_OPTS} value={p.intensity} onChange={(v) => mutateProc(p.id, { intensity: v })} labelFor={(v) => INT_SHORT[v]} titleFor={(v) => INTENSITY_LABEL[v]} />
                          </div>
                        </div>

                        {/* who does this */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
                          <span className="text-[11px] text-ink-300">Who does this?</span>
                          {p.staffIds.length === 0 && <span className="text-[11px] italic text-ink-200">nobody assigned</span>}
                          {p.staffIds.map((id) => {
                            const r = state.staff.find((x) => x.id === id);
                            if (!r) return null;
                            return (
                              <button key={id} onClick={() => toggleStaffOnProc(p, id)} className="flex items-center gap-1 rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-medium text-paper">
                                {r.label}<span className="text-ink-200">×</span>
                              </button>
                            );
                          })}
                          <button onClick={() => setPickerFor(pickerFor === p.id ? null : p.id)} className="rounded-full border border-dashed border-ink-300 px-2 py-0.5 text-[11px] font-semibold text-ink-500 hover:bg-rule_soft">+ people</button>
                        </div>

                        {pickerFor === p.id && (
                          <div className="mt-2 ml-6 rounded-lg border border-rule bg-paper p-3">
                            {GROUP_LABEL_ORDER.filter((g) => rosterByGroup[g]?.length).map((g) => (
                              <div key={g} className="mb-2 last:mb-0">
                                <div className="eyebrow mb-1">{GROUP_LABEL[g]}</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {rosterByGroup[g].map((r) => {
                                    const on = p.staffIds.includes(r.id);
                                    return (
                                      <button key={r.id} onClick={() => toggleStaffOnProc(p, r.id)} className={clsx("rounded-full px-2 py-0.5 text-[11px] font-medium", on ? "bg-ink-900 text-paper" : "border border-rule bg-surface text-ink-700 hover:border-ink-300")}>
                                        {r.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* add process */}
                  <div className="px-5 py-3">
                    {addProcFor === stage.id ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus value={newProcLabel} onChange={(e) => setNewProcLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addProc(stage.id)} placeholder="New process name…" className="flex-1 rounded-lg border border-rule bg-paper px-2 py-1 text-[13px]" />
                        <button onClick={() => addProc(stage.id)} className="rounded-lg bg-ink-900 px-3 py-1 text-[12px] font-semibold text-paper">Add</button>
                        <button onClick={() => { setAddProcFor(null); setNewProcLabel(""); }} className="text-[12px] text-ink-300">cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddProcFor(stage.id)} className="text-[12px] font-semibold text-accent-dark hover:underline">+ Add a process to {stage.label}</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-ink-300">
        Everything here is a strawman to correct in the room. Each person's time splits across the processes they're on, weighted by "time", so the map reconciles to your roster — no hour estimates. Autosaves on this device; Reset restores the seed. "Run the model" saves this as a <b>Workshop</b> scenario next to the presets on the Scenarios screen.
      </p>
    </div>
  );
}
