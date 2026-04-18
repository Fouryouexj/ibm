import { useState, useMemo, useCallback } from "react";
import {
  LayoutDashboard, Wheat, Car, CreditCard, Users, Bell,
  Plus, Search, LogOut, AlertTriangle, CheckCircle,
  Clock, X, Menu, Phone, Truck, RefreshCw,
  AlertCircle, Shield, ChevronRight,
  ArrowDown, ShoppingCart, Leaf, Loader, Trash2, Edit2
} from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { useApi, useMutation } from "./hooks/useApi.js";
import { api } from "./api/client.js";

// ─── Helpers ──────────────────────────────────────────────
const fmt        = n  => `KSh ${Number(n || 0).toLocaleString()}`;
const today      = () => new Date().toISOString().slice(0, 10);
const daysUntil  = d  => Math.ceil((new Date(d) - new Date()) / 86400000);

function policyBadge(expiry) {
  const d = daysUntil(expiry);
  if (d <= 0)  return { label: "Expired",    bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" };
  if (d <= 7)  return { label: `${d}d left`, bg: "#fef3c7", color: "#b45309", border: "#fde68a" };
  if (d <= 30) return { label: `${d}d left`, bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
  return              { label: "Active",     bg: "#dcfce7", color: "#15803d", border: "#86efac" };
}

// ─── Style constants ──────────────────────────────────────
const G = "#1b4332";

const cardStyle = (extra = {}) => ({
  background: "#fff", borderRadius: "12px", padding: "1.25rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  ...extra,
});
const inp = {
  width: "100%", padding: "0.6rem 0.8rem",
  border: "1.5px solid #d1d5db", borderRadius: "8px",
  fontSize: "0.875rem", color: "#1f2937",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit", background: "#fff",
};
const sel  = { ...inp };
const btnP = {
  padding: "0.6rem 1.1rem", borderRadius: "8px", border: "none",
  cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
  background: G, color: "#fff", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: "6px",
};
const btnS = { ...btnP, background: "#f3f4f6", color: "#374151" };
const btnD = { ...btnP, background: "#fee2e2", color: "#b91c1c" };

// ─── Shared UI components ─────────────────────────────────
function Pill({ label, bg, color, border }) {
  return (
    <span style={{
      background: bg, color, border: `1px solid ${border || bg}`,
      borderRadius: "999px", padding: "2px 10px",
      fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}
function Field({ label, children }) {
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
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 2000, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: "14px", width: "100%", maxWidth: "500px",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.1rem 1.4rem", borderBottom: "1px solid #f0f0f0",
        }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: G }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "1.4rem" }}>{children}</div>
      </div>
    </div>
  );
}
function DataTable({ cols, rows }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid #f0f2f0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ background: "#f8f9f7" }}>
            {cols.map(c => (
              <th key={c} style={{
                padding: "0.6rem 1rem", textAlign: "left",
                fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderTop: "1px solid #f5f5f3" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: "0.7rem 1rem", color: "#374151", verticalAlign: "middle" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: "4px", marginBottom: "1.5rem",
      background: "#f3f4f6", borderRadius: "10px", padding: "4px", width: "fit-content",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: "0.45rem 1rem", borderRadius: "8px", border: "none", cursor: "pointer",
          fontWeight: active === t.id ? 700 : 500, fontSize: "0.82rem", fontFamily: "inherit",
          background: active === t.id ? G : "transparent",
          color: active === t.id ? "#fff" : "#6b7280", transition: "all 0.15s", whiteSpace: "nowrap",
        }}>{t.label}</button>
      ))}
    </div>
  );
}
function Avatar({ name = "?", size = 34 }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: G, color: "#f0fdf4",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0, letterSpacing: "0.02em",
    }}>{initials}</div>
  );
}
function Spinner() {
  return <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Loader size={24} color={G} style={{ animation: "spin 1s linear infinite" }} /></div>;
}
function ErrMsg({ msg }) {
  return <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", padding: "0.8rem 1rem", fontSize: "0.85rem", marginBottom: "1rem" }}>{msg}</div>;
}

// ─── Login screen ─────────────────────────────────────────
function LoginScreen() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState("irene@ibm.local");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    try {
      await login(email, password);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(145deg, ${G} 0%, #2d6a4f 55%, #1a3a2a 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Outfit', 'Segoe UI', sans-serif", padding: "1rem",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'); @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        background: "rgba(255,255,255,0.97)", borderRadius: "20px",
        padding: "2.5rem 2.25rem", width: "100%", maxWidth: "390px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: G, borderRadius: "14px", padding: "12px 18px", marginBottom: "1.1rem" }}>
            <Leaf size={22} color="#f59e0b" strokeWidth={2.5} />
            <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.02em" }}>IBM</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.5rem", color: G, lineHeight: 1.15, letterSpacing: "-0.02em" }}>Irene Business</div>
          <div style={{ fontWeight: 800, fontSize: "1.5rem", color: G, lineHeight: 1.15, letterSpacing: "-0.02em" }}>Manager</div>
          <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "0.5rem", fontWeight: 500 }}>Rice &amp; Motor Insurance System</div>
        </div>

        {error && <ErrMsg msg={error} />}

        <Field label="Email">
          <input style={inp} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </Field>
        <Field label="Password">
          <input style={inp} type="password" placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </Field>

        <button style={{ ...btnP, width: "100%", justifyContent: "center", padding: "0.8rem", fontSize: "1rem", marginTop: "0.5rem", borderRadius: "10px", opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin} disabled={loading}>
          {loading ? <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Sign In →"}
        </button>
        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9ca3af", marginTop: "1rem", marginBottom: 0 }}>
          Admin: irene@ibm.local · Staff: staff@ibm.local
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN APP  (requires auth)
// ═══════════════════════════════════════════════════════════
function AppShell() {
  const { user, logout } = useAuth();

  // ── Navigation ──────────────────────────────────────────
  const [page,     setPage]     = useState("dashboard");
  const [riceTab,  setRiceTab]  = useState("stock");
  const [insTab,   setInsTab]   = useState("policies");
  const [sideOpen, setSideOpen] = useState(true);

  // ── Modal ───────────────────────────────────────────────
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [formErr,  setFormErr]  = useState("");
  const setF       = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const closeModal = () => { setModal(null); setForm({}); setFormErr(""); };

  // ── Global data fetches ─────────────────────────────────
  const { data: dash,      refetch: refetchDash }      = useApi(() => api.dashboard.get(), []);
  const { data: sales,     refetch: refetchSales }     = useApi(() => api.rice.getSales(), []);
  const { data: stockIn,   refetch: refetchStock }     = useApi(() => api.rice.getStock(), []);
  const { data: balance,   refetch: refetchBalance }   = useApi(() => api.rice.getBalance(), []);
  const { data: suppliers, refetch: refetchSuppliers } = useApi(() => api.rice.getSuppliers(), []);
  const { data: policies,  refetch: refetchPolicies }  = useApi(() => api.insurance.getPolicies(), []);
  const { data: insSummary,refetch: refetchInsSummary }= useApi(() => api.insurance.getSummary(), []);
  const { data: expenses,  refetch: refetchExpenses }  = useApi(() => api.expenses.getAll(), []);
  const { data: customers, refetch: refetchCustomers } = useApi(() => api.customers.getAll(), []);

  // ── Mutations ───────────────────────────────────────────
  const createSale     = useMutation(body => api.rice.createSale(body));
  const deleteSale     = useMutation(id   => api.rice.deleteSale(id));
  const addStock       = useMutation(body => api.rice.addStock(body));
  const createSupplier = useMutation(body => api.rice.createSupplier(body));
  const createPolicy   = useMutation(body => api.insurance.createPolicy(body));
  const renewPolicy    = useMutation(id   => api.insurance.markRenewed(id));
  const deletePolicy   = useMutation(id   => api.insurance.deletePolicy(id));
  const createExpense  = useMutation(body => api.expenses.create(body));

  // ── Computed notifications from live data ───────────────
  const notifications = useMemo(() => {
    if (!policies || !balance) return [];
    const list = [];
    const critical = policies.filter(p => { const d = daysUntil(p.expiry); return d > 0 && d <= 7; });
    const expired  = policies.filter(p => daysUntil(p.expiry) <= 0);
    const due30    = policies.filter(p => { const d = daysUntil(p.expiry); return d > 7 && d <= 30; });
    critical.forEach(p => list.push({ type: "critical", msg: `URGENT: ${p.client}'s ${p.vehicle} expires in ${daysUntil(p.expiry)} day(s)` }));
    expired.forEach( p => list.push({ type: "danger",   msg: `EXPIRED: ${p.client}'s policy (${p.vehicle}) is overdue` }));
    due30.forEach(   p => list.push({ type: "warning",  msg: `Renewal due: ${p.client}'s ${p.vehicle} expires in ${daysUntil(p.expiry)} days` }));
    if (balance?.current_stock < 200) list.push({ type: "warning", msg: `Low stock alert: Only ${balance.current_stock} kg of rice remaining` });
    return list;
  }, [policies, balance]);

  const alertCount = notifications.filter(n => n.type !== "info").length;
  const isAdmin    = user?.role === "admin";

  // ── Refetch everything after mutation ───────────────────
  function refetchAll() {
    refetchDash(); refetchSales(); refetchStock(); refetchBalance();
    refetchSuppliers(); refetchPolicies(); refetchInsSummary();
    refetchExpenses(); refetchCustomers();
  }

  // ── Submit handlers ─────────────────────────────────────
  async function submitSale() {
    if (!form.customer || !form.qty || !form.ppkg) { setFormErr("All fields required"); return; }
    try {
      await createSale.mutate({ customer: form.customer, qty: form.qty, ppkg: form.ppkg, method: form.method || "Cash", sale_date: today() });
      refetchSales(); refetchBalance(); refetchDash(); closeModal();
    } catch (e) { setFormErr(e.message); }
  }

  async function submitStock() {
    if (!form.supplier || !form.qty || !form.cost) { setFormErr("All fields required"); return; }
    try {
      await addStock.mutate({ supplier: form.supplier, qty: form.qty, cost: form.cost, stock_date: today() });
      refetchStock(); refetchBalance(); refetchDash(); closeModal();
    } catch (e) { setFormErr(e.message); }
  }

  async function submitPolicy() {
    if (!form.client || !form.vehicle || !form.expiry) { setFormErr("Client, vehicle and expiry required"); return; }
    try {
      await createPolicy.mutate({ client: form.client, phone: form.phone, kra_pin: form.kra_pin, vehicle: form.vehicle, insurer: form.insurer, expiry: form.expiry, premium: form.premium });
      refetchPolicies(); refetchInsSummary(); refetchDash(); closeModal();
    } catch (e) { setFormErr(e.message); }
  }

  async function submitSupplier() {
    if (!form.name) { setFormErr("Supplier name required"); return; }
    try {
      await createSupplier.mutate({ name: form.name, contact: form.contact, location: form.location, terms: form.terms });
      refetchSuppliers(); closeModal();
    } catch (e) { setFormErr(e.message); }
  }

  async function submitExpense() {
    if (!form.description || !form.amount) { setFormErr("Description and amount required"); return; }
    try {
      await createExpense.mutate({ description: form.description, amount: form.amount, category: form.category || "Operations", expense_date: today() });
      refetchExpenses(); refetchDash(); closeModal();
    } catch (e) { setFormErr(e.message); }
  }

  async function handleRenew(id) {
    try { await renewPolicy.mutate(id); refetchPolicies(); refetchInsSummary(); refetchDash(); }
    catch (e) { alert(e.message); }
  }

  async function handleDeleteSale(id) {
    if (!window.confirm("Delete this sale?")) return;
    try { await deleteSale.mutate(id); refetchSales(); refetchBalance(); refetchDash(); }
    catch (e) { alert(e.message); }
  }

  async function handleDeletePolicy(id) {
    if (!window.confirm("Delete this policy?")) return;
    try { await deletePolicy.mutate(id); refetchPolicies(); refetchInsSummary(); refetchDash(); }
    catch (e) { alert(e.message); }
  }

  // ── Nav ─────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard",     icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { id: "rice",          icon: <Wheat size={18} />,           label: "Rice Business" },
    { id: "insurance",     icon: <Car size={18} />,             label: "Insurance" },
    { id: "payments",      icon: <CreditCard size={18} />,      label: "Payments" },
    { id: "customers",     icon: <Users size={18} />,           label: "Customers" },
    { id: "notifications", icon: <Bell size={18} />,            label: "Notifications", badge: alertCount },
  ];
  const sideW = sideOpen ? 230 : 62;

  // ════════════════════════════════════════════════════════
  //  PAGE: DASHBOARD
  // ════════════════════════════════════════════════════════
  function Dashboard() {
    if (!dash || !insSummary) return <Spinner />;
    const statCards = [
      { icon: <Wheat size={20} />,       label: "Rice Stock",          value: `${balance?.current_stock ?? "—"} kg`, sub: (balance?.current_stock ?? 999) < 200 ? "⚠ Low stock" : "In good supply", accent: "#2d6a4f", light: "#e8f5ed" },
      { icon: <ShoppingCart size={20} />,label: "Today's Rice Revenue", value: fmt(dash.today_rice_rev),              sub: `${dash.today_rice_qty} kg sold today`,                                    accent: "#c2410c", light: "#fff7ed" },
      { icon: <Shield size={20} />,      label: "Active Policies",      value: insSummary.active,                      sub: `${insSummary.expired} expired`,                                            accent: "#1e40af", light: "#eff6ff" },
      { icon: <Clock size={20} />,       label: "Renewals (30 days)",   value: insSummary.due_30_days,                 sub: `${insSummary.due_7_days} critical (≤7 days)`,                              accent: "#b91c1c", light: "#fee2e2" },
    ];
    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>Good morning, {user?.name?.split(" ")[0]} 👋</h2>
          <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: "0.82rem" }}>Here's your business overview</p>
        </div>

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
          <div style={cardStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontWeight: 700, color: G, fontSize: "0.9rem" }}>Recent Rice Sales</span>
              <button onClick={() => setPage("rice")} style={{ background: "none", border: "none", color: "#2d6a4f", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>All sales <ChevronRight size={13} /></button>
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

          <div style={cardStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontWeight: 700, color: G, fontSize: "0.9rem" }}>Upcoming Renewals</span>
              <button onClick={() => { setPage("insurance"); setInsTab("renewals"); }} style={{ background: "none", border: "none", color: "#2d6a4f", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>View all <ChevronRight size={13} /></button>
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

  // ════════════════════════════════════════════════════════
  //  PAGE: RICE
  // ════════════════════════════════════════════════════════
  function RiceModule() {
    const [saleFilter, setSaleFilter] = useState({ from: "", to: "", method: "" });
    const { data: report } = useApi(() => api.rice.getReport("all"), []);

    const filteredSales = useMemo(() => {
      if (!sales) return [];
      return sales.filter(s => {
        if (saleFilter.from   && s.sale_date < saleFilter.from)   return false;
        if (saleFilter.to     && s.sale_date > saleFilter.to)     return false;
        if (saleFilter.method && s.method !== saleFilter.method)  return false;
        return true;
      });
    }, [sales, saleFilter]);

    const totalRiceRev = (filteredSales || []).reduce((s, e) => s + Number(e.total), 0);

    return (
      <div>
        <h2 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>🌾 Rice Business</h2>
        <TabBar tabs={[{ id: "stock", label: "Stock" }, { id: "sales", label: "Sales" }, { id: "suppliers", label: "Suppliers" }, { id: "reports", label: "Reports" }]} active={riceTab} onChange={setRiceTab} />

        {/* STOCK */}
        {riceTab === "stock" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { label: "Total Received",  value: `${balance?.total_received ?? 0} kg`, bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
                { label: "Total Sold",      value: `${balance?.total_sold ?? 0} kg`,     bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
                { label: "Current Balance", value: `${balance?.current_stock ?? 0} kg`,  bg: (balance?.current_stock ?? 999) < 200 ? "#fee2e2" : "#eff6ff", color: (balance?.current_stock ?? 999) < 200 ? "#b91c1c" : "#1e40af", border: (balance?.current_stock ?? 999) < 200 ? "#fca5a5" : "#93c5fd" },
              ].map(s => (
                <div key={s.label} style={{ ...cardStyle({ background: s.bg, border: `2px solid ${s.border}`, textAlign: "center" }) }}>
                  <div style={{ fontSize: "0.68rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>{s.label}</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
              <button style={btnP} onClick={() => setModal("addStock")}><Plus size={15} /> Add Stock</button>
            </div>
            {!stockIn ? <Spinner /> : (
              <DataTable
                cols={["Supplier", "Quantity", "Cost", "Date"]}
                rows={(stockIn || []).map(s => [
                  <b style={{ color: G }}>{s.supplier}</b>,
                  `${s.qty} kg`, fmt(s.cost), s.stock_date
                ])}
              />
            )}
          </div>
        )}

        {/* SALES */}
        {riceTab === "sales" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flex: 1 }}>
                <input style={{ ...inp, width: "140px" }} type="date" value={saleFilter.from} onChange={e => setSaleFilter(f => ({ ...f, from: e.target.value }))} placeholder="From" />
                <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>to</span>
                <input style={{ ...inp, width: "140px" }} type="date" value={saleFilter.to} onChange={e => setSaleFilter(f => ({ ...f, to: e.target.value }))} />
                <select style={{ ...sel, width: "130px" }} value={saleFilter.method} onChange={e => setSaleFilter(f => ({ ...f, method: e.target.value }))}>
                  <option value="">All methods</option>
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                </select>
                {(saleFilter.from || saleFilter.to || saleFilter.method) && (
                  <button style={btnS} onClick={() => setSaleFilter({ from: "", to: "", method: "" })}><X size={14} /> Clear</button>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  <b style={{ color: G }}>{filteredSales.length}</b> records · <b style={{ color: G }}>{fmt(totalRiceRev)}</b>
                </span>
                <button style={btnP} onClick={() => setModal("addSale")}><Plus size={15} /> Record Sale</button>
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
                  `${s.qty} kg`, fmt(s.ppkg),
                  <b style={{ color: G }}>{fmt(s.total)}</b>,
                  <Pill label={s.method} bg={s.method === "M-Pesa" ? "#eff6ff" : "#f0fdf4"} color={s.method === "M-Pesa" ? "#1e40af" : "#15803d"} border={s.method === "M-Pesa" ? "#bfdbfe" : "#86efac"} />,
                  s.sale_date,
                  ...(isAdmin ? [<button style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }} onClick={() => handleDeleteSale(s.id)}><Trash2 size={14} /></button>] : [])
                ])}
              />
            )}
          </div>
        )}

        {/* SUPPLIERS */}
        {riceTab === "suppliers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
              {isAdmin && <button style={btnP} onClick={() => setModal("addSupplier")}><Plus size={15} /> Add Supplier</button>}
            </div>
            {(suppliers || []).map(s => (
              <div key={s.id} style={{ ...cardStyle({ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "1.25rem" }) }}>
                <div style={{ background: "#e8f5ed", borderRadius: "12px", padding: "0.75rem", flexShrink: 0 }}><Truck size={22} color={G} /></div>
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

        {/* REPORTS */}
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
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: m.method === "M-Pesa" ? "#1e40af" : "#15803d" }}>{fmt(m.total)} ({pct}%)</span>
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
                { label: "Gross Revenue", value: report.revenue,      color: "#15803d" },
                { label: "Stock Cost",    value: report.stock_cost,   color: "#b91c1c" },
                { label: "Gross Profit",  value: report.gross_profit, color: report.gross_profit >= 0 ? "#15803d" : "#b91c1c", bold: true },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.7rem 0.85rem", background: r.bold ? "#1b4332" : "#f9fafb", borderRadius: "8px", marginBottom: "0.6rem" }}>
                  <span style={{ fontWeight: r.bold ? 700 : 600, color: r.bold ? "#a7f3d0" : "#374151", fontSize: "0.875rem" }}>{r.label}</span>
                  <span style={{ fontWeight: 800, color: r.bold ? "#fbbf24" : r.color, fontSize: "0.875rem" }}>{fmt(r.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  //  PAGE: INSURANCE
  // ════════════════════════════════════════════════════════
  function InsuranceModule() {
    if (!policies) return <Spinner />;
    const activePolicies  = policies.filter(p => daysUntil(p.expiry) > 0);
    const expiredPolicies = policies.filter(p => daysUntil(p.expiry) <= 0);
    const renewalsDue     = policies.filter(p => { const d = daysUntil(p.expiry); return d > 0 && d <= 30; });
    const criticalRenewals = renewalsDue.filter(p => daysUntil(p.expiry) <= 7);

    return (
      <div>
        <h2 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>🚗 Motor Insurance</h2>
        <TabBar tabs={[{ id: "policies", label: "All Policies" }, { id: "renewals", label: `Renewals 🔔` }, { id: "clients", label: "Clients" }]} active={insTab} onChange={setInsTab} />

        {insTab === "policies" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                <b style={{ color: G }}>{policies.length}</b> total · <b style={{ color: "#15803d" }}>{activePolicies.length}</b> active · <b style={{ color: "#b91c1c" }}>{expiredPolicies.length}</b> expired
              </span>
              <button style={btnP} onClick={() => setModal("addPolicy")}><Plus size={15} /> Add Policy</button>
            </div>
            <DataTable
              cols={["Client", "Phone", "Vehicle", "Insurer", "Expiry", "Premium", "Status", ""]}
              rows={[...policies].sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry)).map(p => {
                const st = policyBadge(p.expiry);
                return [
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Avatar name={p.client} size={28} /><b style={{ color: G }}>{p.client}</b></div>,
                  p.phone,
                  <b style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.vehicle}</b>,
                  p.insurer, p.expiry, fmt(p.premium), <Pill {...st} />,
                  <div style={{ display: "flex", gap: "4px" }}>
                    {daysUntil(p.expiry) <= 30 && p.status !== "renewed" && (
                      <button style={{ ...btnP, padding: "4px 8px", fontSize: "0.72rem", background: "#15803d" }} onClick={() => handleRenew(p.id)}>
                        <CheckCircle size={12} /> Renew
                      </button>
                    )}
                    {isAdmin && (
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }} onClick={() => handleDeletePolicy(p.id)}><Trash2 size={14} /></button>
                    )}
                  </div>
                ];
              })}
            />
          </div>
        )}

        {insTab === "renewals" && (
          <div>
            {expiredPolicies.length > 0 && (
              <div style={{ background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: "10px", padding: "0.85rem 1.1rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <AlertTriangle size={18} color="#b91c1c" />
                <span style={{ fontWeight: 700, color: "#b91c1c", fontSize: "0.875rem" }}>{expiredPolicies.length} policy/policies expired — renewal overdue!</span>
              </div>
            )}
            {criticalRenewals.length > 0 && (
              <div style={{ background: "#fef3c7", border: "1.5px solid #fde68a", borderRadius: "10px", padding: "0.85rem 1.1rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Clock size={18} color="#b45309" />
                <span style={{ fontWeight: 700, color: "#b45309", fontSize: "0.875rem" }}>{criticalRenewals.length} policy/policies expiring within 7 days — act now!</span>
              </div>
            )}
            {[...policies].sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry)).map(p => {
              const st = policyBadge(p.expiry);
              return (
                <div key={p.id} style={{ ...cardStyle({ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: `4px solid ${st.color}`, borderRadius: "0 12px 12px 0" }) }}>
                  <div style={{ background: st.bg, borderRadius: "10px", padding: "0.6rem", flexShrink: 0 }}><Car size={20} color={st.color} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#1f2937", fontSize: "0.925rem" }}>{p.client}</div>
                    <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "2px" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{p.vehicle}</span> · {p.insurer} · {fmt(p.premium)}
                    </div>
                    {p.kra_pin && <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "2px" }}>KRA: {p.kra_pin}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <Pill {...st} />
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "5px" }}>Expires {p.expiry}</div>
                    <div style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600, marginTop: "3px" }}>Comm: {fmt(p.commission)}</div>
                    {p.status !== "renewed" && daysUntil(p.expiry) <= 30 && (
                      <button style={{ ...btnP, padding: "4px 10px", fontSize: "0.72rem", background: "#15803d", marginTop: "6px" }} onClick={() => handleRenew(p.id)}>
                        <CheckCircle size={12} /> Mark Renewed
                      </button>
                    )}
                    {p.status === "renewed" && <Pill label="Renewed" bg="#dcfce7" color="#15803d" border="#86efac" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {insTab === "clients" && (
          <div>
            <DataTable
              cols={["Client", "Phone", "KRA PIN", "Vehicle", "Insurer", "Premium", "Commission"]}
              rows={policies.map(p => [
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Avatar name={p.client} size={28} /><b style={{ color: G }}>{p.client}</b></div>,
                p.phone, p.kra_pin || "—",
                <span style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600 }}>{p.vehicle}</span>,
                p.insurer, fmt(p.premium),
                <span style={{ color: "#15803d", fontWeight: 700 }}>{fmt(p.commission)}</span>
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

  // ════════════════════════════════════════════════════════
  //  PAGE: PAYMENTS
  // ════════════════════════════════════════════════════════
  function PaymentsModule() {
    if (!dash || !expenses) return <Spinner />;
    return (
      <div>
        <h2 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>💳 Payments & Finances</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Rice Revenue",    value: fmt(dash.rice_revenue),   color: "#15803d", bg: "#f0fdf4" },
            { label: "Ins. Commission", value: fmt(dash.ins_commission),  color: "#1e40af", bg: "#eff6ff" },
            { label: "Total Expenses",  value: fmt(dash.total_expenses),  color: "#b91c1c", bg: "#fee2e2" },
            { label: "Net Profit",      value: fmt(dash.net_profit),      color: dash.net_profit >= 0 ? "#15803d" : "#b91c1c", bg: "#f9fafb" },
          ].map(c => (
            <div key={c.label} style={{ ...cardStyle({ background: c.bg, textAlign: "center" }) }}>
              <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{c.label}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ fontWeight: 700, color: G, fontSize: "0.9rem" }}>Expense Log</span>
          <button style={btnP} onClick={() => setModal("addExpense")}><Plus size={15} /> Add Expense</button>
        </div>
        <DataTable
          cols={["Description", "Amount", "Category", "Date", ...(isAdmin ? [""] : [])]}
          rows={(expenses || []).map(e => [
            e.description, <b style={{ color: "#b91c1c" }}>{fmt(e.amount)}</b>,
            <Pill label={e.category} bg={e.category === "Stock" ? "#fff7ed" : "#f3f4f6"} color={e.category === "Stock" ? "#c2410c" : "#374151"} border={e.category === "Stock" ? "#fed7aa" : "#e5e7eb"} />,
            e.expense_date,
            ...(isAdmin ? [<button style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }} onClick={async () => {
              if (!window.confirm("Delete this expense?")) return;
              try { await api.expenses.delete(e.id); refetchExpenses(); refetchDash(); }
              catch (err) { alert(err.message); }
            }}><Trash2 size={14} /></button>] : [])
          ])}
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  //  PAGE: CUSTOMERS
  // ════════════════════════════════════════════════════════
  function CustomersModule() {
    const [search, setSearch] = useState("");
    const filtered = useMemo(() =>
      (customers || []).filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || "").includes(search)
      ), [search]);

    return (
      <div>
        <h2 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>👥 Customers</h2>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input style={{ ...inp, paddingLeft: "32px" }} placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {!customers ? <Spinner /> : (
          <DataTable
            cols={["Customer", "Phone", "Type", "Last Order"]}
            rows={filtered.map(c => [
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><Avatar name={c.name} size={32} /><b style={{ color: G }}>{c.name}</b></div>,
              c.phone,
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {(c.types || []).map(t => <Pill key={t} label={t} bg={t === "Rice" ? "#f0fdf4" : "#eff6ff"} color={t === "Rice" ? "#15803d" : "#1e40af"} border={t === "Rice" ? "#86efac" : "#bfdbfe"} />)}
              </div>,
              c.last_order || "—"
            ])}
          />
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  //  PAGE: NOTIFICATIONS
  // ════════════════════════════════════════════════════════
  function NotificationsModule() {
    const typeMap = {
      critical: { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5", icon: <AlertTriangle size={17} /> },
      danger:   { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5", icon: <AlertCircle size={17} /> },
      warning:  { bg: "#fef3c7", color: "#b45309", border: "#fde68a", icon: <Clock size={17} /> },
      info:     { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", icon: <Bell size={17} /> },
    };
    return (
      <div>
        <h2 style={{ margin: "0 0 1.25rem", fontWeight: 800, fontSize: "1.35rem", color: G, letterSpacing: "-0.02em" }}>🔔 Notifications</h2>
        {notifications.length === 0
          ? <div style={cardStyle({ textAlign: "center", color: "#9ca3af", padding: "3rem" })}>All clear — no alerts right now</div>
          : notifications.map((n, i) => {
            const ts = typeMap[n.type] || typeMap.info;
            return (
              <div key={i} style={{ background: ts.bg, border: `1.5px solid ${ts.border}`, borderRadius: "10px", padding: "0.9rem 1.1rem", marginBottom: "0.7rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <span style={{ color: ts.color, flexShrink: 0, marginTop: "1px" }}>{ts.icon}</span>
                <span style={{ fontWeight: 600, color: ts.color, fontSize: "0.875rem", lineHeight: 1.5 }}>{n.msg}</span>
              </div>
            );
          })}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  //  MODALS
  // ════════════════════════════════════════════════════════
  function Modals() {
    if (!modal) return null;
    const saving = createSale.loading || addStock.loading || createPolicy.loading || createSupplier.loading || createExpense.loading;

    if (modal === "addSale") return (
      <Modal title="Record Rice Sale" onClose={closeModal}>
        {formErr && <ErrMsg msg={formErr} />}
        <Field label="Customer Name"><input style={inp} placeholder="e.g. Jane Mwangi" onChange={setF("customer")} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Quantity (kg)"><input style={inp} type="number" placeholder="25" onChange={setF("qty")} /></Field>
          <Field label="Price per kg (KSh)"><input style={inp} type="number" placeholder="120" onChange={setF("ppkg")} /></Field>
        </div>
        {form.qty && form.ppkg && <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "0.7rem 0.9rem", marginBottom: "1rem", fontWeight: 700, color: "#15803d", fontSize: "0.9rem", border: "1.5px solid #86efac" }}>Total: {fmt(Number(form.qty) * Number(form.ppkg))}</div>}
        <Field label="Payment Method">
          <select style={sel} onChange={setF("method")}><option value="Cash">Cash</option><option value="M-Pesa">M-Pesa</option></select>
        </Field>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button style={btnS} onClick={closeModal}>Cancel</button>
          <button style={{ ...btnP, opacity: saving ? 0.7 : 1 }} onClick={submitSale} disabled={saving}>{saving ? "Saving…" : "Save Sale"}</button>
        </div>
      </Modal>
    );

    if (modal === "addStock") return (
      <Modal title="Add Rice Stock" onClose={closeModal}>
        {formErr && <ErrMsg msg={formErr} />}
        <Field label="Supplier">
          <select style={sel} onChange={setF("supplier")}>
            <option value="">Select supplier…</option>
            {(suppliers || []).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            <option value="Other">Other</option>
          </select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Quantity (kg)"><input style={inp} type="number" placeholder="200" onChange={setF("qty")} /></Field>
          <Field label="Total Cost (KSh)"><input style={inp} type="number" placeholder="22000" onChange={setF("cost")} /></Field>
        </div>
        {form.qty && form.cost && <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "0.7rem 0.9rem", marginBottom: "1rem", fontSize: "0.82rem", color: "#6b7280", fontWeight: 600 }}>Cost per kg: {fmt(Math.round(Number(form.cost) / Number(form.qty)))}</div>}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button style={btnS} onClick={closeModal}>Cancel</button>
          <button style={{ ...btnP, opacity: saving ? 0.7 : 1 }} onClick={submitStock} disabled={saving}>{saving ? "Saving…" : "Add Stock"}</button>
        </div>
      </Modal>
    );

    if (modal === "addPolicy") return (
      <Modal title="Add Insurance Policy" onClose={closeModal}>
        {formErr && <ErrMsg msg={formErr} />}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Client Name"><input style={inp} placeholder="Full name" onChange={setF("client")} /></Field>
          <Field label="Phone Number"><input style={inp} placeholder="07XX XXX XXX" onChange={setF("phone")} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="KRA PIN"><input style={inp} placeholder="A000000000Z" onChange={setF("kra_pin")} /></Field>
          <Field label="Vehicle Reg. No."><input style={inp} placeholder="KXX 000X" onChange={setF("vehicle")} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Insurance Company"><input style={inp} placeholder="e.g. Jubilee" onChange={setF("insurer")} /></Field>
          <Field label="Premium (KSh)"><input style={inp} type="number" placeholder="12500" onChange={setF("premium")} /></Field>
        </div>
        <Field label="Policy Expiry"><input style={{ ...inp, colorScheme: "light" }} type="date" onChange={setF("expiry")} /></Field>
        {form.premium && <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "0.7rem 0.9rem", marginBottom: "1rem", fontWeight: 700, color: "#15803d", fontSize: "0.875rem", border: "1.5px solid #86efac" }}>Your commission (10%): {fmt(Math.round(Number(form.premium) * 0.1))}</div>}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button style={btnS} onClick={closeModal}>Cancel</button>
          <button style={{ ...btnP, opacity: saving ? 0.7 : 1 }} onClick={submitPolicy} disabled={saving}>{saving ? "Saving…" : "Save Policy"}</button>
        </div>
      </Modal>
    );

    if (modal === "addSupplier") return (
      <Modal title="Add Supplier" onClose={closeModal}>
        {formErr && <ErrMsg msg={formErr} />}
        <Field label="Supplier Name"><input style={inp} placeholder="Supplier name" onChange={setF("name")} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Contact"><input style={inp} placeholder="07XX XXX XXX" onChange={setF("contact")} /></Field>
          <Field label="Location"><input style={inp} placeholder="Town, County" onChange={setF("location")} /></Field>
        </div>
        <Field label="Payment Terms"><input style={inp} placeholder="e.g. Cash on delivery" onChange={setF("terms")} /></Field>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button style={btnS} onClick={closeModal}>Cancel</button>
          <button style={{ ...btnP, opacity: saving ? 0.7 : 1 }} onClick={submitSupplier} disabled={saving}>{saving ? "Saving…" : "Save Supplier"}</button>
        </div>
      </Modal>
    );

    if (modal === "addExpense") return (
      <Modal title="Record Expense" onClose={closeModal}>
        {formErr && <ErrMsg msg={formErr} />}
        <Field label="Description"><input style={inp} placeholder="e.g. Transport" onChange={setF("description")} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Amount (KSh)"><input style={inp} type="number" placeholder="3500" onChange={setF("amount")} /></Field>
          <Field label="Category">
            <select style={sel} onChange={setF("category")}>
              <option value="Operations">Operations</option>
              <option value="Stock">Stock</option>
              <option value="Utilities">Utilities</option>
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button style={btnS} onClick={closeModal}>Cancel</button>
          <button style={{ ...btnP, opacity: saving ? 0.7 : 1 }} onClick={submitExpense} disabled={saving}>{saving ? "Saving…" : "Save Expense"}</button>
        </div>
      </Modal>
    );

    return null;
  }

  const renderPage = () => {
    if (page === "dashboard")     return <Dashboard />;
    if (page === "rice")          return <RiceModule />;
    if (page === "insurance")     return <InsuranceModule />;
    if (page === "payments")      return <PaymentsModule />;
    if (page === "customers")     return <CustomersModule />;
    if (page === "notifications") return <NotificationsModule />;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f2f4f1", fontFamily: "'Outfit', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c8d5c9; border-radius: 4px; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: `${sideW}px`, background: G, minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.2s ease", overflow: "hidden", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: sideOpen ? "1.4rem" : "0.9rem", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          {sideOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "#f59e0b", borderRadius: "10px", padding: "8px 9px", display: "flex", flexShrink: 0 }}><Leaf size={18} color={G} strokeWidth={2.5} /></div>
              <div>
                <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.01em" }}>IBM</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.62rem", fontWeight: 500, lineHeight: 1.2 }}>Irene Business Manager</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ background: "#f59e0b", borderRadius: "10px", padding: "8px 9px", display: "flex" }}><Leaf size={18} color={G} strokeWidth={2.5} /></div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
          {navItems.map(n => {
            const active = page === n.id;
            return (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: sideOpen ? "0.6rem 0.75rem" : "0.65rem",
                borderRadius: "10px", border: "none", cursor: "pointer",
                width: "100%", textAlign: "left",
                background: active ? "rgba(245,158,11,0.18)" : "transparent",
                color: active ? "#f59e0b" : "rgba(255,255,255,0.6)",
                fontFamily: "inherit", fontWeight: active ? 700 : 500,
                fontSize: "0.82rem", transition: "all 0.15s",
                justifyContent: sideOpen ? "flex-start" : "center", position: "relative",
              }}>
                <span style={{ flexShrink: 0 }}>{n.icon}</span>
                {sideOpen && <span style={{ flex: 1 }}>{n.label}</span>}
                {sideOpen && n.badge > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: "999px", padding: "1px 7px", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0 }}>{n.badge}</span>}
                {!sideOpen && n.badge > 0 && <span style={{ position: "absolute", top: "6px", right: "6px", background: "#ef4444", borderRadius: "50%", width: "8px", height: "8px" }} />}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          {sideOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0.5rem 0.5rem 0.75rem" }}>
              <div style={{ background: "#f59e0b", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: G, fontWeight: 800, fontSize: "0.78rem", flexShrink: 0 }}>
                {user?.name?.split(" ").slice(0, 2).map(w => w[0]).join("")}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.78rem" }}>{user?.name}</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.67rem", textTransform: "capitalize" }}>{user?.role}</div>
              </div>
            </div>
          )}
          <button onClick={() => setSideOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: sideOpen ? "flex-start" : "center", gap: "8px", width: "100%", padding: "0.55rem 0.75rem", background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "8px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem", marginBottom: "6px" }}>
            <Menu size={15} /> {sideOpen && "Collapse"}
          </button>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", justifyContent: sideOpen ? "flex-start" : "center", gap: "8px", width: "100%", padding: "0.55rem 0.75rem", background: "rgba(220,38,38,0.15)", border: "none", borderRadius: "8px", color: "#fca5a5", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem" }}>
            <LogOut size={15} /> {sideOpen && "Sign Out"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, maxHeight: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "1rem 1.75rem 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500 }}>{new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "#fff", borderRadius: "9px", padding: "0.45rem 0.9rem", fontSize: "0.78rem", fontWeight: 600, color: (balance?.current_stock ?? 999) < 200 ? "#b91c1c" : "#374151", display: "flex", alignItems: "center", gap: "5px", boxShadow: "0 1px 2px rgba(0,0,0,0.06)", border: `1px solid ${(balance?.current_stock ?? 999) < 200 ? "#fca5a5" : "#f0f0f0"}` }}>
              <span style={{ color: (balance?.current_stock ?? 999) < 200 ? "#b91c1c" : "#22c55e", fontSize: "8px" }}>●</span>
              {balance?.current_stock ?? "…"} kg rice
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setPage("notifications")} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "9px", padding: "0.45rem 0.55rem", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", color: "#374151" }}>
                <Bell size={16} />
              </button>
              {alertCount > 0 && <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ef4444", color: "#fff", borderRadius: "50%", width: "17px", height: "17px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800 }}>{alertCount}</span>}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "1.25rem 1.75rem 2rem" }}>{renderPage()}</div>
      </div>

      <Modals />
    </div>
  );
}

// ─── Root — wraps everything in AuthProvider ──────────────
export default function App() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Loader size={32} color="#f59e0b" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
  return user ? <AppShell /> : <LoginScreen />;
}

// Wrap at entry point (main.jsx):
// import { AuthProvider } from './context/AuthContext';
// root.render(<AuthProvider><App /></AuthProvider>)
