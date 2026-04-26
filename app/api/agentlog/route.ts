import { NextResponse } from "next/server";

const NODE = "https://europe.signum.network";
const ACCOUNTS = ["S-PS4K-2KE2-8LEV-HD2YE", "S-44S7-32XB-5DM5-5AL3K"];
const SIGNUM_EPOCH = new Date("2014-08-11T02:00:00Z").getTime() / 1000;

async function signumGet(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${NODE}/burst?${qs}`);
  return res.json();
}

function signumTs(ts: number) {
  return new Date((SIGNUM_EPOCH + ts) * 1000).toISOString();
}

function redactRaw(msg: string): string {
  let out = msg.replace(/\|TG:[^\s]*/g, "").trim();
  out = out.replace(/\d{8,10}:AA[A-Za-z0-9_\-]{30,}/g, "[redacted]");
  return out;
}

function parseEvent(msg: string) {
  // Current protocol prefixes (v1)
  if (msg.startsWith("ESCROW:")) {
    const action = msg.slice("ESCROW:".length).split(":")[0].toLowerCase();
    return { type: "escrow", action };
  }
  if (msg.startsWith("SIGPROOF:")) return { type: "verify", action: "stamp" };
  if (msg.startsWith("TASK_COMPLETE:")) return { type: "identity", action: "reputation" };
  if (msg.startsWith("AGENT:v1:register")) return { type: "identity", action: "register" };
  if (msg.startsWith("ARBIT_")) {
    const action = msg.replace("ARBIT_", "").split(":")[0].toLowerCase();
    return { type: "arbitration", action };
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const firstIndex = String(offset);
    const lastIndex = String(offset + 99);

    const results = await Promise.all(
      ACCOUNTS.map((account) =>
        signumGet({ requestType: "getAccountTransactions", account, firstIndex, lastIndex })
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
          raw: redactRaw(msg).slice(0, 80),
          timestamp: signumTs(tx.timestamp),
        });
      }
    }
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const rawCounts = results.map((r) => r.transactions?.length ?? 0);
    const hasMore = rawCounts.some((c) => c >= 100);
    return NextResponse.json({ events, hasMore, nextOffset: offset + 100 });
  } catch {
    return NextResponse.json({ events: [], hasMore: false, nextOffset: 0 });
  }
}
