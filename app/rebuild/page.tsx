"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { stages } from "@/lib/model/processes";
import { fteZeroForStage } from "@/lib/model/engine";
import type { Process, Stage } from "@/lib/model/types";
import { fmtNum } from "@/lib/format";
import { PageHead } from "@/components/ui";

// Hand-authored trigger / outcome per stage — the human bookends of each flow.
const FRAME: Record<string, { trigger: string; outcome: string }> = {
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

function Node({ p, i }: { p: Process; i: number }) {
  const human = isHuman(p);
  return (
    <div
      className={clsx(
        "relative w-[210px] shrink-0 rounded-2xl border p-4",
        human ? "border-accent/50 bg-accent-wash" : "border-rule bg-surface",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            human ? "bg-accent-dark/15 text-accent-dark" : "bg-ink-900/6 text-ink-500",
          )}
        >
          {human ? "Human" : "AI"}
        </span>
        <span className="tnum text-[11px] text-ink-200">{String(i + 1).padStart(2, "0")}</span>
      </div>
      <div className="mt-2 text-[14px] font-semibold leading-snug text-ink-900">{p.label}</div>
      <div className="mt-1 text-[12px] leading-snug text-ink-500">{p.description}</div>
      {p.escalation && (
        <div className="mt-2 rounded-lg bg-flag/10 px-2 py-1 text-[11px] leading-snug text-flag">
          ⚠ exception → {p.escalation.owner} · {p.escalation.slaHours}h
        </div>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex shrink-0 items-center px-1 text-ink-200" aria-hidden>
      <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
        <path d="M0 6h19m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function Rebuild() {
  const [stageId, setStageId] = useState("prove");
  const stage = stages.find((s) => s.id === stageId) as Stage;
  const frame = FRAME[stageId];

  // Machine does the grunt first, human owns the moments — order AI → human.
  const nodes = useMemo(() => {
    const req = stage.processes.filter((p) => p.required);
    const rank = (p: Process) => (isHuman(p) ? 1 : 0);
    return [...req].sort((a, b) => rank(a) - rank(b));
  }, [stage]);

  const humanCount = nodes.filter(isHuman).length;
  const zero = fteZeroForStage(stage, "base");

  return (
    <div>
      <PageHead
        eyebrow="The rebuild · dream state"
        title="What the work looks like, rebuilt around AI"
        lead="The destination to work back from. The machine takes the grunt; the human keeps the relationship and the judgement. What stays human is exactly what we'd hire for."
      />

      {/* stage switcher */}
      <div className="mb-8 flex flex-wrap gap-1.5">
        {stages.map((s) => (
          <button
            key={s.id}
            onClick={() => setStageId(s.id)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              s.id === stageId ? "bg-ink-900 text-paper" : "text-ink-500 hover:bg-rule_soft hover:text-ink-900",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* the flow */}
      <div className="rounded-3xl border border-rule bg-paper p-8">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="eyebrow">Stage {stage.order}</span>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">{stage.label}</h2>
        </div>

        {/* trigger */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-rule bg-surface px-4 py-2 text-[13px] text-ink-500">
          <span className="h-2 w-2 rounded-full bg-ink-300" />
          {frame.trigger}
        </div>

        {/* nodes — single-line flow, scrolls on narrow screens */}
        <div className="-mx-2 overflow-x-auto px-2 pb-2">
          <div className="flex w-max items-stretch">
            {nodes.map((p, i) => (
              <div key={p.id} className="flex items-stretch">
                <Node p={p} i={i} />
                {i < nodes.length - 1 && <Arrow />}
              </div>
            ))}
          </div>
        </div>

        {/* outcome */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-accent-wash px-5 py-4">
          <span className="mt-0.5 text-accent-dark">→</span>
          <p className="text-[15px] font-medium leading-snug text-ink-900">{frame.outcome}</p>
        </div>
      </div>

      {/* the tie-back to the number */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rule bg-surface px-6 py-4">
        <p className="text-[14px] text-ink-700">
          <b className="text-accent-dark">{humanCount}</b> human {humanCount === 1 ? "moment" : "moments"} in this stage — the machine takes the rest.
        </p>
        <p className="text-[13px] text-ink-500">
          That's the <b className="text-ink-900">{fmtNum(zero)} FTE</b> we'd keep here.{" "}
          <span className="text-ink-300">The picture and the number are the same thing.</span>
        </p>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-ink-300">
        Gold = human. What stays human is the relationship and the judgement — the phone, the room, the exception. Edit any of this in the Value Chain workshop and it flows through here and into the model.
      </p>
    </div>
  );
}
