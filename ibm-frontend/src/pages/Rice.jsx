import { useState, useMemo } from "react";
import { Plus, Truck, X } from "lucide-react";
import {
  G, cardStyle, fmt, inp, sel, btnP, btnS,
  Pill, Avatar, TabBar, DataTable, Spinner
} from "../components/ui.jsx";
import { useApi } from "../hooks/useApi.js";
import { api } from "../api/client.js";

export default function RiceModule({
  sales, stockIn, balance, suppliers,
  isAdmin, riceTab, setRiceTab,
  onAddSale, onAddStock, onAddSupplier, onDeleteSale,
}) {
  const [saleFilter, setSaleFilter] = useState({ from: "", to: "", method: "" });
  const { data: report } = useApi(() => api.rice.getReport("all"), []);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter(s => {
      if (saleFilter.from   && s.sale_date < saleFilter.from)  return false;
      if (saleFilter.to     && s.sale_date > saleFilter.to)    return false;
      if (saleFilter.method && s.method    !== saleFilter.method) return false;
      return true;
    });
  }, [sales, saleFilter]);

  const filteredRevenue = filteredSales.reduce((s, e) => s + Number(e.total), 0);
  const lowStock = (balance?.current_stock ?? 999) < 200;

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>
        🌾 Rice Business
      </h2>
      <TabBar
        tabs={[
          { id: "stock",     label: "Stock" },
          { id: "sales",     label: "Sales" },
          { id: "suppliers", label: "Suppliers" },
          { id: "reports",   label: "Reports" },
        ]}
        active={riceTab}
        onChange={setRiceTab}
      />

      {/* ── STOCK ── */}
      {riceTab === "stock" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Total Received",  value: `${balance?.total_received ?? 0} kg`, bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
              { label: "Total Sold",      value: `${balance?.total_sold ?? 0} kg`,      bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
              { label: "Current Balance", value: `${balance?.current_stock ?? 0} kg`,   bg: lowStock ? "#fee2e2" : "#eff6ff", color: lowStock ? "#b91c1c" : "#1e40af", border: lowStock ? "#fca5a5" : "#93c5fd" },
            ].map(s => (
              <div key={s.label} style={{ ...cardStyle({ background: s.bg, border: `2px solid ${s.border}`, textAlign: "center" }) }}>
                <div style={{ fontSize: "0.68rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>{s.label}</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button style={btnP} onClick={onAddStock}><Plus size={15} /> Add Stock</button>
          </div>
          {!stockIn ? <Spinner /> : (
            <DataTable
              cols={["Supplier", "Quantity", "Cost", "Date"]}
              rows={stockIn.map(s => [
                <b style={{ color: G }}>{s.supplier}</b>,
                `${s.qty} kg`, fmt(s.cost), s.stock_date,
              ])}
            />
          )}
        </div>
      )}

      {/* ── SALES ── */}
      {riceTab === "sales" && (
        <div>
          {/* Filters row */}
          <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <input
              style={{ ...inp, width: "145px" }} type="date"
              value={saleFilter.from}
              onChange={e => setSaleFilter(f => ({ ...f, from: e.target.value }))}
            />
            <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>to</span>
            <input
              style={{ ...inp, width: "145px" }} type="date"
              value={saleFilter.to}
              onChange={e => setSaleFilter(f => ({ ...f, to: e.target.value }))}
            />
            <select
              style={{ ...sel, width: "130px" }}
              value={saleFilter.method}
              onChange={e => setSaleFilter(f => ({ ...f, method: e.target.value }))}
            >
              <option value="">All methods</option>
              <option value="Cash">Cash</option>
              <option value="M-Pesa">M-Pesa</option>
            </select>
            {(saleFilter.from || saleFilter.to || saleFilter.method) && (
              <button style={btnS} onClick={() => setSaleFilter({ from: "", to: "", method: "" })}>
                <X size={14} /> Clear
              </button>
            )}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                <b style={{ color: G }}>{filteredSales.length}</b> records ·{" "}
                <b style={{ color: G }}>{fmt(filteredRevenue)}</b>
              </span>
              <button style={btnP} onClick={onAddSale}><Plus size={15} /> Record Sale</button>
            </div>
          </div>

          {!sales ? <Spinner /> : (
            <DataTable
              cols={["Customer", "Qty (kg)", "Price/kg", "Total", "Method", "Date", ...(isAdmin ? [""] : [])]}
              rows={filteredSales.map(s => [
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Avatar name={s.customer} size={28} />
                  <span style={{ fontWeight: 600, color: "#1f2937" }}>{s.customer}</span>
                </div>,
                `${s.qty} kg`,
                fmt(s.ppkg),
                <b style={{ color: G }}>{fmt(s.total)}</b>,
                <Pill
                  label={s.method}
                  bg={s.method === "M-Pesa" ? "#eff6ff" : "#f0fdf4"}
                  color={s.method === "M-Pesa" ? "#1e40af" : "#15803d"}
                  border={s.method === "M-Pesa" ? "#bfdbfe" : "#86efac"}
                />,
                s.sale_date,
                ...(isAdmin ? [
                  <button
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }}
                    onClick={() => onDeleteSale(s.id)}
                  >🗑</button>
                ] : []),
              ])}
            />
          )}
        </div>
      )}

      {/* ── SUPPLIERS ── */}
      {riceTab === "suppliers" && (
        <div>
          {isAdmin && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
              <button style={btnP} onClick={onAddSupplier}><Plus size={15} /> Add Supplier</button>
            </div>
          )}
          {(suppliers || []).map(s => (
            <div key={s.id} style={{ ...cardStyle({ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "1.25rem" }) }}>
              <div style={{ background: "#e8f5ed", borderRadius: "12px", padding: "0.75rem", flexShrink: 0 }}>
                <Truck size={22} color={G} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: G, fontSize: "0.95rem" }}>{s.name}</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "2px" }}>{s.location}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.82rem", color: "#374151", fontWeight: 600 }}>{s.contact}</div>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "2px" }}>{s.terms}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── REPORTS ── */}
      {riceTab === "reports" && !report && <Spinner />}
      {riceTab === "reports" && report && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div style={cardStyle()}>
            <div style={{ fontWeight: 700, color: G, fontSize: "0.9rem", marginBottom: "1rem" }}>Sales by Payment Method</div>
            {(report.by_method || []).map(m => {
              const pct = report.revenue > 0 ? Math.round((m.total / report.revenue) * 100) : 0;
              return (
                <div key={m.method} style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#374151" }}>{m.method}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: m.method === "M-Pesa" ? "#1e40af" : "#15803d" }}>
                      {fmt(m.total)} ({pct}%)
                    </span>
                  </div>
                  <div style={{ background: "#f3f4f6", borderRadius: "999px", height: "8px" }}>
                    <div style={{ background: m.method === "M-Pesa" ? "#3b82f6" : "#22c55e", height: "8px", borderRadius: "999px", width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={cardStyle()}>
            <div style={{ fontWeight: 700, color: G, fontSize: "0.9rem", marginBottom: "1rem" }}>Profitability</div>
            {[
              { label: "Gross Revenue", value: report.revenue,       color: "#15803d" },
              { label: "Stock Cost",    value: report.stock_cost,    color: "#b91c1c" },
              { label: "Gross Profit",  value: report.gross_profit,  color: report.gross_profit >= 0 ? "#15803d" : "#b91c1c", bold: true },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.7rem 0.85rem", background: r.bold ? "#1b4332" : "#f9fafb", borderRadius: "8px", marginBottom: "0.6rem" }}>
                <span style={{ fontWeight: r.bold ? 700 : 600, color: r.bold ? "#a7f3d0" : "#374151", fontSize: "0.875rem" }}>{r.label}</span>
                <span style={{ fontWeight: 800, color: r.bold ? "#fbbf24" : r.color, fontSize: "0.875rem" }}>{fmt(r.value)}</span>
              </div>
            ))}
          </div>

          <div style={cardStyle()}>
            <div style={{ fontWeight: 700, color: G, fontSize: "0.9rem", marginBottom: "1rem" }}>Quick Stats</div>
            {[
              { label: "Total Transactions", value: report.transactions },
              { label: "Total Qty Sold",     value: `${report.qty_sold} kg` },
              { label: "Avg. Price / kg",    value: report.qty_sold > 0 ? fmt(Math.round(report.revenue / report.qty_sold)) : "—" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid #f5f5f3" }}>
                <span style={{ fontSize: "0.82rem", color: "#6b7280", fontWeight: 500 }}>{r.label}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1f2937" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
