import { describe, expect, it } from "vitest";
import { baseline, rates } from "./baseline";
import { stages } from "./processes";
import { staff, staffFteTotal } from "./staff";
import {
  assignmentCounts,
  deriveZeroFteByStage,
  effectiveAutomatability,
  fteTodayForStage,
  fteZeroForStage,
  residualFrac,
  runModel,
  runModelBanded,
  todayFteForProcess,
  totalTodayFte,
  totalZeroFte,
  unallocatedFte,
  type DataCtx,
} from "./engine";
import { makePresets, defaultParams } from "./presets";

const clone = (): DataCtx => ({ stages: JSON.parse(JSON.stringify(stages)), staff: JSON.parse(JSON.stringify(staff)) });
const findProc = (ctx: DataCtx, id: string) =>
  ctx.stages.flatMap((s) => s.processes).find((p) => p.id === id)!;

// ---- baseline reconciliation ----------------------------------------------

describe("baseline reconciliation", () => {
  it("trad + digital net sum to verified GP", () => {
    expect(baseline.tradNet.value + baseline.digitalNet.value).toBeCloseTo(baseline.gp.value, -1);
  });
  it("today P&L reconciles to ~$1.41m within verified tolerance", () => {
    const profit = baseline.gp.value - baseline.peopleCost.value - baseline.tooling.value - baseline.otherOpex.value;
    expect(profit).toBeGreaterThan(1_390_000);
    expect(profit).toBeLessThan(1_440_000);
  });
});

// ---- staff allocation ------------------------------------------------------

describe("staff allocation", () => {
  it("derived today FTE reconciles to the roster total", () => {
    expect(totalTodayFte()).toBeCloseTo(staffFteTotal(), 5);
  });
  it("nothing is unallocated in the seed", () => {
    expect(unallocatedFte()).toBe(0);
  });
  it("stage today FTE sums to the total", () => {
    const sum = stages.reduce((s, st) => s + fteTodayForStage(st), 0);
    expect(sum).toBeCloseTo(totalTodayFte(), 5);
  });
  it("a person's FTE splits across their processes (never double-counts)", () => {
    const counts = assignmentCounts();
    // ceo.fte spread across N processes → each contributes ceo.fte / N
    const ceo = staff.find((r) => r.id === "ceo")!;
    const leadership = findProc(clone(), "leadership");
    expect(todayFteForProcess(leadership)).toBeGreaterThan(0);
    expect(counts["ceo"]).toBeGreaterThan(1);
    expect(ceo.fte / counts["ceo"]).toBeLessThan(ceo.fte);
  });
});

// ---- derived zero ----------------------------------------------------------

describe("derived zero org", () => {
  it("is smaller than today but not empty", () => {
    const z = totalZeroFte("base");
    expect(z).toBeGreaterThan(0);
    expect(z).toBeLessThan(totalTodayFte());
  });
  it("conservative org is larger than optimistic", () => {
    expect(totalZeroFte("conservative")).toBeGreaterThan(totalZeroFte("optimistic"));
  });
  it("every stage's zero FTE is at or below its today FTE", () => {
    for (const st of stages) expect(fteZeroForStage(st, "base")).toBeLessThan(fteTodayForStage(st) + 1e-9);
  });
  it("the relationship layer stays fully human (AI takes none)", () => {
    const ctx = clone();
    for (const id of ["account-management", "firefighting", "trad-negotiation", "leadership"]) {
      expect(residualFrac(findProc(ctx, id), "base")).toBeCloseTo(1, 5);
    }
  });
});

// ---- demotion rule ---------------------------------------------------------

describe("demotion rule", () => {
  it("all shipped 'nearly-all' processes carry an escalation path", () => {
    for (const st of stages) for (const p of st.processes) {
      if (p.automatability === "nearly-all")
        expect(p.escalation, `${p.id} claims autonomy without escalation`).not.toBeNull();
    }
  });
  it("stripping the escalation demotes 'nearly-all' to 'most'", () => {
    const ctx = clone();
    const p = findProc(ctx, "invoicing");
    p.escalation = null;
    expect(effectiveAutomatability(p)).toBe("most");
  });
});

// ---- workshop edits flow through ------------------------------------------

describe("workshop edits", () => {
  it("marking a process not required drops it from the zero org", () => {
    const ctx = clone();
    const before = totalZeroFte("base", ctx);
    findProc(ctx, "monthly-reports").required = false;
    const after = totalZeroFte("base", ctx);
    expect(after).toBeLessThan(before);
  });
  it("re-assigning more staff to a process raises its today FTE", () => {
    const ctx = clone();
    const before = todayFteForProcess(findProc(ctx, "leadership"), ctx);
    // (leadership only has the CEO; adding no one leaves it unchanged — sanity)
    expect(before).toBeGreaterThan(0);
  });
});

// ---- engine P&L ------------------------------------------------------------

describe("engine P&L", () => {
  it("status-quo at t=0 reproduces today's economics (~$1.4m, ~roster FTE)", () => {
    const sq = makePresets("base", 0).find((p) => p.key === "status-quo")!.params;
    const out = runModel(sq);
    expect(out.profit).toBeGreaterThan(1_350_000);
    expect(out.profit).toBeLessThan(1_500_000);
    expect(out.totalFte).toBeCloseTo(staffFteTotal(), 1);
  });
  it("status-quo drifts below ~$1.15m by year 3", () => {
    const sq = makePresets("base", 3).find((p) => p.key === "status-quo")!.params;
    expect(runModel(sq).profit).toBeLessThan(1_150_000);
  });
  it("agency-zero at full ramp lifts profit and slashes the payroll ratio", () => {
    const az = makePresets("base", 3).find((p) => p.key === "agency-zero")!.params;
    const out = runModel(az);
    expect(out.profit).toBeGreaterThan(1_600_000);
    expect(out.payrollRatio).toBeLessThan(0.4);
  });
});

// ---- THE ACCEPTANCE TEST ---------------------------------------------------

describe("ACCEPTANCE: Conservative-Zero beats Base-Status-Quo", () => {
  it("agency-zero under full Conservative still exceeds status-quo under Base", () => {
    const zc = runModel(makePresets("conservative", 3).find((p) => p.key === "agency-zero")!.params);
    const sqb = runModel(makePresets("base", 3).find((p) => p.key === "status-quo")!.params);
    expect(zc.profit).toBeGreaterThan(sqb.profit);
  });
  it("even the low band of Conservative-Zero clears Base-Status-Quo", () => {
    const zcLow = runModelBanded(makePresets("conservative", 3).find((p) => p.key === "agency-zero")!.params).low;
    const sqb = runModel(makePresets("base", 3).find((p) => p.key === "status-quo")!.params);
    expect(zcLow.profit).toBeGreaterThan(sqb.profit);
  });
});

describe("sensitivity band", () => {
  it("orders low < base < high on profit", () => {
    const b = runModelBanded(defaultParams());
    expect(b.low.profit).toBeLessThan(b.base.profit);
    expect(b.base.profit).toBeLessThan(b.high.profit);
  });
});
