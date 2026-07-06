# Agency Zero — Operating Model

Confidential internal tool for Sunny Advertising. Interactive operating-model micro
app that accompanies the *Agency Zero* deck: Roger and Sarah manipulate assumptions
live and watch the P&L, org shape and glide path recalculate.

> **The medium is the message:** an AI-built tool arguing for an AI-first agency.

Role labels only — **no client names, no employee names anywhere.**

---

## The thesis in one line

*If Sunny Advertising was founded today — with today's tools, at today's revenue —
who would we hire?* We build the agency forward **from zero** with Sunny's real FY26
numbers; we never subtract from today's org. The subtraction is an *output* of the
gap comparison, never the method.

## What it does

Five screens (brief build order S1 → S3 → S2 → S4 → S5):

| | Screen | Purpose |
|---|---|---|
| **S1** | `/today` | FY26 verified baseline — monthly volatility, revenue mix, payroll ratio, client concentration. Read-only; establishes trust before any speculation. |
| **S3** | `/model` | Scenario builder (the centrepiece). Sliders for growth, fee compression, adoption, loaded cost, tooling, FTE-per-stage, owner comp. Live P&L, org shape, $1m floor, tolerance bands. |
| **S2** | `/value-chain` | The 8-stage chain. Open a stage → process-level cost table with **editable automation levels**; re-level any line and the derived FTE recalculates live. |
| **S4** | `/horizons` | H1/H2/H3 glide path — attrition-led vs restructure-led, redundancy cost, cumulative profit vs status quo, transition break-even. |
| **S5** | `/scenarios` | Status Quo / Agency Zero / Middle Path side-by-side + saved scenarios (localStorage). |

## The numbers (derived, not asserted)

The whole credibility engine is the **automation ladder** (L0–L4) applied per process.
FTE-at-Zero = Σ residual hours ÷ productive hours — so any single line can be
challenged live and the org shape absorbs it.

| | Optimistic | Base | Conservative |
|---|---|---|---|
| Zero org (roles) | 5.7 | **7.1** | 8.5 *(the brief's headline = the safe case)* |
| Zero net profit (Y3) | — | **$2.0m** | $1.80m |
| People cost | — | $1.02m | $1.22m |
| Payroll ratio | — | 26% | 31% |

Status Quo drifts to **$0.95m by Year 3** (below the $1m floor) as digital fees
compress. **Acceptance test (enforced in CI):** Conservative-Zero profit ($1.80m)
still beats Base-Status-Quo profit ($0.95m). Run `npm test` to prove it.

## Data provenance & reconciliation

- Baseline is the FY26 Xero P&L export. Every value carries a **confidence tag**
  (`verified` / `estimated` / `assumed`) and a **tolerance band** (±5 / ±10 / ±20%),
  surfaced on hover and propagated by the engine so outputs render as ranges.
- **Reconciliation:** GP ($4.47m) and total opex ($3.06m) are the verified anchors.
  The raw trad/digital net split ($4.575m) was reconciled proportionally to GP — a
  −2.2% haircut inside the ±10% band. Digital net ($2.168m) independently agrees
  with the **sunnyrev** retainer book ($2.19m FY26) — a clean cross-check.
- **Client concentration** (top 3 = 39%, top 5 = 49%, all traditional) is mined from
  the sunnyrev book — confirms the "trad is lumpy but defensible, the moat is the
  relationship" thesis.
- `otherOpex` here excludes the tooling line so the model can flex tooling separately
  without double-counting. See `lib/model/baseline.ts` for the full note.

> All process hours + automation levels are `assumed` confidence — **workshop seeds**
> for the pre-build session with Matt. They are meant to be argued with in the room.

## Architecture

```
lib/model/
  types.ts       domain types (Metric, ladder, Process, Stage, …)
  baseline.ts    FY26 verified baseline + rates
  processes.ts   full 8-stage process inventory (the workshop artefact)
  tools.ts       18 internal tools mapped to value chain × ladder
  engine.ts      pure calc functions — FTE derivation, demotion rule,
                 fee-compression revenue, realised-FTE ramp, sensitivity bands
  engine.test.ts 16 unit tests incl. the acceptance test
  presets.ts     Status Quo / Agency Zero / Middle Path
```

Pure functions, no I/O, fully unit-tested. UI never computes — it only renders
engine output.

## Run

```bash
npm install
npm run dev      # http://localhost:3000 → /today
npm test         # 16 unit tests, incl. the acceptance test
npm run build
```

## Security / access

- **Stack:** Next.js (App Router) + Tailwind + Recharts, deploy on Vercel.
- **Gate:** `middleware.ts` — single shared passphrase for Roger + Sarah via the
  `AGENCY_ZERO_PASSPHRASE` env var. Unset in local dev ⇒ gate is a no-op.
- `noindex` / `X-Robots-Tag` headers, no analytics. Use a non-guessable subdomain
  and Vercel deployment protection on previews.
- Persistence is localStorage only (v1). No DB.

To deploy: set `AGENCY_ZERO_PASSPHRASE` in Vercel project env vars, enable
deployment protection, ship.
