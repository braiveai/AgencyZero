"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataCtx } from "./engine";
import { useAssumptions, type Assumptions } from "./assumptions";
import { defaultWorkshop, loadWorkshop, pullWorkshop, type WorkshopState } from "@/lib/workshop-store";

/** A DataCtx with assumptions always resolved — what every consumer screen reads. */
export interface ResolvedCtx extends DataCtx {
  assumptions: Assumptions;
}

/**
 * The single source of truth for every consumer screen.
 *
 * Returns the (possibly edited) Workshop stages + staff wrapped with the
 * confirmed assumptions as one DataCtx — so a change made in the Workshop or on
 * Confirm flows through Today, Rebuild, Org, Model, Horizons, Scenarios, Start
 * and the Deck. Nothing on those screens imports the seed `stages`/`staff`
 * directly any more; they all read this.
 *
 * SSR-safe: paints the seed defaults on the server + first client render (so
 * hydration matches), then swaps in localStorage instantly and the shared
 * server copy when it arrives.
 */
export function useWorkshopCtx(): ResolvedCtx {
  const assumptions = useAssumptions();
  const [ws, setWs] = useState<WorkshopState>(defaultWorkshop);

  useEffect(() => {
    setWs(loadWorkshop());
    pullWorkshop().then((r) => {
      if (r) setWs(r);
    });
  }, []);

  return useMemo<ResolvedCtx>(
    () => ({ stages: ws.stages, staff: ws.staff, assumptions }),
    [ws, assumptions],
  );
}
