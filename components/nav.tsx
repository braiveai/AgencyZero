"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/today", label: "Today", n: "S1" },
  { href: "/rebuild", label: "The Rebuild", n: "" },
  { href: "/value-chain", label: "Workshop", n: "S2" },
  { href: "/model", label: "The Model", n: "S3" },
  { href: "/horizons", label: "Horizons", n: "S4" },
  { href: "/scenarios", label: "Scenarios", n: "S5" },
];

export function Nav() {
  const path = usePathname();
  if (path === "/login" || path.startsWith("/deck")) return null;
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
          {LINKS.map((l) => {
            const active = path === l.href || (path === "/" && l.href === "/today");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-ink-900 text-paper"
                    : "text-ink-500 hover:bg-rule_soft hover:text-ink-900",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/deck"
          className="hidden shrink-0 rounded-lg border border-rule px-3 py-1.5 text-[13px] font-semibold text-ink-700 hover:border-ink-300 sm:block"
        >
          Deck ↗
        </Link>
      </div>
    </header>
  );
}
