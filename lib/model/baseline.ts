import { m, type Baseline, type Rates } from "./types";

// FY26 (Jul 2025 – Jun 2026). Source: Xero P&L export, reconciled against sunnyrev.
//
// RECONCILIATION NOTES (surfaced in the app + deck footnote):
// - GP ($4,472,840) and total opex ($3,059,596) are the two verified anchors.
// - The brief's raw trad/digital net split (2.357m / 2.218m = $4.575m) overshoots
//   verified GP by ~$102k. We reconcile it *proportionally to GP* — a −2.2% haircut,
//   comfortably inside the ±10% band we already carry on those (estimated) figures.
//   Reconciled: trad 51.5% / digital 48.5%. Digital net ($2.168m) independently
//   agrees with the sunnyrev retainer book ($2.19m FY26) — a clean cross-check.
// - `otherOpex` here is NON-people, NON-tooling opex (= total opex 3,059,596
//   − people 2,109,700 − tooling 152,763 = 797,133), so the model can flex the
//   tooling line separately without double-counting. Engine profit(0) therefore
//   computes to $1,413,244; the Xero net-profit *line* reads $1,434,907 — a ~1.5%
//   categorisation gap we flag rather than paper over.

export const baseline: Baseline = {
  fy: "FY26",
  gp: m(4_472_840, "verified", 0.05),
  tradNet: m(2_304_447, "estimated", 0.1),
  digitalNet: m(2_168_393, "estimated", 0.1),
  peopleCost: m(2_109_700, "verified", 0.05),
  otherOpex: m(797_133, "verified", 0.05),
  tooling: m(152_763, "verified", 0.05),
  netProfit: m(1_434_907, "verified", 0.05),
  fte: m(19, "estimated", 0.1),
  // Jul → Jun. Note Jul $15k, Apr $17.6k near-breakeven vs Jun $330k, Sep $256k.
  monthlyProfit: [
    15_070, 70_413, 256_028, 152_804, 108_463, 158_009, 73_902, 81_238, 102_175,
    17_583, 68_804, 330_419,
  ],
  // Mined from sunnyrev FY26 retainer + traditional book (gross-billings basis).
  // Top clients are all traditional — confirms the "lumpy but thick, relationship
  // moat" thesis and a real concentration exposure.
  concentration: { top3: 0.389, top5: 0.492, top10: 0.64, clients: 109 },
};

export const rates: Rates = {
  loadedHourlyToday: 69, // ≈ $2.11m ÷ 19 ÷ ~1,600 productive hrs
  loadedHourlyZero: 90, // Zero-state senior blend
  productiveHoursPerMonth: 133,
};
