const NODE = "https://europe.signum.network";
const ACCOUNTS = ["S-PS4K-2KE2-8LEV-HD2YE", "S-44S7-32XB-5DM5-5AL3K"];
const SIGNUM_EPOCH = new Date("2014-08-11T02:00:00Z").getTime() / 1000;

async function signumGet(params: Record<string, string>) {
  const qs = new URLSearchParams({ requestType: params.requestType, ...params }).toString();
  const res = await fetch(`${NODE}/burst?${qs}`, { next: { revalidate: 30 } });
  return res.json();
}

function signumTs(ts: number): string {
  return new Date((SIGNUM_EPOCH + ts) * 1000).toISOString();
}

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

async function getActivity() {
  try {
    const results = await Promise.all(
      ACCOUNTS.map((account) =>
        signumGet({ requestType: "getAccountTransactions", account, firstIndex: "0", lastIndex: "19" })
      )
    );

    const seen = new Set<string>();
    const transactions = [];

    for (const result of results) {
      for (const tx of result.transactions ?? []) {
        if (seen.has(tx.transaction)) continue;
        seen.add(tx.transaction);

        const amountNQT = parseInt(tx.amountNQT ?? "0");
        const msg: string = tx.attachment?.message ?? "";
        let type = "transfer";
        if (msg.startsWith("ESCROW_")) type = "escrow";
        else if (msg.startsWith("SIGNAAI_AGENT:")) type = "identity";
        else if (msg.startsWith("SIGNAAI_STAMP:")) type = "verify";
        else if (msg.startsWith("ARBIT_")) type = "arbitration";
        else if (amountNQT === 0) type = "message";

        transactions.push({
          id: tx.transaction,
          type,
          sender: tx.senderRS ?? "",
          recipient: tx.recipientRS ?? "",
          amount: amountNQT / 100_000_000,
          message: msg ? msg.slice(0, 60) : null,
          timestamp: signumTs(tx.timestamp),
        });
      }
    }

    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return transactions.slice(0, 5);
  } catch {
    return [];
  }
}

export default async function ActivitySection() {
  const transactions = await getActivity();

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base">Live Activity</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--muted)" }}>Signum mainnet</span>
          <a href="/activity" className="text-xs hover:text-white transition-colors" style={{ color: "var(--muted)" }}>View all →</a>
        </div>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>No recent activity</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <a key={tx.id} href={`https://explorer.signum.network/tx/${tx.id}`} target="_blank" rel="noopener noreferrer"
              className="rounded-lg px-3 py-2.5 flex items-start gap-3 transition-colors hover:border-[var(--accent)]/40 block"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
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
            </a>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
        Showing recent transactions from SignaAI wallets
      </div>
    </div>
  );
}
