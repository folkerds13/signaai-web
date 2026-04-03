async function getStats() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/stats`, { next: { revalidate: 60 } });
    return res.json();
  } catch {
    return null;
  }
}

export default async function StatsBar() {
  const stats = await getStats();

  const items = [
    { label: "Network", value: "Signum Mainnet" },
    { label: "Block Height", value: stats?.blockHeight ? `#${stats.blockHeight.toLocaleString()}` : "—" },
    { label: "AT Contract", value: stats?.atContract?.status ? stats.atContract.status.toUpperCase() : "—" },
    { label: "AT Balance", value: stats?.atContract?.balance != null ? `${stats.atContract.balance.toFixed(4)} SIGNA` : "—" },
    { label: "Dev Wallet", value: stats?.balances?.[0]?.balance != null ? `${stats.balances[0].balance.toFixed(2)} SIGNA` : "—" },
    { label: "Worker Wallet", value: stats?.balances?.[1]?.balance != null ? `${stats.balances[1].balance.toFixed(2)} SIGNA` : "—" },
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
