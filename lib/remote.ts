"use client";

// Thin client for the shared server state. Fire-and-forget writes; tolerant reads.
// If the server/Supabase is unconfigured or unreachable, everything degrades to the
// localStorage cache the callers already maintain.

export async function pullRemote<T>(key: string): Promise<T | null> {
  try {
    const r = await fetch(`/api/state/${key}`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return (j?.data ?? null) as T | null;
  } catch {
    return null;
  }
}

export function pushRemote(key: string, data: unknown): void {
  try {
    void fetch(`/api/state/${key}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true,
    });
  } catch {
    /* ignore — localStorage remains the source of truth locally */
  }
}
