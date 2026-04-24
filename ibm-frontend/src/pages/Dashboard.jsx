import { Wheat, ShoppingCart, Shield, Clock, ChevronRight } from "lucide-react";
import { G, cardStyle, fmt, daysUntil, policyBadge, Pill, Spinner } from "../components/ui.jsx";

export default function Dashboard({
  dash, balance, insSummary, sales, policies,
  onGoRice, onGoRenewals, user,
}) {
  if (!dash || !insSummary) return <Spinner />;

  const statCards = [
    {
      icon: <Wheat size={20} />, label: "Rice Stock",
      value: `${balance?.current_stock ?? "—"} kg`,
      sub: (balance?.current_stock ?? 999) < 200 ? "⚠ Low stock" : "In good supply",
      accent: "#2d6a4f", light: "#e8f5ed",
    },
    {
      icon: <ShoppingCart size={20} />, label: "Today's Rice Revenue",
      value: fmt(dash.today_rice_rev),
      sub: `${dash.today_rice_qty} kg sold today`,
      accent: "#c2410c", light: "#fff7ed",
    },
    {
      icon: <Shield size={20} />, label: "Active Policies",
      value: insSummary.active,
      sub: `${insSummary.expired} expired`,
      accent: "#1e40af", light: "#eff6ff",
    },
    {
      icon: <Clock size={20} />, label: "Renewals (30 days)",
      value: insSummary.due_30_days,
      sub: `${insSummary.due_7_days} critical (≤7 days)`,
      accent: "#b91c1c", light: "#fee2e2",
    },
  ];

  const firstName = user?.name?.split(" ")[0] ?? "Irene";

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>
          Good morning, {firstName} 👋
        </h2>
        <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: "0.82rem" }}>
          Here's your business overview
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {statCards.map(c => (
          <div key={c.label} style={{ ...cardStyle(), borderLeft: `4px solid ${c.accent}`, display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <div style={{ background: c.light, borderRadius: "10px", padding: "0.6rem", color: c.accent, flexShrink: 0 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{c.label}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#111827", lineHeight: 1.1, letterSpacing: "-0.02em" }}>{c.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "2px" }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        {/* Recent sales */}
        <div style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 700, color: G, fontSize: "0.9rem" }}>Recent Rice Sales</span>
            <button onClick={onGoRice} style={{ background: "none", border: "none", color: "#2d6a4f", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
              All sales <ChevronRight size={13} />
            </button>
          </div>
          {(sales || []).slice(0, 5).map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: "1px solid #f5f5f3" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1f2937" }}>{s.customer}</div>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{s.qty} kg · {s.sale_date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: G, fontSize: "0.875rem" }}>{fmt(s.total)}</div>
                <div style={{ fontSize: "0.7rem", color: s.method === "M-Pesa" ? "#1d4ed8" : "#6b7280" }}>{s.method}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming renewals */}
        <div style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 700, color: G, fontSize: "0.9rem" }}>Upcoming Renewals</span>
            <button onClick={onGoRenewals} style={{ background: "none", border: "none", color: "#2d6a4f", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
              View all <ChevronRight size={13} />
            </button>
          </div>
          {[...(policies || [])].sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry)).slice(0, 5).map(p => {
            const st = policyBadge(p.expiry);
            return (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: "1px solid #f5f5f3" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1f2937" }}>{p.client}</div>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{p.vehicle} · {p.insurer}</div>
                </div>
                <Pill {...st} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue overview */}
      <div style={cardStyle()}>
        <div style={{ fontWeight: 700, color: G, fontSize: "0.9rem", marginBottom: "1rem" }}>Revenue Overview</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
          {[
            { label: "Rice Revenue",    value: dash.rice_revenue,   color: "#15803d" },
            { label: "Ins. Commission", value: dash.ins_commission,  color: "#1e40af" },
            { label: "Total Expenses",  value: dash.total_expenses,  color: "#b91c1c" },
            { label: "Net Profit",      value: dash.net_profit,      color: dash.net_profit >= 0 ? "#15803d" : "#b91c1c" },
          ].map(r => (
            <div key={r.label} style={{ textAlign: "center", padding: "1rem 0.5rem", background: "#f9fafb", borderRadius: "10px" }}>
              <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{r.label}</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: r.color, letterSpacing: "-0.01em" }}>{fmt(r.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
