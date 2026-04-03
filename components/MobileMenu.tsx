"use client";
import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/agents", label: "Agents" },
  { href: "/activity", label: "Activity" },
  { href: "/messages", label: "Messages" },
  { href: "/log", label: "Agent Log" },
  { href: "/docs", label: "Docs" },
  { href: "https://github.com/folkerds13/signaai", label: "GitHub", external: true },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg" style={{ color: "var(--muted)", border: "1px solid var(--border)" }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          {open
            ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 px-4 pb-4 shadow-xl"
          style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm hover:text-white transition-colors"
                  style={{ color: "var(--muted)" }}>
                  {link.label} ↗
                </a>
              ) : (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm hover:text-white transition-colors"
                  style={{ color: "var(--muted)" }}>
                  {link.label}
                </Link>
              )
            )}
            <a href="https://pypi.org/project/signaai/" target="_blank"
              className="mt-1 px-3 py-2.5 rounded-lg text-sm font-medium text-center font-mono"
              style={{ background: "var(--accent)", color: "#fff" }}>
              pip install signaai
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
