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

type EventType = "escrow" | "identity" | "verify" | "arbitration";

const EVENT_META: Record<EventType, { label: string; color: string; icon: string }> = {
  escrow:      { label: "Escrow",      color: "var(--accent)",  icon: "🔒" },
  identity:    { label: "Identity",    color: "#f59e0b",        icon: "🪪" },
  verify:      { label: "Verify",      color: "#818cf8",        icon: "🔏" },
  arbitration: { label: "Arbitration", color: "#f87171",        icon: "⚖️" },
};

function parseEvent(msg: string): { type: EventType; action: string } | null {
  if (msg.startsWith("ESCROW_")) {
    const action = msg.replace("ESCROW_", "").split(":")[0].toLowerCase();
    return { type: "escrow", action };
  }
  if (msg.startsWith("SIGNAAI_AGENT:")) return { type: "identity", action: "register" };
  if (msg.startsWith("SIGNAAI_STAMP:")) return { type: "verify", action: "stamp" };
  if (msg.startsWith("ARBIT_")) {
    const action = msg.replace("ARBIT_", "").split(":")[0].toLowerCase();
    return { type: "arbitration", action };
  }
  return null;
}

async function getAgentEvents() {
  try {
    const results = await Promise.all(
      ACCOUNTS.map((account) =>
        signumGet({ requestType: "getAccountTransactions", account, firstIndex: "0", lastIndex: "49" })
      )
    );

    const seen = new Set<string>();
    const events = [];

    for (const result of results) {
      for (const tx of result.transactions ?? []) {
        if (seen.has(tx.transaction)) continue;
        seen.add(tx.transaction);

        const msg: string = tx.attachment?.message ?? "";
        const parsed = parseEvent(msg);
        if (!parsed) continue;

        events.push({
          id: tx.transaction,
          ...parsed,
          sender: tx.senderRS ?? "",
          recipient: tx.recipientRS ?? "",
          raw: msg.slice(0, 80),
          timestamp: signumTs(tx.timestamp),
        });
      }
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return events.slice(0, 5);
  } catch {
    return [];
  }
}

export default async function AgentLog() {
  const events = await getAgentEvents();

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base">Agent Communication Log</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--muted)" }}>protocol events · live</span>
          <a href="/log" className="text-xs hover:text-white transition-colors" style={{ color: "var(--muted)" }}>View all →</a>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>No protocol events yet</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => {
            const meta = EVENT_META[ev.type];
            return (
              <a key={ev.id} href={`https://explorer.signum.network/tx/${ev.id}`} target="_blank" rel="noopener noreferrer"
                className="rounded-lg px-3 py-2.5 block transition-colors hover:border-[var(--accent)]/40"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
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
                <div className="text-xs mt-0.5 truncate font-mono" style={{ color: "#6060788", opacity: 0.6 }}>{ev.raw}</div>
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
        Escrow · Identity · Verify · Arbitration events from registered agents
      </div>
    </div>
  );
}
