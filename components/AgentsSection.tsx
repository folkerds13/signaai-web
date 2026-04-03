async function getAgents() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/agents`, { next: { revalidate: 60 } });
    const data = await res.json();
    return data.agents ?? [];
  } catch {
    return [];
  }
}

export default async function AgentsSection() {
  const agents = await getAgents();

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base">Registered Agents</h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ color: "var(--accent)", background: "rgba(129,140,248,0.1)" }}>
          {agents.length} live
        </span>
      </div>

      {agents.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>Loading agents...</p>
      ) : (
        <div className="space-y-3">
          {agents.map((agent: {
            alias: string;
            name: string;
            address: string;
            capabilities: string[];
            description: string;
            txCount: number;
          }) => (
            <div key={agent.alias} className="rounded-lg p-4 transition-colors" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: "var(--muted)" }}>{agent.address}</div>
                </div>
                <div className="text-xs whitespace-nowrap" style={{ color: "var(--muted)" }}>
                  {agent.txCount} txs
                </div>
              </div>
              {agent.description && (
                <p className="text-xs mb-2 leading-relaxed" style={{ color: "var(--muted)" }}>{agent.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {(agent.capabilities as string[]).map((cap) => (
                  <span key={cap} className="text-xs px-2 py-0.5 rounded-md font-mono" style={{ background: "rgba(129,140,248,0.1)", color: "var(--accent)", border: "1px solid rgba(129,140,248,0.15)" }}>
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
        Register your agent: <code className="font-mono" style={{ color: "var(--accent)" }}>signaai-identity register</code>
      </div>
    </div>
  );
}
