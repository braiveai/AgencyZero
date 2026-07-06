"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Line,
  LineChart,
  Legend,
} from "recharts";
import { fmtMoneyShort } from "@/lib/format";

const INK = "#1A1814";
const AXIS = "#8B8478";
const GOLD = "#FDB600";
const GOLD_DK = "#9A7100";
const POS = "#3E5C3A";
const NEG = "#A33D2E";
const BLUE = "#4977B4";
const RULE = "#E8E2D7";

const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function box(children: React.ReactNode) {
  return (
    <div className="rounded-lg border border-rule bg-surface px-3 py-2 text-[12px] shadow-card">
      {children}
    </div>
  );
}

export function MonthlyProfitChart({ data }: { data: number[] }) {
  const rows = data.map((v, i) => ({ month: MONTHS[i], profit: v }));
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: AXIS }} axisLine={{ stroke: RULE }} tickLine={false} />
        <YAxis tickFormatter={(v) => fmtMoneyShort(v)} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={48} />
        <ReferenceLine y={avg} stroke={AXIS} strokeDasharray="3 3" />
        <Tooltip
          cursor={{ fill: "rgba(26,24,20,0.04)" }}
          content={({ active, payload, label }) =>
            active && payload?.length
              ? box(
                  <>
                    <div className="font-semibold text-ink-900">{label}</div>
                    <div className="tnum text-ink-500">{fmtMoneyShort(payload[0].value as number)} net profit</div>
                  </>,
                )
              : null
          }
        />
        <Bar dataKey="profit" radius={[3, 3, 0, 0]}>
          {rows.map((r, i) => (
            <Cell key={i} fill={r.profit < 50000 ? NEG : r.profit > 200000 ? POS : GOLD} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueMixDonut({ trad, digital }: { trad: number; digital: number }) {
  const rows = [
    { name: "Traditional net", value: trad, fill: INK },
    { name: "Digital net", value: digital, fill: GOLD },
  ];
  const total = trad + digital;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={rows} dataKey="value" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
          {rows.map((r, i) => (
            <Cell key={i} fill={r.fill} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length
              ? box(
                  <>
                    <div className="font-semibold text-ink-900">{payload[0].name}</div>
                    <div className="tnum text-ink-500">
                      {fmtMoneyShort(payload[0].value as number)} ·{" "}
                      {Math.round(((payload[0].value as number) / total) * 100)}%
                    </div>
                  </>,
                )
              : null
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PayrollGauge({ ratio }: { ratio: number }) {
  const pct = Math.min(1, ratio);
  return (
    <div className="flex h-[220px] flex-col justify-center">
      <div className="tnum text-4xl font-bold text-ink-900">{Math.round(ratio * 100)}%</div>
      <div className="mt-1 text-[12px] text-ink-300">of gross profit to payroll</div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-rule">
        <div className="h-full rounded-full bg-ink-900" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-300">
        <span>0%</span>
        <span>Zero-state target ~26%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

/** Generic profit-over-time line chart with a $1m floor reference. */
export function ProfitLines({
  years,
  series,
}: {
  years: number[];
  series: { key: string; label: string; color: string; values: number[] }[];
}) {
  const rows = years.map((y, i) => {
    const r: Record<string, number> = { year: y };
    for (const s of series) r[s.key] = s.values[i];
    return r;
  });
  const colorMap: Record<string, string> = { gold: GOLD_DK, ink: INK, blue: BLUE, pos: POS, neg: NEG };
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <XAxis dataKey="year" tickFormatter={(v) => (v === 0 ? "Now" : `Y${v}`)} tick={{ fontSize: 11, fill: AXIS }} axisLine={{ stroke: RULE }} tickLine={false} />
        <YAxis tickFormatter={(v) => fmtMoneyShort(v)} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={48} />
        <ReferenceLine y={1_000_000} stroke={NEG} strokeDasharray="4 4" label={{ value: "$1m floor", fontSize: 10, fill: NEG, position: "insideTopLeft" }} />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length
              ? box(
                  <>
                    <div className="font-semibold text-ink-900">{label === 0 ? "Now" : `Year ${label}`}</div>
                    {payload.map((p) => (
                      <div key={p.dataKey as string} className="tnum text-ink-500">
                        <span style={{ color: p.color }}>■</span> {series.find((s) => s.key === p.dataKey)?.label}: {fmtMoneyShort(p.value as number)}
                      </div>
                    ))}
                  </>,
                )
              : null
          }
        />
        <Legend formatter={(v) => series.find((s) => s.key === v)?.label ?? v} wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} stroke={colorMap[s.color] ?? INK} strokeWidth={2.25} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
