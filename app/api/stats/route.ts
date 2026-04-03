import { NextResponse } from "next/server";

const NODE = "https://europe.signum.network";
const ACCOUNTS = ["S-PS4K-2KE2-8LEV-HD2YE", "S-44S7-32XB-5DM5-5AL3K"];
const AT_ADDRESS = "S-FH56-5NA6-E75H-DPAM9";

async function signumGet(params: Record<string, string>) {
  const qs = new URLSearchParams({ requestType: params.requestType, ...params }).toString();
  const res = await fetch(`${NODE}/burst?${qs}`, { next: { revalidate: 60 } });
  return res.json();
}

export async function GET() {
  const [blockData, atAccountData, ...accountResults] = await Promise.all([
    signumGet({ requestType: "getMiningInfo" }),
    signumGet({ requestType: "getAccount", account: AT_ADDRESS }),
    ...ACCOUNTS.map((account) => signumGet({ requestType: "getAccount", account })),
  ]);

  const atNumericId = atAccountData.account;
  let atInfo = null;
  if (atNumericId) {
    const atData = await signumGet({ requestType: "getAT", at: atNumericId });
    atInfo = {
      address: AT_ADDRESS,
      name: atData.name,
      status: atData.finished ? "finished" : atData.frozen ? "frozen" : "active",
      balance: parseInt(atAccountData.balanceNQT ?? "0") / 100_000_000,
    };
  }

  const balances = accountResults.map((r, i) => ({
    address: ACCOUNTS[i],
    balance: parseInt(r.balanceNQT ?? "0") / 100_000_000,
  }));

  return NextResponse.json({
    blockHeight: parseInt(blockData.height ?? "0"),
    atContract: atInfo,
    balances,
    network: "mainnet",
  });
}
