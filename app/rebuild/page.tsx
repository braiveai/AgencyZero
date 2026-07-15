"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { fteZeroForStage, totalZeroFte } from "@/lib/model/engine";
import { useWorkshopCtx } from "@/lib/model/useWorkshopCtx";
import type { Process, Stage } from "@/lib/model/types";
import { fmtNum } from "@/lib/format";
import { PageHead } from "@/components/ui";

const FRAME: Record<string, { trigger: string; outcome: string }> = {
  brand: { trigger: "Before any lead exists", outcome: "Sunny's own brand, content and partnerships compound in the background — mostly machine-made, senior-curated." },
  win: { trigger: "A lead comes in", outcome: "We out-blueprint the field at pitch — without burning senior hours." },
  plan: { trigger: "The brief is understood", outcome: "A senior strategist ships a plan they'd stake their name on — in a fraction of the hours." },
  onboard: { trigger: "The client says yes", outcome: "Live in days, seeded straight from the winning blueprint." },
  "make-buy": { trigger: "The plan is signed off", outcome: "Built and bought — the buyer spends their time on the deal, not the admin." },
  optimise: { trigger: "Campaigns are live", outcome: "Systems watch the accounts; seniors watch the systems." },
  prove: { trigger: "The month closes", outcome: "The client trusts the numbers; senior time goes to the relationship, not the spreadsheet." },
  collect: { trigger: "Media runs", outcome: "Money in, reconciled automatically; finance handles only the exceptions." },
  spine: { trigger: "The business runs", outcome: "A lean, senior team held together by leadership and light-touch systems." },
};

const isHuman = (p: Process) => p.automatability === "none" || p.automatability === "some";
const humanProcs = (s: Stage) => s.processes.filter((p) => p.required && isHuman(p));
const aiProcs = (s: Stage) => s.processes.filter((p) => p.required && !isHuman(p));

export default function Rebuild() {
  const ctx = useWorkshopCtx();
  const stages = ctx.stages;
  const [stageId, setStageId] = useState("prove");
  const stage = (stages.find((s) => s.id === stageId) ?? stages[0]) as Stage;
  const frame = FRAME[stage?.id] ?? FRAME.prove;

  const totals = useMemo(() => {
    const human = stages.reduce((n, s) => n + humanProcs(s).length, 0);
    return { human, fte: totalZeroFte("base", ctx) };
  }, [ctx]);

  return (
    <div>
      <PageHead
        eyebrow="Step 3 · The rebuild — dream state"
        title="Sunny, rebuilt — on one page"
        lead="The destination to work back from. AI systems run the spine, continuously, across every stage. Humans hold a handful of moments — the relationship and the judgement. What stays gold is exactly what we'd hire for."
      />

      {/* ── the operating model on a page ── */}
      <div className="rounded-3xl border border-rule bg-paper p-6">
        {/* machine spine */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-ink-900 px-5 py-3 text-paper">
          <span className="text-[13px] font-bold uppercase tracking-[0.16em]">AI systems</span>
          <span className="text-[13px] text-paper/70">run continuously across every stage — draft, build, monitor, produce, reconcile</span>
        </div>

        {/* stages */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {stages.map((s) => {
            const humans = humanProcs(s);
            const zero = fteZeroForStage(s, "base", ctx);
            return (
              <button
                key={s.id}
                onClick={() => setStageId(s.id)}
                className={clsx(
                  "flex flex-col rounded-xl border bg-surface p-2.5 text-left transition-colors hover:border-ink-300",
                  s.id === stageId ? "border-ink-900" : "border-rule",
                )}
              >
                <div className="text-[10px] font-semibold text-ink-300">{s.order}</div>
                <div className="text-[12px] font-bold leading-tight text-ink-900">{s.label}</div>
                <div className="mt-2 flex flex-1 flex-col gap-1">
                  {humans.length === 0 ? (
                    <span className="rounded-md bg-ink-900/5 px-1.5 py-1 text-[10px] font-semibold text-ink-300">Fully automated</span>
                  ) : (
                    humans.map((p) => (
                      <span key={p.id} className="rounded-md bg-accent-wash px-1.5 py-1 text-[10px] font-semibold leading-tight text-accent-dark">
                        {p.label}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-2 border-t border-rule pt-1 text-[10px] text-ink-300">
                  <b className="tnum text-ink-700">{fmtNum(zero)}</b> FTE
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-500">
          <span><b className="text-accent-dark">{totals.human} human moments</b> — the gold — on an AI spine.</span>
          <span>~<b className="tnum text-ink-900">{fmtNum(totals.fte)} senior FTE</b> of judgement. Everything else: the machine.</span>
        </div>
      </div>

      {/* ── look inside a stage ── */}
      <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-ink-900">Look inside a stage</h2>
        <div className="flex flex-wrap gap-1">
          {stages.map((s) => (
            <button key={s.id} onClick={() => setStageId(s.id)}
              className={clsx("rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors", s.id === stageId ? "bg-ink-900 text-paper" : "text-ink-500 hover:bg-rule_soft hover:text-ink-900")}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-rule bg-paper p-7">
        <div className="mb-1 flex items-baseline gap-3">
          <span className="eyebrow">Stage {stage.order}</span>
          <h3 className="text-2xl font-extrabold tracking-tight text-ink-900">{stage.label}</h3>
        </div>
        <div className="mb-6 inline-flex items-center gap-2 text-[13px] text-ink-500">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-300" />{frame.trigger}
        </div>

        {/* machine lane */}
        <div className="mb-2 eyebrow">The machine does</div>
        <div className="flex flex-wrap gap-2">
          {aiProcs(stage).length === 0 && <span className="text-[13px] italic text-ink-300">— nothing here is automated —</span>}
          {aiProcs(stage).map((p) => (
            <div key={p.id} className="w-[190px] rounded-xl border border-rule bg-surface p-3">
              <div className="text-[13px] font-semibold text-ink-900">{p.label}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-ink-500">{p.description}</div>
              {p.escalation && (
                <div className="mt-1.5 rounded-md bg-flag/10 px-1.5 py-0.5 text-[10px] text-flag">⚠ exception → {p.escalation.owner} · {p.escalation.slaHours}h</div>
              )}
            </div>
          ))}
        </div>

        {/* human lane — the point */}
        <div className="mb-2 mt-6 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-dark">The human owns</span>
          <span className="text-[11px] text-ink-300">— what we'd hire for</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {humanProcs(stage).length === 0 && <span className="text-[13px] italic text-ink-300">— this stage runs itself; humans only see exceptions —</span>}
          {humanProcs(stage).map((p) => (
            <div key={p.id} className="w-[230px] rounded-2xl border-2 border-accent/50 bg-accent-wash p-4">
              <span className="rounded-md bg-accent-dark/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-dark">Human</span>
              <div className="mt-2 text-[15px] font-bold leading-snug text-ink-900">{p.label}</div>
              <div className="mt-1 text-[12px] leading-snug text-ink-700">{p.description}</div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex items-start gap-3 rounded-2xl bg-accent-wash px-5 py-4">
          <span className="mt-0.5 text-accent-dark">→</span>
          <p className="text-[15px] font-medium leading-snug text-ink-900">{frame.outcome}</p>
        </div>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-ink-300">
        Gold = human: the relationship and the judgement — the phone, the room, the exception. The gold moments are exactly the residual FTE in the model. Edit any of it in the Workshop and it flows through here and into the numbers.
      </p>
    </div>
  );
}
