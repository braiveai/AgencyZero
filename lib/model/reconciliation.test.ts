import { describe, it, expect } from "vitest";
import { stages } from "./processes";
import { staff } from "./staff";
import {
  totalTodayFte,
  totalZeroFte,
  todayFteForProcess,
  zeroFteForProcess,
  roleAbsorption,
  type Conservatism,
  type DataCtx,
} from "./engine";

// The report + Org + Start screens each derive "absorbable FTE" a different way.
// They MUST agree, or one of the screens is silently wrong. This locks that in.
const ctx: DataCtx = { stages, staff };

const cons: Conservatism[] = ["optimistic", "base", "conservative"];

describe("FTE reconciles three independent ways", () => {
  for (const con of cons) {
    it(`process view and role view both equal (today − zero) — ${con}`, () => {
      const today = totalTodayFte(ctx);
      const zero = totalZeroFte(con, ctx);
      const freed = today - zero;

      const byProcess = stages
        .flatMap((s) => s.processes)
        .filter((p) => p.required)
        .reduce((sum, p) => sum + (todayFteForProcess(p, ctx) - zeroFteForProcess(p, con, ctx)), 0);

      const byRole = staff.reduce((sum, r) => {
        const ab = roleAbsorption(r.id, con, ctx);
        return sum + (ab.today - ab.residual);
      }, 0);

      expect(byProcess).toBeCloseTo(freed, 6);
      expect(byRole).toBeCloseTo(freed, 6);
      expect(freed).toBeGreaterThan(0);
      expect(zero).toBeGreaterThan(0);
      expect(zero).toBeLessThanOrEqual(today + 1e-9);
    });
  }

  it("today FTE equals the sum of every role's assigned FTE", () => {
    const today = totalTodayFte(ctx);
    const byRole = staff.reduce((s, r) => s + roleAbsorption(r.id, "base", ctx).today, 0);
    expect(byRole).toBeCloseTo(today, 6);
  });

  it("conservative frees no more than optimistic (dial direction is correct)", () => {
    const opt = totalTodayFte(ctx) - totalZeroFte("optimistic", ctx);
    const consv = totalTodayFte(ctx) - totalZeroFte("conservative", ctx);
    expect(consv).toBeLessThanOrEqual(opt + 1e-9);
  });
});
