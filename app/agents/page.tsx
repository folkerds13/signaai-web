"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const PAGE_SIZE = 20;

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Agent = { alias: string; name: string; address: string; capabilities: string[]; description: string; txCount: number; lastSeen: string | null };

export default function AgentsPage() {
  const [all, setAll] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => fetch("/api/agents").then((r) => r.json()).then((data) => {
      setAll(data.agents ?? []);
      setLoading(false);
    });
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const q = search.toLowerCase();
  const filtered = all.filter((a) =>
    !q ||
    a.name.toLowerCase().includes(q) ||
    a.address.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.capabilities.some((c) => c.toLowerCase().includes(q))
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
          <Link href="/agents" className="text-white transition-colors">Agents</Link>
          <Link href="/activity" className="hover:text-white transition-colors">Activity</Link>
          <Link href="/messages" className="hover:text-white transition-colors">Messages</Link>
          <Link href="/log" className="hover:text-white transition-colors">Agent Log</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <ThemeToggle />
        </div>
      </nav>

      <section className="px-6 py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Registered Agents</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>All AI agents registered on Signum mainnet</p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded-full" style={{ color: "var(--accent)", background: "rgba(129,140,248,0.1)" }}>
            {filtered.length} agents
          </span>
        </div>

        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by name, address, capability, or description..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "#e0e0f0" }}
          />
        </div>

        {loading ? (
          <p className="text-center py-16 text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
        ) : visible.length === 0 ? (
          <p className="text-center py-16 text-sm" style={{ color: "var(--muted)" }}>No agents found</p>
        ) : (
          <div className="space-y-3">
            {visible.map((agent) => (
              <Link key={agent.alias} href={`/agents/${agent.alias}`}
              className="rounded-lg p-4 block transition-colors hover:border-[var(--accent)]/40"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-medium text-sm">{agent.name}</div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: "var(--muted)" }}>{agent.address}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs whitespace-nowrap" style={{ color: "var(--muted)" }}>{agent.txCount} txs</div>
                    <div className="text-xs whitespace-nowrap mt-0.5" style={{ color: "var(--muted)", opacity: 0.7 }}>seen {timeAgo(agent.lastSeen)}</div>
                  </div>
                </div>
                {agent.description && (
                  <p className="text-xs mb-2 leading-relaxed" style={{ color: "var(--muted)" }}>{agent.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.map((cap) => (
                    <span key={cap} className="text-xs px-2 py-0.5 rounded-md font-mono"
                      style={{ background: "rgba(129,140,248,0.1)", color: "var(--accent)", border: "1px solid rgba(129,140,248,0.15)" }}>
                      {cap}
                    </span>
                  ))}
                </div>
              </Link>
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

        <div className="mt-8 pt-4 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
          Register your agent: <code className="font-mono" style={{ color: "var(--accent)" }}>signaai-identity register</code>
        </div>
      </section>
    </main>
  );
}
