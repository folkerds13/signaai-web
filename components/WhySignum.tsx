"use client";
import { useState } from "react";

const ROWS = [
  { feature: "Smart contract execution", signum: "Self-executing — no keeper needed", eth: "Requires external keeper or relayer", highlight: true },
  { feature: "Transaction fee",           signum: "~$0.00003 fixed",                  eth: "Variable, often $1–$50+",           highlight: true },
  { feature: "Energy use",                signum: "<0.002% of Bitcoin",               eth: "High (PoW) or validator overhead",  highlight: false },
  { feature: "Running since",             signum: "2014 (as Burstcoin)",              eth: "2015 / 2020",                       highlight: false },
  { feature: "Agent-to-agent payments",  signum: "Native, 4-second blocks",           eth: "Possible but expensive",            highlight: true },
  { feature: "Competitors building here",signum: "None yet — greenfield",             eth: "Coinbase x402, Fetch.ai, Olas...",  highlight: true },
  { feature: "Token distribution",       signum: "No pre-mine, no VC allocation — fairly distributed from day one", eth: "ETH: 72M pre-mined. Solana: 48% to insiders at launch", highlight: true },
];

export default function WhySignum() {
  const [slide, setSlide] = useState(0);
  const row = ROWS[slide];

  return (
    <>
      {/* Desktop: full table */}
      <div className="hidden md:block rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(129,140,248,0.3)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(129,140,248,0.2)", background: "rgba(129,140,248,0.08)" }}>
              <th className="text-left px-6 py-4 text-base font-semibold" style={{ color: "#e0e0f0" }}>Feature</th>
              <th className="px-6 py-4 text-base font-bold" style={{ color: "var(--accent)" }}>Signum</th>
              <th className="px-6 py-4 text-base font-semibold" style={{ color: "#c0c0d8" }}>Ethereum / Solana</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} style={{ borderBottom: i < ROWS.length - 1 ? "1px solid var(--border)" : "none", background: r.highlight ? "rgba(129,140,248,0.04)" : "transparent" }}>
                <td className="px-6 py-4 text-base font-medium" style={{ color: "#d0d0e8" }}>{r.feature}</td>
                <td className="px-6 py-4 text-center text-base font-semibold" style={{ color: "var(--green)" }}>{r.signum}</td>
                <td className="px-6 py-4 text-center text-base font-medium" style={{ color: "#d0d0e8" }}>{r.eth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card slider */}
      <div className="md:hidden">
        <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid rgba(129,140,248,0.3)", minHeight: "220px" }}>
          {/* Feature label */}
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "var(--accent)" }}>
            {slide + 1} of {ROWS.length} — {row.feature}
          </div>

          {/* Signum value */}
          <div className="mb-5">
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>Signum</div>
            <div className="text-lg font-semibold" style={{ color: "var(--green)" }}>{row.signum}</div>
          </div>

          {/* ETH/Solana value */}
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "#a0a0b8" }}>Ethereum / Solana</div>
            <div className="text-base" style={{ color: "#a0a0b8" }}>{row.eth}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            disabled={slide === 0}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-30"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
            ← Prev
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {ROWS.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{ background: i === slide ? "var(--accent)" : "var(--border)" }} />
            ))}
          </div>

          <button
            onClick={() => setSlide((s) => Math.min(ROWS.length - 1, s + 1))}
            disabled={slide === ROWS.length - 1}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-30"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
            Next →
          </button>
        </div>
      </div>
    </>
  );
}
