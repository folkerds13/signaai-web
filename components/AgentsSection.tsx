const NODE = "https://europe.signum.network";
const REGISTRY_ACCOUNTS = [
  "S-PS4K-2KE2-8LEV-HD2YE",
  "S-44S7-32XB-5DM5-5AL3K",
];

async function signumGet(params: Record<string, string>) {
  const qs = new URLSearchParams({ requestType: params.requestType, ...params }).toString();
  const res = await fetch(`${NODE}/burst?${qs}`, { next: { revalidate: 60 } });
  return res.json();
}

async function getAgents() {
  try {
    const agents = [];
    const seen = new Set<string>();

    // Track best alias per address — prefer the one with a description
    const byAddress = new Map<string, { alias: string; name: string; address: string; capabilities: string[]; description: string; timestamp: number }>();

    for (const account of REGISTRY_ACCOUNTS) {
      const data = await signumGet({ requestType: "getAliases", account });
      for (const alias of data.aliases ?? []) {
        const uri: string = alias.aliasURI ?? "";
        if (!uri.includes("sig-agent:")) continue;
        if (seen.has(alias.aliasName)) continue;
        seen.add(alias.aliasName);

        let metadata: Record<string, unknown> = {};
        try { metadata = JSON.parse(uri.split("sig-agent:")[1]); } catch {}

        const address = (metadata.address as string) ?? account;
        const existing = byAddress.get(address);
        const description = (metadata.description as string) ?? "";

        // Keep this alias if it has a description and the existing one doesn't, or if it's newer
        if (!existing || (description && !existing.description) || alias.timestamp > existing.timestamp) {
          byAddress.set(address, {
            alias: alias.aliasName,
            name: (metadata.name as string) ?? alias.aliasName,
            address,
            capabilities: (metadata.capabilities as string[]) ?? [],
            description,
            timestamp: alias.timestamp,
          });
        }
      }
    }

    // Fetch tx counts and build final list
    for (const agent of byAddress.values()) {
      const txData = await signumGet({
        requestType: "getAccountTransactions",
        account: agent.address,
        firstIndex: "0",
        lastIndex: "99",
      });
      agents.push({ ...agent, txCount: txData.transactions?.length ?? 0 });
    }
    return agents;
  } catch {
    return [];
  }
}

export default async function AgentsSection() {
  const agents = await getAgents();
  const preview = agents.slice(0, 5);

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base">Registered Agents</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ color: "var(--accent)", background: "rgba(129,140,248,0.1)" }}>
            {agents.length} live
          </span>
          <a href="/agents" className="text-xs hover:text-white transition-colors" style={{ color: "var(--muted)" }}>View all →</a>
        </div>
      </div>

      {preview.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>No agents found</p>
      ) : (
        <div className="space-y-3">
          {preview.map((agent) => (
            <div key={agent.alias} className="rounded-lg p-4" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: "var(--muted)" }}>{agent.address}</div>
                </div>
                <div className="text-xs whitespace-nowrap" style={{ color: "var(--muted)" }}>{agent.txCount} txs</div>
              </div>
              {agent.description && (
                <p className="text-xs mb-2 leading-relaxed" style={{ color: "var(--muted)" }}>{agent.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap) => (
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
