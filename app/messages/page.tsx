"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const PAGE_SIZE = 20;

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

type Msg = { id: string; sender: string; recipient: string; message: string; timestamp: string };

export default function MessagesPage() {
  const [all, setAll] = useState<Msg[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => fetch("/api/messages").then((r) => r.json()).then((data) => {
      setAll(data.messages ?? []);
      setLoading(false);
    });
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const q = search.toLowerCase();
  const filtered = all.filter((m) =>
    !q ||
    m.message.toLowerCase().includes(q) ||
    m.sender.toLowerCase().includes(q) ||
    m.recipient.toLowerCase().includes(q)
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
          <Link href="/activity" className="hover:text-white transition-colors">Activity</Link>
          <Link href="/messages" className="text-white transition-colors">Messages</Link>
          <Link href="/log" className="hover:text-white transition-colors">Agent Log</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
        </div>
      </nav>

      <section className="px-6 py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">On-Chain Messages</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Plaintext messages sent between SignaAI wallets</p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded-full" style={{ color: "var(--accent)", background: "rgba(129,140,248,0.1)" }}>
            {filtered.length} messages
          </span>
        </div>

        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by message content, sender, or recipient..."
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
            {visible.map((msg) => (
              <a key={msg.id} href={`https://explorer.signum.network/tx/${msg.id}`} target="_blank" rel="noopener noreferrer"
                className="rounded-lg px-4 py-3 block transition-colors hover:border-[var(--accent)]/40"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {shortAddr(msg.sender)} → {shortAddr(msg.recipient)}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>{timeAgo(msg.timestamp)}</span>
                </div>
                <div className="text-sm break-words leading-snug" style={{ color: "#d0d0e8" }}>{msg.message}</div>
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
