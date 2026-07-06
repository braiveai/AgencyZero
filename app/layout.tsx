import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Agency Zero",
  description: "Confidential operating-model tool — Sunny Advertising.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-5 pb-24 pt-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-5 pb-10 text-[11px] leading-relaxed text-ink-300">
          Confidential — Roger Delaney &amp; Sarah McNeil only. Figures from Xero
          FY26 export; trad/digital splits and FTE allocations are estimates for
          validation. The argument survives ±20% on every assumption.
        </footer>
      </body>
    </html>
  );
}
