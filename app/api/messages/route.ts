import { NextResponse } from "next/server";

const NODE = "https://europe.signum.network";
const ACCOUNTS = ["S-PS4K-2KE2-8LEV-HD2YE", "S-44S7-32XB-5DM5-5AL3K"];
const SIGNUM_EPOCH = new Date("2014-01-11T02:00:00Z").getTime() / 1000;
const PROTOCOL_PREFIXES = ["ESCROW_", "SIGNAAI_AGENT:", "SIGNAAI_STAMP:", "ARBIT_"];

async function signumGet(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${NODE}/burst?${qs}`);
  return res.json();
}

function signumTs(ts: number) {
  return new Date((SIGNUM_EPOCH + ts) * 1000).toISOString();
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
    const messages = [];
    for (const result of results) {
      for (const tx of result.transactions ?? []) {
        if (seen.has(tx.transaction)) continue;
        seen.add(tx.transaction);
        const amountNQT = parseInt(tx.amountNQT ?? "0");
        const msg: string = tx.attachment?.message ?? "";
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
    const rawCounts = results.map((r) => r.transactions?.length ?? 0);
    const hasMore = rawCounts.some((c) => c >= 100);
    return NextResponse.json({ messages, hasMore, nextOffset: offset + 100 });
  } catch {
    return NextResponse.json({ messages: [], hasMore: false, nextOffset: 0 });
  }
}
