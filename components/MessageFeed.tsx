const NODE = "https://europe.signum.network";
const ACCOUNTS = ["S-PS4K-2KE2-8LEV-HD2YE", "S-44S7-32XB-5DM5-5AL3K"];
const SIGNUM_EPOCH = new Date("2014-01-11T02:00:00Z").getTime() / 1000;

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

// Protocol prefixes belong in the agent log, not here
const PROTOCOL_PREFIXES = ["ESCROW_", "SIGNAAI_AGENT:", "SIGNAAI_STAMP:", "ARBIT_"];

async function getMessages() {
  try {
    const results = await Promise.all(
      ACCOUNTS.map((account) =>
        signumGet({ requestType: "getAccountTransactions", account, firstIndex: "0", lastIndex: "49" })
      )
    );

    const seen = new Set<string>();
    const messages = [];

    for (const result of results) {
      for (const tx of result.transactions ?? []) {
        if (seen.has(tx.transaction)) continue;
        seen.add(tx.transaction);

        const amountNQT = parseInt(tx.amountNQT ?? "0");
        const msg: string = tx.attachment?.message ?? "";

        // Only plain messages (zero-value tx with a message, no protocol prefix)
        if (amountNQT !== 0 || !msg) continue;
        if (PROTOCOL_PREFIXES.some((p) => msg.startsWith(p))) continue;

        messages.push({
          id: tx.transaction,
          sender: tx.senderRS ?? "",
          recipient: tx.recipientRS ?? "",
          message: msg,
          timestamp: signumTs(tx.timestamp),
        });
      }
    }

    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return messages.slice(0, 5);
  } catch {
    return [];
  }
}

export default async function MessageFeed() {
  const messages = await getMessages();

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base">On-Chain Messages</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--muted)" }}>plaintext · live</span>
          <a href="/messages" className="text-xs hover:text-white transition-colors" style={{ color: "var(--muted)" }}>View all →</a>
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>No messages yet</p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <a key={msg.id} href={`https://explorer.signum.network/tx/${msg.id}`} target="_blank" rel="noopener noreferrer"
              className="rounded-lg px-3 py-2.5 block transition-colors hover:border-[var(--accent)]/40"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
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

      <div className="mt-4 pt-4 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
        Plain messages sent between SignaAI wallets on-chain
      </div>
    </div>
  );
}
