"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Left-to-right = the running order of the session. Workshop is the optional
// deep-dive, parked at the end (after the decision) with a divider before it.
const LINKS = [
  { href: "/today", label: "Today" },
  { href: "/confirm", label: "Confirm" },
  { href: "/rebuild", label: "The Rebuild" },
  { href: "/model", label: "The Model" },
  { href: "/horizons", label: "Horizons" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/start", label: "Start Here" },
  { href: "/org", label: "Org Chart", deep: true },
  { href: "/value-chain", label: "Workshop", deep: true },
];

export function Nav() {
  const path = usePathname();
  if (path === "/login" || path.startsWith("/deck") || path.startsWith("/report")) return null;
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
        <Link href="/today" className="flex items-baseline gap-2">
          <span className="text-[15px] font-extrabold tracking-tight text-ink-900">
            AGENCY&nbsp;ZERO
          </span>
          <span className="hidden text-[11px] text-ink-300 sm:inline">
            operating model
          </span>
        </Link>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((l, idx) => {
            const active = path === l.href || (path === "/" && l.href === "/today");
            const firstDeep = LINKS.findIndex((x) => x.deep) === idx;
            return (
              <span key={l.href} className="flex items-center gap-1">
                {firstDeep && <span className="mx-1 h-4 w-px shrink-0 bg-rule" aria-hidden />}
                <Link
                  href={l.href}
                  title={l.deep ? "The deep-dive — build the model with them (or a follow-up session)" : undefined}
                  className={clsx(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-ink-900 text-paper"
                      : l.deep
                        ? "text-ink-300 hover:bg-rule_soft hover:text-ink-900"
                        : "text-ink-500 hover:bg-rule_soft hover:text-ink-900",
                  )}
                >
                  {l.label}
                </Link>
              </span>
            );
          })}
        </nav>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Link
            href="/report"
            className="rounded-lg border border-rule px-3 py-1.5 text-[13px] font-semibold text-ink-700 hover:border-ink-300"
          >
            Report ↗
          </Link>
          <Link
            href="/deck"
            className="rounded-lg border border-rule px-3 py-1.5 text-[13px] font-semibold text-ink-700 hover:border-ink-300"
          >
            Deck ↗
          </Link>
        </div>
      </div>
    </header>
  );
}
