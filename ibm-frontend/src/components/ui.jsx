import { X, Loader } from "lucide-react";

export const G = "#1b4332";

export const cardStyle = (extra = {}) => ({
  background: "#fff", borderRadius: "12px", padding: "1.25rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  ...extra,
});

export const inp = {
  width: "100%", padding: "0.6rem 0.8rem",
  border: "1.5px solid #d1d5db", borderRadius: "8px",
  fontSize: "0.875rem", color: "#1f2937",
  boxSizing: "border-box", outline: "none",
  fontFamily: "inherit", background: "#fff",
};
export const sel = { ...inp };
export const btnP = {
  padding: "0.6rem 1.1rem", borderRadius: "8px", border: "none",
  cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
  background: G, color: "#fff", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: "6px",
};
export const btnS = { ...btnP, background: "#f3f4f6", color: "#374151" };

export const fmt       = n => `KSh ${Number(n || 0).toLocaleString()}`;
export const toDay     = () => new Date().toISOString().slice(0, 10);
export const daysUntil = d  => Math.ceil((new Date(d) - new Date()) / 86400000);

export function policyBadge(expiry) {
  const d = daysUntil(expiry);
  if (d <= 0)  return { label: "Expired",    bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" };
  if (d <= 7)  return { label: `${d}d left`, bg: "#fef3c7", color: "#b45309", border: "#fde68a" };
  if (d <= 30) return { label: `${d}d left`, bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
  return              { label: "Active",     bg: "#dcfce7", color: "#15803d", border: "#86efac" };
}

export function Pill({ label, bg, color, border }) {
  return (
    <span style={{
      background: bg, color,
      border: `1px solid ${border || bg}`,
      borderRadius: "999px", padding: "2px 10px",
      fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block", fontSize: "0.72rem", fontWeight: 700,
        color: "#6b7280", marginBottom: "4px",
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>{label}</label>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 2000, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: "14px",
        width: "100%", maxWidth: "500px",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "1.1rem 1.4rem",
          borderBottom: "1px solid #f0f0f0",
        }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: G }}>{title}</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#9ca3af", padding: "4px", display: "flex",
          }}><X size={18} /></button>
        </div>
        <div style={{ padding: "1.4rem" }}>{children}</div>
      </div>
    </div>
  );
}

export function DataTable({ cols, rows }) {
  if (!rows?.length) return (
    <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.85rem",
      border: "1px solid #f0f2f0", borderRadius: "10px" }}>
      No records found
    </div>
  );
  return (
    <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid #f0f2f0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ background: "#f8f9f7" }}>
            {cols.map(c => (
              <th key={c} style={{
                padding: "0.6rem 1rem", textAlign: "left",
                fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.06em",
                whiteSpace: "nowrap",
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderTop: "1px solid #f5f5f3" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "0.7rem 1rem", color: "#374151",
                  verticalAlign: "middle",
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: "4px", marginBottom: "1.5rem",
      background: "#f3f4f6", borderRadius: "10px",
      padding: "4px", width: "fit-content",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: "0.45rem 1rem", borderRadius: "8px",
          border: "none", cursor: "pointer",
          fontWeight: active === t.id ? 700 : 500,
          fontSize: "0.82rem", fontFamily: "inherit",
          background: active === t.id ? G : "transparent",
          color: active === t.id ? "#fff" : "#6b7280",
          transition: "all 0.15s", whiteSpace: "nowrap",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

export function Avatar({ name = "?", size = 34 }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: G, color: "#f0fdf4",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700,
      flexShrink: 0, letterSpacing: "0.02em",
    }}>{initials}</div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <Loader size={24} color={G} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
}

export function ErrMsg({ msg }) {
  return (
    <div style={{
      background: "#fee2e2", color: "#b91c1c",
      borderRadius: "8px", padding: "0.8rem 1rem",
      fontSize: "0.85rem", marginBottom: "1rem",
    }}>{msg}</div>
  );
}
