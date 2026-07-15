"use client";

// One-file backup of the whole local session: workshop, assumptions and saved
// scenarios. Because the shared cloud store is only active once the Supabase env
// vars are set in Vercel, this is the reliable way to get the room's inputs OUT
// of the browser they were entered in — download a file, keep it, restore it on
// any device.

const KEYS = ["az_workshop_v1", "az_assumptions_v1", "az_scenarios_v1"] as const;

export interface SessionBackup {
  app: "agency-zero";
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

/** Gather every local key into one JSON blob. */
export function collectBackup(): SessionBackup {
  const data: Record<string, unknown> = {};
  if (typeof window !== "undefined") {
    for (const k of KEYS) {
      const raw = window.localStorage.getItem(k);
      if (raw) {
        try {
          data[k] = JSON.parse(raw);
        } catch {
          /* skip unparseable */
        }
      }
    }
  }
  return { app: "agency-zero", version: 1, exportedAt: new Date().toISOString(), data };
}

/** Restore a backup into localStorage. Returns the keys written. */
export function restoreBackup(blob: unknown): string[] {
  if (typeof window === "undefined") return [];
  const b = blob as Partial<SessionBackup>;
  if (!b || b.app !== "agency-zero" || !b.data) {
    throw new Error("Not an Agency Zero backup file.");
  }
  const written: string[] = [];
  for (const k of KEYS) {
    if (k in b.data) {
      window.localStorage.setItem(k, JSON.stringify((b.data as Record<string, unknown>)[k]));
      written.push(k);
    }
  }
  return written;
}

const stamp = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Trigger a download of the current session as agency-zero-YYYY-MM-DD.json. */
export function downloadBackup() {
  const backup = collectBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agency-zero-${stamp(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
