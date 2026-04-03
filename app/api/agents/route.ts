import { NextResponse } from "next/server";

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

export async function GET() {
  const agents = [];
  const seen = new Set<string>();

  for (const account of REGISTRY_ACCOUNTS) {
    const data = await signumGet({ requestType: "getAliases", account });
    for (const alias of data.aliases ?? []) {
      const uri: string = alias.aliasURI ?? "";
      if (!uri.includes("sig-agent:")) continue;
      if (seen.has(alias.aliasName)) continue;
      seen.add(alias.aliasName);

      let metadata: Record<string, unknown> = {};
      try { metadata = JSON.parse(uri.split("sig-agent:")[1]); } catch {}

      // Get transaction count for reputation
      const txData = await signumGet({
        requestType: "getAccountTransactions",
        account: metadata.address as string || account,
        firstIndex: "0",
        lastIndex: "99",
      });
      const txCount = txData.transactions?.length ?? 0;

      agents.push({
        alias: alias.aliasName,
        name: metadata.name ?? alias.aliasName,
        address: metadata.address ?? "",
        capabilities: metadata.capabilities ?? [],
        description: metadata.description ?? "",
        version: metadata.version ?? "1.0",
        txCount,
      });
    }
  }

  return NextResponse.json({ agents });
}
