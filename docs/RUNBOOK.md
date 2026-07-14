# Agency Zero — Running the Session

A one-page facilitator's guide for presenting to Roger (MD) + Sarah (CEO).

---

## Before the room (5 min)

- **One machine, one browser.** All state saves to *this* browser's localStorage only — it does not sync to other devices. Present from your laptop; don't clear the browser.
- Open the app, log in with the shared passphrase.
- **Pre-load the three scenarios** so the demo never starts cold: go to Scenarios and confirm Status Quo / Agency Zero / Middle Path are showing. (They're built-in — just be on the tab.)
- Decide your opening: lead with the vision (Rebuild) or the money (Model). Recommended order below.

## The flow (≈30–40 min)

Run the tabs left-to-right; the nav is the running order.

1. **Today** — the honest baseline. "$4.47m GP, $1.43m profit, ~19 people, 47% of GP to payroll. We're healthy — that's exactly why now." Point at the near-breakeven months. *Builds trust in the data before any argument.*
2. **Confirm** — "Before we trust a number, here's everything baked in — tell me what's wrong." Let them push back on a figure or two; edit it live and watch the impact bar move. *This kills the "it's all made up" objection up front.*
3. **The Rebuild** — the destination. The one-page operating model: AI runs the spine, humans hold the gold moments. "What stays gold is exactly what we'd hire for." Click into a stage (Prove is the strongest) to show the machine/human split.
4. **The Model** — the wow. Move a slider — turn up fee compression, watch Status Quo sink; flip Adoption to 100%, watch profit climb. **Start on the Conservatism dial: if it holds on Conservative, it holds.** *This is the emotional hook — let them drive.*
5. **Horizons** — the path. Two lines: Zero climbs, Status Quo sinks below the $1m floor. Toggle Attrition vs Restructure. Break-even inside Year 1.
6. **Scenarios** — the scoreboard. Three worlds side by side. Even the conservative case beats doing nothing.
7. **Start Here** — the decision. The opportunity map (biggest freed FTE first), then the three no-regrets moves + the Middle Path target. **End here, not on a slider.**

> **Workshop** is the participative deep-dive — save it for a follow-up working session, or open it late if they want to challenge how a number is built. Don't open it early; it's granular and will lose an MD before they've felt the payoff.

## The three things to land

1. **Zero is the marker, the Middle Path is the target, H1 is where we start Monday.** Not "fire everyone."
2. **The constraint is adoption, not capability** — the biggest wins sit behind tools we already own.
3. **The argument survives Conservative settings** — prove it live on the dial.

## Saving the outcome

- **Everything autosaves to shared cloud storage (Supabase)** — the assumptions, the workshop, and saved scenarios sync across devices, so Roger and Sarah can open the link on their own laptops and see the same state. (localStorage is kept as an instant cache/offline fallback.)
- Requires two env vars in Vercel: `SUPABASE_URL` and `SUPABASE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`). Without them the app silently falls back to per-device localStorage.
- Hit **Save** (Model) or **Run the model** (Workshop) to snapshot the *entire* state — assumptions, org, processes — into a named card on **Scenarios**. That's your durable record of what the room decided.
- **Reset** buttons restore the seed — useful to start fresh, dangerous mid-session. Don't hit them by accident (Reset also clears the shared copy).

## If something breaks

- Numbers look off? Check **Confirm** — an assumption may have been edited. "Reset to source" restores the Xero defaults.
- Nothing saved on a different device? Check the Supabase env vars are set in Vercel — without them each browser is isolated (localStorage only).
