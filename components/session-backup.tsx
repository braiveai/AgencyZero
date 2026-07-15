"use client";

import { useRef, useState } from "react";
import { collectBackup, downloadBackup, restoreBackup } from "@/lib/backup";
import { pushRemote } from "@/lib/remote";

// Server-key map: localStorage key -> shared-store key (matches the API allow-list).
const RK: Record<string, string> = {
  az_workshop_v1: "workshop",
  az_assumptions_v1: "assumptions",
  az_scenarios_v1: "scenarios",
};

/** Download / restore the whole local session as one JSON file. Additive safety
 *  net — the room's inputs live in this browser until they're backed up. */
export function SessionBackup() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const hasData = Object.keys(collectBackup().data).length > 0;

  function onDownload() {
    downloadBackup();
    setMsg("Backup downloaded — keep it somewhere safe.");
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const written = restoreBackup(parsed);
        // Seed the shared store too, so it syncs once cloud is configured.
        for (const k of written) {
          const rk = RK[k];
          const raw = window.localStorage.getItem(k);
          if (rk && raw) pushRemote(rk, JSON.parse(raw));
        }
        setMsg(`Restored ${written.length} item${written.length === 1 ? "" : "s"} — reloading…`);
        setTimeout(() => window.location.reload(), 700);
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Could not read that file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="rounded-2xl border border-rule bg-rule_soft/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-ink-900">Back up this session</div>
          <div className="text-[11px] leading-snug text-ink-400">
            Your workshop, assumptions and saved scenarios live in this browser. Download a file to keep them safe or move them to another device.
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onDownload}
            disabled={!hasData}
            className="rounded-lg bg-ink-900 px-3 py-1.5 text-[12px] font-semibold text-paper disabled:opacity-40"
          >
            Download backup
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-rule px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:border-ink-300"
          >
            Restore…
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} className="hidden" />
        </div>
      </div>
      {msg && <div className="mt-2 text-[11px] font-medium text-accent-dark">{msg}</div>}
    </div>
  );
}
