async function getActivity() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/activity`, { next: { revalidate: 30 } });
    const data = await res.json();
    return data.transactions ?? [];
  } catch {
    return [];
  }
}

const TYPE_COLORS: Record<string, string> = {
  transfer: "var(--green)",
  escrow: "var(--accent)",
  identity: "#f59e0b",
  verify: "#818cf8",
  arbitration: "#f87171",
  message: "var(--muted)",
};

const TYPE_LABELS: Record<string, string> = {
  transfer: "Transfer",
  escrow: "Escrow",
  identity: "Identity",
  verify: "Verify",
  arbitration: "Arbitration",
  message: "Message",
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

export default async function ActivitySection() {
  const transactions = await getActivity();

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base">Live Activity</h2>
        <span className="text-xs" style={{ color: "var(--muted)" }}>Signum mainnet</span>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>Loading activity...</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx: {
            id: string;
            type: string;
            sender: string;
            recipient: string;
            amount: number;
            message: string | null;
            timestamp: string;
            confirmations: number;
          }) => (
            <div key={tx.id} className="rounded-lg px-3 py-2.5 flex items-start gap-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
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
                {tx.message && (
                  <div className="text-xs mt-0.5 truncate font-mono" style={{ color: "var(--muted)", opacity: 0.7 }}>{tx.message}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
        Showing recent transactions from SignaAI wallets
      </div>
    </div>
  );
}
