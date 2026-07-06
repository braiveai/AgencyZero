import { baseline } from "@/lib/model/baseline";
import { fmtMoney, fmtMoneyShort, fmtPct } from "@/lib/format";
import { PageHead, StatCard } from "@/components/ui";
import { MonthlyProfitChart, RevenueMixDonut, PayrollGauge } from "@/components/charts";

export default function Today() {
  const b = baseline;
  const revPerHead = b.gp.value / b.fte.value;
  const profitPerHead = b.netProfit.value / b.fte.value;
  const payrollRatio = b.peopleCost.value / b.gp.value;
  const nearBreakeven = b.monthlyProfit.filter((m) => m < 50_000).length;

  return (
    <div>
      <PageHead
        eyebrow="S1 · Today, honestly"
        title="The FY26 baseline"
        lead="Verified starting point from the Xero export, reconciled against the sunnyrev retainer book. We are healthy — which is exactly why now is the time to rebuild from strength, not distress."
      />

      {/* headline stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Gross profit (real revenue)" value={fmtMoneyShort(b.gp.value)} sub={fmtMoney(b.gp.value)} confidence={b.gp.confidence} tone="accent" />
        <StatCard label="Net profit (pre-tax)" value={fmtMoneyShort(b.netProfit.value)} sub={fmtMoney(b.netProfit.value)} confidence={b.netProfit.confidence} tone="positive" />
        <StatCard label="Headcount (FTE)" value={`~${b.fte.value}`} sub="incl. CEO, excl. partners" confidence={b.fte.confidence} />
        <StatCard label="People cost" value={fmtMoneyShort(b.peopleCost.value)} sub={`${fmtPct(payrollRatio)} of GP`} confidence={b.peopleCost.confidence} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="GP per head" value={fmtMoneyShort(revPerHead)} confidence="estimated" />
        <StatCard label="Profit per head" value={fmtMoneyShort(profitPerHead)} confidence="estimated" />
        <StatCard label="Total operating expense" value={fmtMoneyShort(b.otherOpex.value + b.peopleCost.value + b.tooling.value)} sub="people + tooling + other" confidence="verified" />
        <StatCard label="Software & subscriptions" value={fmtMoneyShort(b.tooling.value)} sub="redirected + expanded at Zero" confidence={b.tooling.confidence} />
      </div>

      {/* charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <div className="eyebrow">Monthly net profit — FY26</div>
            <div className="text-[12px] font-semibold text-negative">
              {nearBreakeven} near-breakeven months
            </div>
          </div>
          <p className="mb-3 mt-1 text-[13px] text-ink-500">
            Jul {fmtMoneyShort(b.monthlyProfit[0])} and Apr {fmtMoneyShort(b.monthlyProfit[9])} versus Jun {fmtMoneyShort(b.monthlyProfit[11])}. The profit engine is more fragile than the topline suggests — traditional margin is lumpy but thick; digital fees are the stable line AI compresses first.
          </p>
          <MonthlyProfitChart data={b.monthlyProfit} />
        </div>

        <div className="card p-5">
          <div className="eyebrow">Revenue mix — net basis</div>
          <p className="mb-1 mt-1 text-[13px] text-ink-500">
            The 50/50 split nobody realises.
          </p>
          <RevenueMixDonut trad={b.tradNet.value} digital={b.digitalNet.value} />
          <div className="mt-1 flex justify-center gap-4 text-[12px]">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ink-900" /> Trad {fmtPct(b.tradNet.value / b.gp.value)}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Digital {fmtPct(b.digitalNet.value / b.gp.value)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="eyebrow">Payroll ratio</div>
          <PayrollGauge ratio={payrollRatio} />
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="eyebrow">Client concentration — FY26 (gross-billings basis)</div>
          <p className="mb-4 mt-1 text-[13px] text-ink-500">
            Mined from the sunnyrev book ({b.concentration.clients} billing clients). The top of the book is all traditional — which confirms the thesis: trad margin is lumpy but defensible, the moat is the relationship.
          </p>
          <div className="space-y-3">
            {[
              { label: "Top 3 clients", v: b.concentration.top3 },
              { label: "Top 5 clients", v: b.concentration.top5 },
              { label: "Top 10 clients", v: b.concentration.top10 },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span className="text-ink-500">{r.label}</span>
                  <span className="tnum font-semibold text-ink-900">{fmtPct(r.v)} of billings</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-rule">
                  <div className="h-full rounded-full bg-flag" style={{ width: `${r.v * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-ink-300">
        <span className="font-semibold">Reconciliation:</span> GP and total opex are the verified anchors. The raw trad/digital net split ($4.575m) was reconciled proportionally to verified GP ($4.473m) — a −2.2% haircut inside the ±10% band. Digital net ($2.168m) independently agrees with the sunnyrev retainer book ($2.19m). Engine profit computes to $1.413m; the Xero net-profit line reads $1.435m — a ~1.5% categorisation gap, flagged not hidden.
      </p>
    </div>
  );
}
