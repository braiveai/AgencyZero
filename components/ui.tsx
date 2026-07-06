"use client";

import clsx from "clsx";
import type { AutomationLevel, Confidence } from "@/lib/model/types";
import { confidenceLabel } from "@/lib/format";

export function PageHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="mb-6">
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900">
        {title}
      </h1>
      {lead && <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-500">{lead}</p>}
    </div>
  );
}

const dotColor: Record<Confidence, string> = {
  verified: "bg-positive",
  estimated: "bg-flag",
  assumed: "bg-negative",
};

export function ConfidenceDot({ confidence }: { confidence: Confidence }) {
  return (
    <span
      title={confidenceLabel[confidence]}
      className={clsx("inline-block h-1.5 w-1.5 rounded-full align-middle", dotColor[confidence])}
    />
  );
}

export function StatCard({
  label,
  value,
  sub,
  confidence,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  confidence?: Confidence;
  tone?: "default" | "positive" | "negative" | "accent";
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5">
        <div className="eyebrow">{label}</div>
        {confidence && <ConfidenceDot confidence={confidence} />}
      </div>
      <div
        className={clsx(
          "tnum mt-1.5 text-2xl font-bold tracking-tight",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
          tone === "accent" && "text-accent-dark",
          tone === "default" && "text-ink-900",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[12px] text-ink-300">{sub}</div>}
    </div>
  );
}

const ladderTone: Record<AutomationLevel, string> = {
  L0: "bg-ink-200/40 text-ink-700",
  L1: "bg-flag/15 text-flag",
  L2: "bg-accent-dark/12 text-accent-dark",
  L3: "bg-positive/12 text-positive",
  L4: "bg-tier_low/15 text-tier_low",
};

export function LadderBadge({
  level,
  demoted,
}: {
  level: AutomationLevel;
  demoted?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold tnum",
        ladderTone[level],
      )}
      title={demoted ? "Demoted to L2 — no escalation path defined" : undefined}
    >
      {level}
      {demoted && <span className="text-negative">↓</span>}
    </span>
  );
}

export function Toggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-rule bg-paper p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-md px-3 py-1 text-[12px] font-semibold transition-colors",
            value === o.value ? "bg-ink-900 text-paper" : "text-ink-500 hover:text-ink-900",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
