import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import {
  G, cardStyle, fmt, inp, sel, btnP,
  Pill, Avatar, DataTable, Spinner
} from "../components/ui.jsx";
import { api } from "../api/client.js";

// ── Payments ──────────────────────────────────────────────
export function PaymentsModule({ dash, expenses, isAdmin, onAddExpense, onRefresh }) {
  if (!dash || !expenses) return <Spinner />;

  async function handleDeleteExpense(id) {
    if (!window.confirm("Delete this expense?")) return;
    try { await api.expenses.delete(id); onRefresh(); }
    catch (e) { alert(e.message); }
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>
        💳 Payments & Finances
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Rice Revenue",    value: fmt(dash.rice_revenue),  color: "#15803d", bg: "#f0fdf4" },
          { label: "Ins. Commission", value: fmt(dash.ins_commission), color: "#1e40af", bg: "#eff6ff" },
          { label: "Total Expenses",  value: fmt(dash.total_expenses), color: "#b91c1c", bg: "#fee2e2" },
          { label: "Net Profit",      value: fmt(dash.net_profit),     color: dash.net_profit >= 0 ? "#15803d" : "#b91c1c", bg: "#f9fafb" },
        ].map(c => (
          <div key={c.label} style={{ ...cardStyle({ background: c.bg, textAlign: "center" }) }}>
            <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{c.label}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontWeight: 700, color: G, fontSize: "0.9rem" }}>Expense Log</span>
        <button style={btnP} onClick={onAddExpense}><Plus size={15} /> Add Expense</button>
      </div>

      <DataTable
        cols={["Description", "Amount", "Category", "Date", ...(isAdmin ? [""] : [])]}
        rows={expenses.map(e => [
          e.description,
          <b style={{ color: "#b91c1c" }}>{fmt(e.amount)}</b>,
          <Pill
            label={e.category}
            bg={e.category === "Stock" ? "#fff7ed" : "#f3f4f6"}
            color={e.category === "Stock" ? "#c2410c" : "#374151"}
            border={e.category === "Stock" ? "#fed7aa" : "#e5e7eb"}
          />,
          e.expense_date,
          ...(isAdmin ? [
            <button
              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }}
              onClick={() => handleDeleteExpense(e.id)}
            >🗑</button>
          ] : []),
        ])}
      />
    </div>
  );
}

// ── Customers ─────────────────────────────────────────────
export function CustomersModule({ customers }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    (customers || []).filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search)
    ), [customers, search]
  );

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>
        👥 Customers
      </h2>

      <div style={{ position: "relative", marginBottom: "1.25rem", maxWidth: "380px" }}>
        <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
        <input
          style={{ ...inp, paddingLeft: "32px" }}
          placeholder="Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {!customers ? <Spinner /> : (
        <DataTable
          cols={["Customer", "Phone", "Type", "Last Order"]}
          rows={filtered.map(c => [
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Avatar name={c.name} size={32} />
              <b style={{ color: G }}>{c.name}</b>
            </div>,
            c.phone,
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {(c.types || []).map(t => (
                <Pill
                  key={t} label={t}
                  bg={t === "Rice" ? "#f0fdf4" : "#eff6ff"}
                  color={t === "Rice" ? "#15803d" : "#1e40af"}
                  border={t === "Rice" ? "#86efac" : "#bfdbfe"}
                />
              ))}
            </div>,
            c.last_order || "—",
          ])}
        />
      )}
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────
export function NotificationsModule({ notifications }) {
  const { AlertTriangle, AlertCircle, Clock, Bell } = {
    AlertTriangle: ({ size }) => <span style={{ fontSize: size }}>⚠️</span>,
    AlertCircle:   ({ size }) => <span style={{ fontSize: size }}>🔴</span>,
    Clock:         ({ size }) => <span style={{ fontSize: size }}>🕐</span>,
    Bell:          ({ size }) => <span style={{ fontSize: size }}>🔔</span>,
  };

  const typeMap = {
    critical: { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
    danger:   { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
    warning:  { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
    info:     { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>
        🔔 Notifications
      </h2>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Critical", count: notifications.filter(n => n.type === "critical").length, ...typeMap.critical },
          { label: "Warnings",  count: notifications.filter(n => n.type === "warning" || n.type === "danger").length, ...typeMap.warning },
          { label: "Info",     count: notifications.filter(n => n.type === "info").length, ...typeMap.info },
        ].map(s => (
          <div key={s.label} style={{ ...cardStyle({ padding: "0.7rem 1.1rem", borderLeft: `3px solid ${s.color}`, display: "flex", alignItems: "center", gap: "0.75rem" }), borderRadius: "0 12px 12px 0" }}>
            <span style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {notifications.length === 0 ? (
        <div style={{ ...cardStyle({ textAlign: "center", color: "#9ca3af", padding: "3rem" }) }}>
          All clear — no alerts right now ✅
        </div>
      ) : (
        notifications.map((n, i) => {
          const ts = typeMap[n.type] || typeMap.info;
          return (
            <div key={i} style={{ background: ts.bg, border: `1.5px solid ${ts.border}`, borderRadius: "10px", padding: "0.9rem 1.1rem", marginBottom: "0.7rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <span style={{ color: ts.color, flexShrink: 0, marginTop: "1px", fontSize: "16px" }}>
                {n.type === "critical" ? "⚠️" : n.type === "danger" ? "🔴" : n.type === "warning" ? "🕐" : "ℹ️"}
              </span>
              <span style={{ fontWeight: 600, color: ts.color, fontSize: "0.875rem", lineHeight: 1.5 }}>{n.msg}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
