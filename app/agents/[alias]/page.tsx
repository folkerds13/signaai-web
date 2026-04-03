import Link from "next/link";

const NODE = "https://europe.signum.network";
const REGISTRY_ACCOUNTS = ["S-PS4K-2KE2-8LEV-HD2YE", "S-44S7-32XB-5DM5-5AL3K"];
const SIGNUM_EPOCH = new Date("2014-01-11T02:00:00Z").getTime() / 1000;

async function signumGet(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${NODE}/burst?${qs}`, { next: { revalidate: 60 } });
  return res.json();
}

function signumTs(ts: number) {
  return new Date((SIGNUM_EPOCH + ts) * 1000).toISOString();
}

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

function shortAddr(addr: string) {
  if (!addr) return "—";
  const parts = addr.split("-");
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}...` : addr.slice(0, 10) + "...";
}

const TYPE_COLORS: Record<string, string> = {
  transfer: "var(--green)", escrow: "var(--accent)", identity: "#f59e0b",
  verify: "#818cf8", arbitration: "#f87171", message: "var(--muted)",
};
const TYPE_LABELS: Record<string, string> = {
  transfer: "Transfer", escrow: "Escrow", identity: "Identity",
  verify: "Verify", arbitration: "Arbitration", message: "Message",
};

async function getAgent(aliasName: string) {
  for (const account of REGISTRY_ACCOUNTS) {
    const data = await signumGet({ requestType: "getAliases", account });
    for (const alias of data.aliases ?? []) {
      if (alias.aliasName !== aliasName) continue;
      const uri: string = alias.aliasURI ?? "";
      if (!uri.includes("sig-agent:")) continue;
      let metadata: Record<string, unknown> = {};
      try { metadata = JSON.parse(uri.split("sig-agent:")[1]); } catch {}
      return {
        alias: alias.aliasName,
        name: (metadata.name as string) ?? alias.aliasName,
        address: (metadata.address as string) ?? account,
        capabilities: (metadata.capabilities as string[]) ?? [],
        description: (metadata.description as string) ?? "",
        version: (metadata.version as string) ?? "1.0",
      };
    }
  }
  return null;
}

type AgentTx = { id: string; type: string; sender: string; recipient: string; amount: number; message: string | null; timestamp: string };

async function getAgentTxs(address: string): Promise<AgentTx[]> {
  const data = await signumGet({
    requestType: "getAccountTransactions",
    account: address,
    firstIndex: "0",
    lastIndex: "49",
  });
  return (data.transactions ?? []).map((tx: Record<string, unknown>) => {
    const amountNQT = parseInt((tx.amountNQT as string) ?? "0");
    const msg = ((tx.attachment as Record<string, unknown>)?.message as string) ?? "";
    let type = "transfer";
    if (msg.startsWith("ESCROW_")) type = "escrow";
    else if (msg.startsWith("SIGNAAI_AGENT:")) type = "identity";
    else if (msg.startsWith("SIGNAAI_STAMP:")) type = "verify";
    else if (msg.startsWith("ARBIT_")) type = "arbitration";
    else if (amountNQT === 0) type = "message";
    return {
      id: tx.transaction as string,
      type,
      sender: (tx.senderRS as string) ?? "",
      recipient: (tx.recipientRS as string) ?? "",
      amount: amountNQT / 100_000_000,
      message: msg ? msg.slice(0, 60) : null,
      timestamp: signumTs(tx.timestamp as number),
    };
  });
}

export default async function AgentDetailPage({ params }: { params: Promise<{ alias: string }> }) {
  const { alias } = await params;
  const agent = await getAgent(decodeURIComponent(alias));

  if (!agent) {
    return (
      <main className="min-h-screen" style={{ background: "var(--background)" }}>
        <nav className="border-b px-6 py-4 flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
          <Link href="/" className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent)" }}>S</Link>
          <span className="font-semibold text-lg tracking-tight">SignaAI</span>
        </nav>
        <div className="px-6 py-20 text-center">
          <p className="text-lg mb-4" style={{ color: "var(--muted)" }}>Agent not found</p>
          <Link href="/agents" className="text-sm" style={{ color: "var(--accent)" }}>← Back to agents</Link>
        </div>
      </main>
    );
  }

  const txs = await getAgentTxs(agent.address);
  const lastSeen = txs[0]?.timestamp ?? null;

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      <nav className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent)" }}>S</Link>
          <span className="font-semibold text-lg tracking-tight">SignaAI</span>
        </div>
        <div className="flex items-center gap-4 text-sm" style={{ color: "var(--muted)" }}>
          <Link href="/agents" className="hover:text-white transition-colors">← Agents</Link>
          <Link href="/activity" className="hover:text-white transition-colors">Activity</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
        </div>
      </nav>

      <section className="px-6 py-10 max-w-3xl mx-auto">
        {/* Agent header */}
        <div className="rounded-xl p-6 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{agent.name}</h1>
              <div className="font-mono text-sm" style={{ color: "var(--muted)" }}>{agent.address}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs px-2 py-1 rounded-full font-mono mb-1" style={{ color: "var(--green)", background: "rgba(52,211,153,0.1)" }}>v{agent.version}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>seen {timeAgo(lastSeen)}</div>
            </div>
          </div>

          {agent.description && (
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "#c0c0d8" }}>{agent.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-4">
            {agent.capabilities.map((cap) => (
              <span key={cap} className="text-xs px-2 py-1 rounded-md font-mono"
                style={{ background: "rgba(129,140,248,0.1)", color: "var(--accent)", border: "1px solid rgba(129,140,248,0.15)" }}>
                {cap}
              </span>
            ))}
          </div>

          <div className="flex gap-4 pt-4 text-sm" style={{ borderTop: "1px solid var(--border)" }}>
            <div>
              <div className="font-semibold">{txs.length}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>transactions</div>
            </div>
            <div>
              <div className="font-semibold font-mono text-xs mt-1" style={{ color: "var(--muted)" }}>{agent.alias}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>alias</div>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <h2 className="text-base font-semibold mb-3">Recent Transactions</h2>
        {txs.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {txs.map((tx) => (
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
      </section>
    </main>
  );
}
