import AgentsSection from "@/components/AgentsSection";
import ActivitySection from "@/components/ActivitySection";
import StatsBar from "@/components/StatsBar";

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent)" }}>S</div>
          <span className="font-semibold text-lg tracking-tight">SignaAI</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--muted)", background: "var(--card)", border: "1px solid var(--border)" }}>mainnet</span>
        </div>
        <div className="flex items-center gap-4 text-sm" style={{ color: "var(--muted)" }}>
          <a href="https://github.com/folkerds13/signaai" target="_blank" className="hover:text-white transition-colors">GitHub</a>
          <a href="https://pypi.org/project/signaai/" target="_blank" className="hover:text-white transition-colors">PyPI</a>
          <a href="https://pypi.org/project/signaai/" target="_blank" className="text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity" style={{ background: "var(--accent)" }}>
            pip install signaai
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6" style={{ color: "var(--accent)", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--green)" }}></span>
          Live on Signum mainnet
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-5 leading-tight">
          AI Agent Infrastructure<br />
          <span style={{ color: "var(--accent)" }}>on the Blockchain</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--muted)" }}>
          Payments, identity, verifiable outputs, and trustless escrow for AI agents.
          Built on Signum — self-executing smart contracts, fixed fees under $0.0001, live since 2014.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="rounded-xl px-5 py-3 font-mono text-sm" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--green)" }}>
            pip install signaai
          </div>
          <a href="https://github.com/folkerds13/signaai" target="_blank"
            className="px-5 py-3 rounded-xl text-sm transition-colors hover:text-white"
            style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
            View on GitHub →
          </a>
        </div>
      </section>

      {/* Stats Bar */}
      <StatsBar />

      {/* Feature grid */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "💸", title: "Payments", desc: "Agent-to-agent SIGNA transfers. Fixed fee ~$0.00003." },
            { icon: "🪪", title: "Identity", desc: "On-chain agent registry. Reputation from transaction history." },
            { icon: "🔏", title: "Verify", desc: "SHA-256 stamp AI outputs on-chain before delivery." },
            { icon: "🔒", title: "Escrow", desc: "Trustless AT smart contracts. No operator. No trust needed." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl p-5 transition-colors" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold mb-1">{f.title}</div>
              <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Agents + Activity */}
      <section className="px-6 pb-16 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgentsSection />
        <ActivitySection />
      </section>

      {/* Comparison */}
      <section className="px-6 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Why Signum?</h2>
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--muted)" }}>Feature</th>
                <th className="px-5 py-3 font-medium" style={{ color: "var(--accent)" }}>Signum</th>
                <th className="px-5 py-3 font-medium" style={{ color: "var(--muted)" }}>Ethereum / Solana</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Smart contract execution", "Self-executing, no keeper", "Requires external keeper"],
                ["Transaction fee", "~$0.00003 fixed", "Variable, often $1–$50+"],
                ["Energy use", "<0.002% of Bitcoin", "High"],
                ["Running since", "2014", "2015 / 2020"],
                ["Agent payments", "Native, 4-second blocks", "Possible but expensive"],
              ].map(([feature, signum, eth], i) => (
                <tr key={i} style={i < 4 ? { borderBottom: "1px solid var(--border)" } : {}}>
                  <td className="px-5 py-3" style={{ color: "var(--muted)" }}>{feature}</td>
                  <td className="px-5 py-3 text-center" style={{ color: "var(--green)" }}>{signum}</td>
                  <td className="px-5 py-3 text-center" style={{ color: "var(--muted)" }}>{eth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
        <p>SignaAI — AI agent infrastructure on Signum blockchain</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <a href="https://pypi.org/project/signaai/" target="_blank" className="hover:text-white transition-colors">PyPI</a>
          <a href="https://github.com/folkerds13/signaai" target="_blank" className="hover:text-white transition-colors">GitHub</a>
          <a href="https://signum.network" target="_blank" className="hover:text-white transition-colors">Signum</a>
        </div>
      </footer>
    </main>
  );
}
