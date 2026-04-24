import { Plus, AlertTriangle, Clock, CheckCircle, Car } from "lucide-react";
import {
  G, cardStyle, fmt, btnP, daysUntil, policyBadge,
  Pill, Avatar, TabBar, DataTable, Spinner
} from "../components/ui.jsx";

export default function InsuranceModule({
  policies, insSummary, isAdmin,
  insTab, setInsTab,
  onAddPolicy, onRenew, onDeletePolicy,
}) {
  if (!policies) return <Spinner />;

  const activePolicies   = policies.filter(p => daysUntil(p.expiry) > 0);
  const expiredPolicies  = policies.filter(p => daysUntil(p.expiry) <= 0);
  const renewalsDue      = policies.filter(p => { const d = daysUntil(p.expiry); return d > 0 && d <= 30; });
  const criticalRenewals = renewalsDue.filter(p => daysUntil(p.expiry) <= 7);

  const sorted = [...policies].sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry));

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>
        🚗 Motor Insurance
      </h2>
      <TabBar
        tabs={[
          { id: "policies", label: "All Policies" },
          { id: "renewals", label: "Renewals 🔔" },
          { id: "clients",  label: "Clients" },
        ]}
        active={insTab}
        onChange={setInsTab}
      />

      {/* ── ALL POLICIES ── */}
      {insTab === "policies" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              <b style={{ color: G }}>{policies.length}</b> total ·{" "}
              <b style={{ color: "#15803d" }}>{activePolicies.length}</b> active ·{" "}
              <b style={{ color: "#b91c1c" }}>{expiredPolicies.length}</b> expired
            </span>
            <button style={btnP} onClick={onAddPolicy}><Plus size={15} /> Add Policy</button>
          </div>
          <DataTable
            cols={["Client", "Phone", "Vehicle", "Insurer", "Expiry", "Premium", "Status", ""]}
            rows={sorted.map(p => {
              const st = policyBadge(p.expiry);
              return [
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Avatar name={p.client} size={28} />
                  <b style={{ color: G }}>{p.client}</b>
                </div>,
                p.phone,
                <b style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.vehicle}</b>,
                p.insurer, p.expiry, fmt(p.premium),
                <Pill {...st} />,
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  {daysUntil(p.expiry) <= 30 && p.status !== "renewed" && (
                    <button
                      style={{ ...btnP, padding: "4px 8px", fontSize: "0.72rem", background: "#15803d" }}
                      onClick={() => onRenew(p.id)}
                    >
                      <CheckCircle size={12} /> Renew
                    </button>
                  )}
                  {p.status === "renewed" && (
                    <Pill label="Renewed" bg="#dcfce7" color="#15803d" border="#86efac" />
                  )}
                  {isAdmin && (
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }}
                      onClick={() => onDeletePolicy(p.id)}
                    >🗑</button>
                  )}
                </div>,
              ];
            })}
          />
        </div>
      )}

      {/* ── RENEWALS ── */}
      {insTab === "renewals" && (
        <div>
          {expiredPolicies.length > 0 && (
            <div style={{ background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: "10px", padding: "0.85rem 1.1rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AlertTriangle size={18} color="#b91c1c" />
              <span style={{ fontWeight: 700, color: "#b91c1c", fontSize: "0.875rem" }}>
                {expiredPolicies.length} policy/policies expired — renewal overdue!
              </span>
            </div>
          )}
          {criticalRenewals.length > 0 && (
            <div style={{ background: "#fef3c7", border: "1.5px solid #fde68a", borderRadius: "10px", padding: "0.85rem 1.1rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Clock size={18} color="#b45309" />
              <span style={{ fontWeight: 700, color: "#b45309", fontSize: "0.875rem" }}>
                {criticalRenewals.length} policy/policies expiring within 7 days — act now!
              </span>
            </div>
          )}

          {sorted.map(p => {
            const st = policyBadge(p.expiry);
            return (
              <div key={p.id} style={{ ...cardStyle({ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: `4px solid ${st.color}`, borderRadius: "0 12px 12px 0" }) }}>
                <div style={{ background: st.bg, borderRadius: "10px", padding: "0.6rem", flexShrink: 0 }}>
                  <Car size={20} color={st.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#1f2937", fontSize: "0.925rem" }}>{p.client}</div>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "2px" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{p.vehicle}</span> · {p.insurer} · {fmt(p.premium)}
                  </div>
                  {p.kra_pin && (
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "2px" }}>KRA: {p.kra_pin}</div>
                  )}
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "2px" }}>
                    📞 {p.phone}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <Pill {...st} />
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "5px" }}>Expires {p.expiry}</div>
                  <div style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600, marginTop: "3px" }}>Comm: {fmt(p.commission)}</div>
                  {p.status !== "renewed" && daysUntil(p.expiry) <= 30 && (
                    <button
                      style={{ ...btnP, padding: "4px 10px", fontSize: "0.72rem", background: "#15803d", marginTop: "6px" }}
                      onClick={() => onRenew(p.id)}
                    >
                      <CheckCircle size={12} /> Mark Renewed
                    </button>
                  )}
                  {p.status === "renewed" && (
                    <div style={{ marginTop: "6px" }}>
                      <Pill label="Renewed ✓" bg="#dcfce7" color="#15803d" border="#86efac" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CLIENTS ── */}
      {insTab === "clients" && (
        <div>
          <DataTable
            cols={["Client", "Phone", "KRA PIN", "Vehicle", "Insurer", "Premium", "Commission"]}
            rows={policies.map(p => [
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Avatar name={p.client} size={28} />
                <b style={{ color: G }}>{p.client}</b>
              </div>,
              p.phone,
              p.kra_pin || "—",
              <span style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600 }}>{p.vehicle}</span>,
              p.insurer,
              fmt(p.premium),
              <span style={{ color: "#15803d", fontWeight: 700 }}>{fmt(p.commission)}</span>,
            ])}
          />
          <div style={{ ...cardStyle({ marginTop: "1rem", background: "#f0fdf4", border: "1.5px solid #86efac" }), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: G, fontSize: "0.9rem" }}>Total Insurance Commission</span>
            <span style={{ fontWeight: 800, color: G, fontSize: "1.1rem" }}>{fmt(insSummary?.total_commission)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
