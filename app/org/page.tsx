"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { staff, partners } from "@/lib/model/staff";
import { stages } from "@/lib/model/processes";
import { roleAbsorption, totalTodayFte, totalZeroFte, type Conservatism, type DataCtx } from "@/lib/model/engine";
import { useAssumptions } from "@/lib/model/assumptions";
import { fmtNum, fmtPct } from "@/lib/format";
import { PageHead, Toggle } from "@/components/ui";

// The real org, by division/pod — explicit so it reads like the chart.
const SECTIONS: { title: string; sub?: string; members: string[] }[] = [
  { title: "Leadership", members: ["ceo"] },
  { title: "Sales", members: ["strat-hybrid", "strat-tba", "sales-internal"] },
  { title: "Digital delivery — Pod 1", members: ["dig-ad-1", "dig-spec-3", "dig-spec-4", "dig-spec-6", "strat-pt"] },
  { title: "Digital delivery — Pod 2", members: ["dig-ad-2", "dig-spec-1", "dig-spec-2", "dig-spec-5"] },
  { title: "Traditional delivery", members: ["trad-ad", "trad-am", "trad-coord-1", "trad-coord-2"] },
  { title: "Finance", members: ["cfo", "accounts"] },
  { title: "Support", members: ["ea"] },
];

function AidMeter({ aid }: { aid: number }) {
  const pct = Math.round(aid * 100);
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px]">
        <span className="font-semibold text-accent-dark">{pct}% to AI</span>
        <span className="text-ink-300">{100 - pct}% human</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-rule">
        <div className="h-full rounded-full bg-accent-dark" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function OrgChart() {
  const a = useAssumptions();
  const [con, setCon] = useState<Conservatism>("base");
  const [showNames, setShowNames] = useState(false);
  const ctx = useMemo<DataCtx>(() => ({ stages, staff, assumptions: a }), [a]);

  const byId = useMemo(() => Object.fromEntries(staff.map((r) => [r.id, r])), []);
  const abs = useMemo(() => Object.fromEntries(staff.map((r) => [r.id, roleAbsorption(r.id, con, ctx)])), [con, ctx]);

  const today = totalTodayFte(ctx);
  const zero = totalZeroFte(con, ctx);
  const avgAid = staff.reduce((s, r) => s + (abs[r.id]?.aidFrac ?? 0) * r.fte, 0) / (today || 1);

  return (
    <div>
      <PageHead
        eyebrow="Deep-dive · Org chart"
        title="The org today — and how much AI takes"
        lead="Every role, with the share of its work AI absorbs in the rebuilt agency. The gold is what the machine takes; what's left is what we'd hire that person to do. Moves with the assumptions — flip the dial and watch it shift."
      />

      <div className="sticky top-14 z-20 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rule bg-paper/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
          <span>Today <b className="tnum text-ink-900">{fmtNum(today)}</b> FTE</span>
          <span>→ Zero <b className="tnum text-accent-dark">{fmtNum(zero)}</b> FTE</span>
          <span className="text-ink-300">avg role <b className="text-accent-dark">{fmtPct(avgAid)}</b> automated</span>
        </div>
        <div className="flex items-center gap-3">
          <Toggle value={con} onChange={(v) => setCon(v as Conservatism)} options={[{ value: "optimistic", label: "Optimistic" }, { value: "base", label: "Base" }, { value: "conservative", label: "Conservative" }]} />
          <button onClick={() => setShowNames((s) => !s)} className={clsx("rounded-lg border px-3 py-1.5 text-[12px] font-semibold", showNames ? "border-ink-900 bg-ink-900 text-paper" : "border-rule text-ink-500 hover:text-ink-900")}>
            {showNames ? "Names on" : "Show names"}
          </button>
        </div>
      </div>

      {/* CEO */}
      {(() => {
        const r = byId["ceo"];
        const ab = abs["ceo"];
        return (
          <div className="mb-4 flex justify-center">
            <div className="w-[240px] rounded-2xl border-2 border-ink-900 bg-surface p-4 text-center">
              <div className="text-[14px] font-bold text-ink-900">{showNames && r.name ? r.name : r.title}</div>
              {showNames && r.name && <div className="text-[11px] text-ink-300">{r.title}</div>}
              <div className="mt-2"><AidMeter aid={ab.aidFrac} /></div>
              <div className="mt-1 text-[10px] text-ink-300">the non-negotiable human layer</div>
            </div>
          </div>
        );
      })()}

      {/* divisions */}
      <div className="grid gap-3 lg:grid-cols-2">
        {SECTIONS.filter((s) => s.title !== "Leadership").map((sec) => (
          <div key={sec.title} className="card p-4">
            <div className="eyebrow mb-3">{sec.title}</div>
            <div className="flex flex-wrap gap-2">
              {sec.members.map((id, i) => {
                const r = byId[id];
                const ab = abs[id];
                if (!r) return null;
                return (
                  <div key={id} className={clsx("w-[190px] rounded-xl border bg-surface p-3", i === 0 ? "border-ink-300" : "border-rule")}>
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="text-[13px] font-semibold leading-tight text-ink-900">{showNames && r.name ? r.name : r.title}</div>
                        {showNames && r.name && <div className="text-[10px] leading-tight text-ink-300">{r.title}</div>}
                      </div>
                      {i === 0 && <span className="shrink-0 rounded bg-ink-900/6 px-1 text-[9px] font-bold uppercase text-ink-400">lead</span>}
                    </div>
                    <div className="mt-2.5"><AidMeter aid={ab.aidFrac} /></div>
                    <div className="mt-1 text-[10px] text-ink-300">{fmtNum(ab.residual)} of {fmtNum(ab.today)} FTE stays human</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* partners — outside the model */}
      <div className="mt-3 card p-4">
        <div className="eyebrow mb-3">Partners &amp; shareholders <span className="font-normal text-ink-300">— on the chart, outside the model (excl. partners)</span></div>
        <div className="flex flex-wrap gap-2">
          {partners.map((p) => (
            <div key={p.name} className="w-[190px] rounded-xl border border-dashed border-rule bg-rule_soft/40 p-3 opacity-80">
              <div className="text-[13px] font-semibold text-ink-700">{showNames ? p.name : p.title}</div>
              {showNames && <div className="text-[10px] text-ink-300">{p.title}</div>}
              <div className="mt-2 text-[10px] italic text-ink-300">not automatable — ownership &amp; governance</div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 text-[12px] leading-relaxed text-ink-300">
        "% to AI" is how much of that role's work the machine absorbs — derived from the processes they do and how automatable each is, so it moves with the Confirm assumptions and the dial above. It is not a person's performance or a firing list; it's where the work goes. Names are off by default and stored only on this device. Edit who does what in the Workshop and it redraws here.
      </p>
    </div>
  );
}
