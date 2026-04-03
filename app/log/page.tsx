"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const PAGE_SIZE = 20;

const EVENT_META: Record<string, { label: string; color: string; icon: string }> = {
  escrow:      { label: "Escrow",      color: "var(--accent)",  icon: "🔒" },
  identity:    { label: "Identity",    color: "#f59e0b",        icon: "🪪" },
  verify:      { label: "Verify",      color: "#818cf8",        icon: "🔏" },
  arbitration: { label: "Arbitration", color: "#f87171",        icon: "⚖️" },
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

type Event = { id: string; type: string; action: string; sender: string; recipient: string; raw: string; timestamp: string };

export default function LogPage() {
  const [all, setAll] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => fetch("/api/agentlog").then((r) => r.json()).then((data) => {
      setAll(data.events ?? []);
      setLoading(false);
    });
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const q = search.toLowerCase();
  const filtered = all.filter((ev) =>
    !q ||
    ev.type.includes(q) ||
    ev.action.includes(q) ||
    ev.sender.toLowerCase().includes(q) ||
    ev.recipient.toLowerCase().includes(q) ||
    ev.raw.toLowerCase().includes(q)
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
          <Link href="/messages" className="hover:text-white transition-colors">Messages</Link>
          <Link href="/log" className="text-white transition-colors">Agent Log</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
        </div>
      </nav>

      <section className="px-6 py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Agent Communication Log</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Protocol events: Escrow · Identity · Verify · Arbitration</p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded-full" style={{ color: "var(--accent)", background: "rgba(129,140,248,0.1)" }}>
            {filtered.length} events
          </span>
        </div>

        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by type, action, sender, recipient, or payload..."
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
            {visible.map((ev) => {
              const meta = EVENT_META[ev.type] ?? { label: ev.type, color: "var(--muted)", icon: "•" };
              return (
                <a key={ev.id} href={`https://explorer.signum.network/tx/${ev.id}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg px-4 py-3 block transition-colors hover:border-[var(--accent)]/40"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{meta.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#a0a0b8" }}>{ev.action}</span>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>{timeAgo(ev.timestamp)}</span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {shortAddr(ev.sender)} → {shortAddr(ev.recipient)}
                  </div>
                  <div className="text-xs mt-0.5 truncate font-mono" style={{ color: "#a0a0b8", opacity: 0.6 }}>{ev.raw}</div>
                </a>
              );
            })}
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
