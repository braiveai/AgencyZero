"use client";

import { useState } from "react";

export default function Login() {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(false);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passphrase: pass }),
    });
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next") || "/today";
      window.location.href = next;
    } else {
      setErr(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <div className="text-[15px] font-extrabold tracking-tight text-ink-900">
          AGENCY&nbsp;ZERO
        </div>
        <p className="mt-1 text-[13px] text-ink-500">
          Confidential. Enter the shared passphrase.
        </p>
        <input
          type="password"
          autoFocus
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="Passphrase"
          className="mt-5 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-[14px] outline-none focus:border-ink-300"
        />
        {err && (
          <p className="mt-2 text-[12px] text-negative">Incorrect passphrase.</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-ink-900 py-2 text-[14px] font-semibold text-paper disabled:opacity-50"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
