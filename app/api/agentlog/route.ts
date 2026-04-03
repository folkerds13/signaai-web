import { NextResponse } from "next/server";

const NODE = "https://europe.signum.network";
const ACCOUNTS = ["S-PS4K-2KE2-8LEV-HD2YE", "S-44S7-32XB-5DM5-5AL3K"];
const SIGNUM_EPOCH = new Date("2014-01-11T02:00:00Z").getTime() / 1000;

async function signumGet(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${NODE}/burst?${qs}`);
  return res.json();
}

function signumTs(ts: number) {
  return new Date((SIGNUM_EPOCH + ts) * 1000).toISOString();
}

function parseEvent(msg: string) {
  if (msg.startsWith("ESCROW_")) return { type: "escrow", action: msg.replace("ESCROW_", "").split(":")[0].toLowerCase() };
  if (msg.startsWith("SIGNAAI_AGENT:")) return { type: "identity", action: "register" };
  if (msg.startsWith("SIGNAAI_STAMP:")) return { type: "verify", action: "stamp" };
  if (msg.startsWith("ARBIT_")) return { type: "arbitration", action: msg.replace("ARBIT_", "").split(":")[0].toLowerCase() };
  return null;
}

export async function GET() {
  try {
    const results = await Promise.all(
      ACCOUNTS.map((account) =>
        signumGet({ requestType: "getAccountTransactions", account, firstIndex: "0", lastIndex: "99" })
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
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
