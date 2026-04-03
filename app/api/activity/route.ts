import { NextResponse } from "next/server";

const NODE = "https://europe.signum.network";
const SIGNAAI_ADDRESS = "S-PS4K-2KE2-8LEV-HD2YE";
const WORKER_ADDRESS = "S-44S7-32XB-5DM5-5AL3K";

// Signum epoch: Jan 11 2014 02:00:00 UTC
const SIGNUM_EPOCH = new Date("2014-01-11T02:00:00Z").getTime() / 1000;

function signumTs(ts: number): string {
  return new Date((SIGNUM_EPOCH + ts) * 1000).toISOString();
}

async function signumGet(params: Record<string, string>) {
  const qs = new URLSearchParams({ requestType: params.requestType, ...params }).toString();
  const res = await fetch(`${NODE}/burst?${qs}`, { next: { revalidate: 30 } });
  return res.json();
}

export async function GET() {
  const txPromises = [SIGNAAI_ADDRESS, WORKER_ADDRESS].map((account) =>
    signumGet({ requestType: "getAccountTransactions", account, firstIndex: "0", lastIndex: "99" })
  );
  const results = await Promise.all(txPromises);

  const seen = new Set<string>();
  const transactions = [];

  for (const result of results) {
    for (const tx of result.transactions ?? []) {
      if (seen.has(tx.transaction)) continue;
      seen.add(tx.transaction);

      const amountNQT = parseInt(tx.amountNQT ?? "0");
      const msg = tx.attachment?.message ?? "";
      let type = "transfer";
      if (msg.startsWith("ESCROW_")) type = "escrow";
      else if (msg.startsWith("SIGNAAI_AGENT:")) type = "identity";
      else if (msg.startsWith("SIGNAAI_STAMP:")) type = "verify";
      else if (msg.startsWith("ARBIT_")) type = "arbitration";
      else if (amountNQT > 0) type = "transfer";
      else type = "message";

      transactions.push({
        id: tx.transaction,
        type,
        sender: tx.senderRS,
        recipient: tx.recipientRS,
        amount: amountNQT / 100_000_000,
        message: msg.slice(0, 80) || null,
        timestamp: signumTs(tx.timestamp),
        block: tx.block,
        confirmations: tx.confirmations ?? 0,
      });
    }
  }

  transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({ transactions });
}
