// Display formatting — tabular, terse, executive.

export const fmtMoney = (n: number): string =>
  (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-AU");

/** $2.0m / $950k / $4.47m */
export function fmtMoneyShort(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 999_500) return `${sign}$${(abs / 1_000_000).toFixed(2)}m`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  return `${sign}$${Math.round(abs)}`;
}

export const fmtPct = (n: number, dp = 0): string => `${(n * 100).toFixed(dp)}%`;

export const fmtNum = (n: number, dp = 1): string =>
  n.toLocaleString("en-AU", { minimumFractionDigits: dp, maximumFractionDigits: dp });

/** "$1.80m–$2.24m" from a low/high pair, short form. */
export const fmtRange = (low: number, high: number): string =>
  `${fmtMoneyShort(low)}–${fmtMoneyShort(high)}`;

export const confidenceLabel = {
  verified: "Verified — straight from Xero export",
  estimated: "Estimated — derived / split figure",
  assumed: "Assumed — pending workshop validation",
} as const;
