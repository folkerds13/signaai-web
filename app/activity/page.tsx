"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const PAGE_SIZE = 20;

const TYPE_COLORS: Record<string, string> = {
  transfer: "var(--green)",
  escrow: "var(--accent)",
  identity: "#f59e0b",
  verify: "#818cf8",
  arbitration: "#f87171",
  message: "var(--muted)",
};
const TYPE_LABELS: Record<string, string> = {
  transfer: "Transfer", escrow: "Escrow", identity: "Identity",
  verify: "Verify", arbitration: "Arbitration", message: "Message",
};

function shortAddr(addr: string) {
  if (!addr) return "—";
  const parts = addr.split("-");
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}...` : addr.slice(0, 10) + "...";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Tx = { id: string; type: string; sender: string; recipient: string; amount: number; message: string | null; timestamp: string };

export default function ActivityPage() {
  const [all, setAll] = useState<Tx[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity").then((r) => r.json()).then((data) => {
      setAll(data.transactions ?? []);
      setLoading(false);
    });
  }, []);

  const q = search.toLowerCase();
  const filtered = all.filter((tx) =>
    !q ||
    tx.type.includes(q) ||
    tx.sender.toLowerCase().includes(q) ||
    tx.recipient.toLowerCase().includes(q) ||
    tx.message?.toLowerCase().includes(q)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v); setPage(1); }

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      <nav className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent)" }}>S</Link>
          <span className="font-semibold text-lg tracking-tight">SignaAI</span>
        </div>
        <div className="flex items-center gap-4 text-sm" style={{ color: "var(--muted)" }}>
          <Link href="/agents" className="hover:text-white transition-colors">Agents</Link>
          <Link href="/activity" className="text-white transition-colors">Activity</Link>
          <Link href="/messages" className="hover:text-white transition-colors">Messages</Link>
          <Link href="/log" className="hover:text-white transition-colors">Agent Log</Link>
        </div>
      </nav>

      <section className="px-6 py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Live Activity</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>All transactions from SignaAI wallets on Signum mainnet</p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded-full" style={{ color: "var(--accent)", background: "rgba(129,140,248,0.1)" }}>
            {filtered.length} transactions
          </span>
        </div>

        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by type, sender, recipient, or message..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "#e0e0f0" }}
          />
        </div>

        {loading ? (
          <p className="text-center py-16 text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
        ) : visible.length === 0 ? (
          <p className="text-center py-16 text-sm" style={{ color: "var(--muted)" }}>No results</p>
        ) : (
          <div className="space-y-2">
            {visible.map((tx) => (
              <a key={tx.id} href={`https://explorer.signum.network/tx/${tx.id}`} target="_blank" rel="noopener noreferrer"
                className="rounded-lg px-3 py-2.5 flex items-start gap-3 transition-colors hover:border-[var(--accent)]/40 block"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: TYPE_COLORS[tx.type] ?? "var(--muted)" }}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: TYPE_COLORS[tx.type] ?? "var(--muted)" }}>
                      {TYPE_LABELS[tx.type] ?? tx.type}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(tx.timestamp)}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {shortAddr(tx.sender)} → {shortAddr(tx.recipient)}
                    {tx.amount > 0 && <span className="ml-2 font-mono" style={{ color: "var(--green)" }}>+{tx.amount.toFixed(2)} SIGNA</span>}
                  </div>
                  {tx.message && <div className="text-xs mt-0.5 truncate font-mono" style={{ color: "var(--muted)", opacity: 0.7 }}>{tx.message}</div>}
                </div>
              </a>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm disabled:opacity-40"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>← Prev</button>
            <span className="text-sm" style={{ color: "var(--muted)" }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm disabled:opacity-40"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>Next →</button>
          </div>
        )}
      </section>
    </main>
  );
}
