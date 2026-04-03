const NODE = "https://europe.signum.network";
const ACCOUNTS = ["S-PS4K-2KE2-8LEV-HD2YE", "S-44S7-32XB-5DM5-5AL3K"];
const AT_ADDRESS = "S-FH56-5NA6-E75H-DPAM9";

async function signumGet(params: Record<string, string>) {
  const qs = new URLSearchParams({ requestType: params.requestType, ...params }).toString();
  const res = await fetch(`${NODE}/burst?${qs}`, { next: { revalidate: 60 } });
  return res.json();
}

async function getStats() {
  try {
    const [blockData, atAccountData, ...accountResults] = await Promise.all([
      signumGet({ requestType: "getMiningInfo" }),
      signumGet({ requestType: "getAccount", account: AT_ADDRESS }),
      ...ACCOUNTS.map((account) => signumGet({ requestType: "getAccount", account })),
    ]);

    let atStatus = null;
    if (atAccountData.account) {
      const atData = await signumGet({ requestType: "getAT", at: atAccountData.account });
      atStatus = atData.finished ? "finished" : atData.frozen ? "frozen" : "active";
    }

    return {
      blockHeight: parseInt(blockData.height ?? "0"),
      atStatus,
      atBalance: parseInt(atAccountData.balanceNQT ?? "0") / 100_000_000,
      balances: accountResults.map((r) => parseInt(r.balanceNQT ?? "0") / 100_000_000),
    };
  } catch {
    return null;
  }
}

export default async function StatsBar() {
  const stats = await getStats();

  const items = [
    { label: "Network", value: "Signum Mainnet" },
    { label: "Block Height", value: stats?.blockHeight ? `#${stats.blockHeight.toLocaleString()}` : "—" },
    { label: "AT Contract", value: stats?.atStatus ? stats.atStatus.toUpperCase() : "—" },
    { label: "AT Balance", value: stats?.atBalance != null ? `${stats.atBalance.toFixed(4)} SIGNA` : "—" },
    { label: "Dev Wallet", value: stats?.balances?.[0] != null ? `${stats.balances[0].toFixed(2)} SIGNA` : "—" },
    { label: "Worker Wallet", value: stats?.balances?.[1] != null ? `${stats.balances[1].toFixed(2)} SIGNA` : "—" },
  ];

  return (
    <div className="border-y px-6 py-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <div className="max-w-6xl mx-auto flex items-center gap-6 overflow-x-auto text-xs flex-wrap">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 whitespace-nowrap">
            <span style={{ color: "var(--muted)" }}>{item.label}</span>
            <span className="font-mono font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
