import { describe, expect, it } from "vitest";
import { baseline, rates } from "./baseline";
import { stages } from "./processes";
import {
  deriveZeroFteByStage,
  effectiveResidual,
  fteZeroForStage,
  isDemoted,
  netRevenue,
  runModel,
  runModelBanded,
  totalTodayFte,
  totalZeroFte,
  type ScenarioParams,
} from "./engine";
import { makePresets, defaultParams } from "./presets";

// ---- baseline reconciliation ----------------------------------------------

describe("baseline reconciliation", () => {
  it("trad + digital net sum to verified GP (reconciled split)", () => {
    expect(baseline.tradNet.value + baseline.digitalNet.value).toBeCloseTo(
      baseline.gp.value,
      -1,
    );
  });

  it("today P&L reconciles to ~$1.41m within verified tolerance", () => {
    const profit =
      baseline.gp.value -
      baseline.peopleCost.value -
      baseline.tooling.value -
      baseline.otherOpex.value;
    expect(profit).toBeGreaterThan(1_390_000);
    expect(profit).toBeLessThan(1_440_000);
  });

  it("process hours sum to ~19 FTE today by construction", () => {
    const totalHours = stages.reduce(
      (s, st) => s + st.processes.reduce((a, p) => a + p.hoursPerMonth, 0),
      0,
    );
    expect(totalHours / rates.productiveHoursPerMonth).toBeCloseTo(19, 0);
    expect(totalTodayFte()).toBeCloseTo(19, 5);
  });
});

// ---- derived FTE -----------------------------------------------------------

describe("derived zero FTE", () => {
  it("total zero FTE lands in the defensible 6.5–9.0 range", () => {
    const z = totalZeroFte("base");
    expect(z).toBeGreaterThan(6.5);
    expect(z).toBeLessThan(9.0);
  });

  it("conservative pushes the org larger than optimistic", () => {
    expect(totalZeroFte("conservative")).toBeGreaterThan(totalZeroFte("optimistic"));
  });

  it("every stage's zero FTE is below its today FTE", () => {
    for (const st of stages) {
      expect(fteZeroForStage(st, "base")).toBeLessThan(st.fteToday.value + 1e-9);
    }
  });
});

// ---- demotion rule ---------------------------------------------------------

describe("demotion rule", () => {
  it("all shipped L3 processes carry an escalation path (none demoted)", () => {
    for (const st of stages) {
      for (const p of st.processes) {
        if (p.automationLevel === "L3" || p.automationLevel === "L4") {
          expect(p.escalation, `${p.id} claims ${p.automationLevel} without escalation`).not.toBeNull();
        }
      }
    }
  });

  it("stripping the escalation from an L3 process raises its residual to the L2 floor", () => {
    const p = { ...stages[0].processes[0], automationLevel: "L3" as const, escalation: null, residualHoursPerMonth: 1 };
    expect(isDemoted(p)).toBe(true);
    // 1h claimed, but 15% of 25h = 3.75h floor
    expect(effectiveResidual(p, "base")).toBeCloseTo(p.hoursPerMonth * 0.15, 5);
  });
});

// ---- revenue ---------------------------------------------------------------

describe("netRevenue", () => {
  const p0 = { ...defaultParams(), horizonYear: 0 };
  it("at t=0 equals trad + digital net (≈ GP)", () => {
    expect(netRevenue(p0)).toBeCloseTo(baseline.gp.value, -1);
  });
  it("fee compression erodes the digital line over time", () => {
    const p3 = { ...p0, horizonYear: 3, feeCompression: 0.1, revenueGrowth: 0 };
    expect(netRevenue(p3)).toBeLessThan(netRevenue(p0));
  });
});

// ---- P&L reconciliation through the engine --------------------------------

describe("engine P&L", () => {
  it("status-quo at t=0 reproduces today's profit (~$1.43m)", () => {
    const sq = makePresets("base", 0).find((p) => p.key === "status-quo")!.params;
    const out = runModel(sq);
    expect(out.profit).toBeGreaterThan(1_390_000);
    expect(out.profit).toBeLessThan(1_470_000);
    expect(out.totalFte).toBeCloseTo(19, 1);
  });

  it("status-quo drifts toward/below the $1m floor by year 3", () => {
    const sq = makePresets("base", 3).find((p) => p.key === "status-quo")!.params;
    const out = runModel(sq);
    expect(out.profit).toBeLessThan(1_150_000);
  });

  it("agency-zero at full ramp lifts profit toward ~$2m (well above today's $1.43m)", () => {
    const az = makePresets("base", 3).find((p) => p.key === "agency-zero")!.params;
    const out = runModel(az);
    expect(out.profit).toBeGreaterThan(1_900_000);
    expect(out.profitPerHead).toBeGreaterThan(200_000);
    expect(out.payrollRatio).toBeLessThan(0.4);
  });
});

// ---- THE ACCEPTANCE TEST ---------------------------------------------------

describe("ACCEPTANCE: Conservative-Zero beats Base-Status-Quo", () => {
  it("agency-zero under full Conservative settings still exceeds status-quo under Base", () => {
    const zeroConservative = runModel(
      makePresets("conservative", 3).find((p) => p.key === "agency-zero")!.params,
    );
    const statusQuoBase = runModel(
      makePresets("base", 3).find((p) => p.key === "status-quo")!.params,
    );
    expect(zeroConservative.profit).toBeGreaterThan(statusQuoBase.profit);
  });

  it("even the LOW band of Conservative-Zero clears Base-Status-Quo point profit", () => {
    const zeroConservativeLow = runModelBanded(
      makePresets("conservative", 3).find((p) => p.key === "agency-zero")!.params,
    ).low;
    const statusQuoBase = runModel(
      makePresets("base", 3).find((p) => p.key === "status-quo")!.params,
    );
    expect(zeroConservativeLow.profit).toBeGreaterThan(statusQuoBase.profit);
  });
});

// ---- bands -----------------------------------------------------------------

describe("sensitivity band", () => {
  it("orders low < base < high on profit", () => {
    const b = runModelBanded(defaultParams());
    expect(b.low.profit).toBeLessThan(b.base.profit);
    expect(b.base.profit).toBeLessThan(b.high.profit);
  });
});
