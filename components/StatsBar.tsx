const NODE = "https://europe.signum.network";
// S-PS4K-... is the registry / payer agent. S-44S7-... is the worker agent.
const ACCOUNTS = ["S-PS4K-2KE2-8LEV-HD2YE", "S-44S7-32XB-5DM5-5AL3K"];

async function signumGet(params: Record<string, string>) {
  const qs = new URLSearchParams({ requestType: params.requestType, ...params }).toString();
  const res = await fetch(`${NODE}/burst?${qs}`, { next: { revalidate: 60 } });
  return res.json();
}

async function getStats() {
  try {
    const [blockData, ...accountResults] = await Promise.all([
      signumGet({ requestType: "getMiningInfo" }),
      ...ACCOUNTS.map((account) => signumGet({ requestType: "getAccount", account })),
    ]);

    // Count escrow ATs owned by the payer agent
    let escrowCount = 0;
    try {
      const ats = await signumGet({ requestType: "getAccountATs", account: ACCOUNTS[0] });
      escrowCount = (ats.ats ?? []).filter((at: { name?: string }) =>
        (at.name ?? "").startsWith("SIG")
      ).length;
    } catch { /* best-effort */ }

    return {
      blockHeight: parseInt(blockData.height ?? "0"),
      escrowCount,
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
    { label: "Escrows Created", value: stats?.escrowCount != null ? `${stats.escrowCount}` : "—" },
    { label: "Payer Agent", value: stats?.balances?.[0] != null ? `${stats.balances[0].toFixed(2)} SIGNA` : "—" },
    { label: "Worker Agent", value: stats?.balances?.[1] != null ? `${stats.balances[1].toFixed(2)} SIGNA` : "—" },
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
