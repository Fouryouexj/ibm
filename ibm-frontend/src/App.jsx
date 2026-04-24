import { useState, useMemo } from "react";
import {
  LayoutDashboard, Wheat, Car, CreditCard,
  Users, Bell, LogOut, Menu, Leaf, Loader,
} from "lucide-react";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { useApi, useMutation }   from "./hooks/useApi.js";
import { api }                   from "./api/client.js";

import { G, inp, sel, btnP, btnS, fmt, toDay, daysUntil, Field, ErrMsg } from "./components/ui.jsx";
import AppModals    from "./components/AppModals.jsx";
import Dashboard    from "./pages/Dashboard.jsx";
import RiceModule   from "./pages/Rice.jsx";
import InsuranceModule from "./pages/Insurance.jsx";
import { PaymentsModule, CustomersModule, NotificationsModule } from "./pages/OtherPages.jsx";

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
    try { await login(email, password); }
    catch (e) { setError(e.message); }
    finally   { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(145deg, ${G} 0%, #2d6a4f 55%, #1a3a2a 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Outfit','Segoe UI',sans-serif", padding: "1rem",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: "20px", padding: "2.5rem 2.25rem", width: "100%", maxWidth: "390px", boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: G, borderRadius: "14px", padding: "12px 18px", marginBottom: "1.1rem" }}>
            <Leaf size={22} color="#f59e0b" strokeWidth={2.5} />
            <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: "1.4rem" }}>IBM</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.5rem", color: G, lineHeight: 1.15 }}>Irene Business</div>
          <div style={{ fontWeight: 800, fontSize: "1.5rem", color: G, lineHeight: 1.15 }}>Manager</div>
          <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "0.5rem" }}>Rice &amp; Motor Insurance System</div>
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

        <button
          style={{ ...btnP, width: "100%", justifyContent: "center", padding: "0.8rem", fontSize: "1rem", marginTop: "0.5rem", borderRadius: "10px", opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin} disabled={loading}
        >
          {loading
            ? <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
            : "Sign In →"}
        </button>
        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9ca3af", marginTop: "1rem", marginBottom: 0 }}>
          Admin: irene@ibm.local · Staff: staff@ibm.local
        </p>
      </div>
    </div>
  );
}

// ─── Main app shell ───────────────────────────────────────
function AppShell() {
  const { user, logout } = useAuth();

  // ── Nav state ──────────────────────────────────────────
  const [page,     setPage]     = useState("dashboard");
  const [riceTab,  setRiceTab]  = useState("stock");
  const [insTab,   setInsTab]   = useState("policies");
  const [sideOpen, setSideOpen] = useState(true);

  // ── Modal state (lifted here, passed to AppModals) ─────
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({});
  const [formErr, setFormErr] = useState("");
  const closeModal = () => { setModal(null); setForm({}); setFormErr(""); };

  // ── Data ───────────────────────────────────────────────
  const { data: dash,       refetch: rDash }      = useApi(() => api.dashboard.get(),            []);
  const { data: sales,      refetch: rSales }     = useApi(() => api.rice.getSales(),             []);
  const { data: stockIn,    refetch: rStock }     = useApi(() => api.rice.getStock(),             []);
  const { data: balance,    refetch: rBalance }   = useApi(() => api.rice.getBalance(),           []);
  const { data: suppliers,  refetch: rSuppliers } = useApi(() => api.rice.getSuppliers(),         []);
  const { data: policies,   refetch: rPolicies }  = useApi(() => api.insurance.getPolicies(),     []);
  const { data: insSummary, refetch: rInsSummary }= useApi(() => api.insurance.getSummary(),      []);
  const { data: expenses,   refetch: rExpenses }  = useApi(() => api.expenses.getAll(),           []);
  const { data: customers,  refetch: rCustomers } = useApi(() => api.customers.getAll(),          []);

  function refetchAll() {
    rDash(); rSales(); rStock(); rBalance();
    rSuppliers(); rPolicies(); rInsSummary();
    rExpenses(); rCustomers();
  }

  // ── Mutations ──────────────────────────────────────────
  const mCreateSale     = useMutation(body => api.rice.createSale(body));
  const mDeleteSale     = useMutation(id   => api.rice.deleteSale(id));
  const mAddStock       = useMutation(body => api.rice.addStock(body));
  const mCreateSupplier = useMutation(body => api.rice.createSupplier(body));
  const mCreatePolicy   = useMutation(body => api.insurance.createPolicy(body));
  const mRenewPolicy    = useMutation(id   => api.insurance.markRenewed(id));
  const mDeletePolicy   = useMutation(id   => api.insurance.deletePolicy(id));
  const mCreateExpense  = useMutation(body => api.expenses.create(body));

  const saving = mCreateSale.loading || mAddStock.loading || mCreatePolicy.loading
               || mCreateSupplier.loading || mCreateExpense.loading;

  // ── Submit handlers ────────────────────────────────────
  async function submitSale() {
    if (!form.customer || !form.qty || !form.ppkg) { setFormErr("All fields required"); return; }
    try {
      await mCreateSale.mutate({ customer: form.customer, qty: form.qty, ppkg: form.ppkg, method: form.method || "Cash", sale_date: toDay() });
      rSales(); rBalance(); rDash(); closeModal();
    } catch (e) { setFormErr(e.message); }
  }

  async function submitStock() {
    if (!form.supplier || !form.qty || !form.cost) { setFormErr("All fields required"); return; }
    try {
      await mAddStock.mutate({ supplier: form.supplier, qty: form.qty, cost: form.cost, stock_date: toDay() });
      rStock(); rBalance(); rDash(); closeModal();
    } catch (e) { setFormErr(e.message); }
  }

  async function submitPolicy() {
    if (!form.client || !form.vehicle || !form.expiry) { setFormErr("Client, vehicle and expiry required"); return; }
    try {
      await mCreatePolicy.mutate({ client: form.client, phone: form.phone, kra_pin: form.kra_pin, vehicle: form.vehicle, insurer: form.insurer, expiry: form.expiry, premium: form.premium });
      rPolicies(); rInsSummary(); rDash(); closeModal();
    } catch (e) { setFormErr(e.message); }
  }

  async function submitSupplier() {
    if (!form.name) { setFormErr("Supplier name required"); return; }
    try {
      await mCreateSupplier.mutate({ name: form.name, contact: form.contact, location: form.location, terms: form.terms });
      rSuppliers(); closeModal();
    } catch (e) { setFormErr(e.message); }
  }

  async function submitExpense() {
    if (!form.description || !form.amount) { setFormErr("Description and amount required"); return; }
    try {
      await mCreateExpense.mutate({ description: form.description, amount: form.amount, category: form.category || "Operations", expense_date: toDay() });
      rExpenses(); rDash(); closeModal();
    } catch (e) { setFormErr(e.message); }
  }

  async function handleRenew(id) {
    try { await mRenewPolicy.mutate(id); rPolicies(); rInsSummary(); rDash(); }
    catch (e) { alert(e.message); }
  }

  async function handleDeleteSale(id) {
    if (!window.confirm("Delete this sale?")) return;
    try { await mDeleteSale.mutate(id); rSales(); rBalance(); rDash(); }
    catch (e) { alert(e.message); }
  }

  async function handleDeletePolicy(id) {
    if (!window.confirm("Delete this policy?")) return;
    try { await mDeletePolicy.mutate(id); rPolicies(); rInsSummary(); rDash(); }
    catch (e) { alert(e.message); }
  }

  // ── Notifications ──────────────────────────────────────
  const notifications = useMemo(() => {
    if (!policies || !balance) return [];
    const list = [];
    const critical = policies.filter(p => { const d = daysUntil(p.expiry); return d > 0 && d <= 7; });
    const expired  = policies.filter(p => daysUntil(p.expiry) <= 0);
    const due30    = policies.filter(p => { const d = daysUntil(p.expiry); return d > 7 && d <= 30; });
    critical.forEach(p => list.push({ type: "critical", msg: `URGENT: ${p.client}'s ${p.vehicle} expires in ${daysUntil(p.expiry)} day(s) — renew immediately!` }));
    expired.forEach( p => list.push({ type: "danger",   msg: `EXPIRED: ${p.client}'s policy (${p.vehicle}) is overdue for renewal` }));
    due30.forEach(   p => list.push({ type: "warning",  msg: `Renewal due: ${p.client}'s ${p.vehicle} expires in ${daysUntil(p.expiry)} days` }));
    if ((balance?.current_stock ?? 999) < 200)
      list.push({ type: "warning", msg: `Low stock alert: Only ${balance.current_stock} kg of rice remaining` });
    return list;
  }, [policies, balance]);

  const alertCount = notifications.filter(n => n.type !== "info").length;
  const isAdmin    = user?.role === "admin";
  const sideW      = sideOpen ? 230 : 62;

  const navItems = [
    { id: "dashboard",     icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { id: "rice",          icon: <Wheat size={18} />,           label: "Rice Business" },
    { id: "insurance",     icon: <Car size={18} />,             label: "Insurance" },
    { id: "payments",      icon: <CreditCard size={18} />,      label: "Payments" },
    { id: "customers",     icon: <Users size={18} />,           label: "Customers" },
    { id: "notifications", icon: <Bell size={18} />,            label: "Notifications", badge: alertCount },
  ];

  // ── Page renderer ──────────────────────────────────────
  function renderPage() {
    switch (page) {
      case "dashboard":     return (
        <Dashboard
          dash={dash} balance={balance} insSummary={insSummary}
          sales={sales} policies={policies} user={user}
          onGoRice={() => setPage("rice")}
          onGoRenewals={() => { setPage("insurance"); setInsTab("renewals"); }}
        />
      );
      case "rice":          return (
        <RiceModule
          sales={sales} stockIn={stockIn} balance={balance} suppliers={suppliers}
          isAdmin={isAdmin} riceTab={riceTab} setRiceTab={setRiceTab}
          onAddSale={() => setModal("addSale")}
          onAddStock={() => setModal("addStock")}
          onAddSupplier={() => setModal("addSupplier")}
          onDeleteSale={handleDeleteSale}
        />
      );
      case "insurance":     return (
        <InsuranceModule
          policies={policies} insSummary={insSummary} isAdmin={isAdmin}
          insTab={insTab} setInsTab={setInsTab}
          onAddPolicy={() => setModal("addPolicy")}
          onRenew={handleRenew}
          onDeletePolicy={handleDeletePolicy}
        />
      );
      case "payments":      return (
        <PaymentsModule
          dash={dash} expenses={expenses} isAdmin={isAdmin}
          onAddExpense={() => setModal("addExpense")}
          onRefresh={() => { rExpenses(); rDash(); }}
        />
      );
      case "customers":     return <CustomersModule customers={customers} />;
      case "notifications": return <NotificationsModule notifications={notifications} />;
      default: return null;
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f2f4f1", fontFamily: "'Outfit','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c8d5c9; border-radius: 4px; }
      `}</style>

      {/* ── Sidebar ── */}
      <div style={{ width: `${sideW}px`, background: G, minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.2s ease", overflow: "hidden", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: sideOpen ? "1.4rem" : "0.9rem", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          {sideOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "#f59e0b", borderRadius: "10px", padding: "8px 9px", display: "flex", flexShrink: 0 }}>
                <Leaf size={18} color={G} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: "1.1rem" }}>IBM</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.62rem", fontWeight: 500 }}>Irene Business Manager</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ background: "#f59e0b", borderRadius: "10px", padding: "8px 9px", display: "flex" }}>
                <Leaf size={18} color={G} strokeWidth={2.5} />
              </div>
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
                width: "100%", textAlign: "left", position: "relative",
                background: active ? "rgba(245,158,11,0.18)" : "transparent",
                color: active ? "#f59e0b" : "rgba(255,255,255,0.6)",
                fontFamily: "inherit", fontWeight: active ? 700 : 500,
                fontSize: "0.82rem", transition: "all 0.15s",
                justifyContent: sideOpen ? "flex-start" : "center",
              }}>
                <span style={{ flexShrink: 0 }}>{n.icon}</span>
                {sideOpen && <span style={{ flex: 1 }}>{n.label}</span>}
                {sideOpen && n.badge > 0 && (
                  <span style={{ background: "#ef4444", color: "#fff", borderRadius: "999px", padding: "1px 7px", fontSize: "0.65rem", fontWeight: 800 }}>{n.badge}</span>
                )}
                {!sideOpen && n.badge > 0 && (
                  <span style={{ position: "absolute", top: "6px", right: "6px", background: "#ef4444", borderRadius: "50%", width: "8px", height: "8px" }} />
                )}
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

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, maxHeight: "100vh", overflowY: "auto" }}>
        {/* Top bar */}
        <div style={{ padding: "1rem 1.75rem 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500 }}>
            {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "#fff", borderRadius: "9px", padding: "0.45rem 0.9rem", fontSize: "0.78rem", fontWeight: 600, color: (balance?.current_stock ?? 999) < 200 ? "#b91c1c" : "#374151", display: "flex", alignItems: "center", gap: "5px", boxShadow: "0 1px 2px rgba(0,0,0,0.06)", border: `1px solid ${(balance?.current_stock ?? 999) < 200 ? "#fca5a5" : "#f0f0f0"}` }}>
              <span style={{ color: (balance?.current_stock ?? 999) < 200 ? "#b91c1c" : "#22c55e", fontSize: "8px" }}>●</span>
              {balance?.current_stock ?? "…"} kg rice
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setPage("notifications")} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "9px", padding: "0.45rem 0.55rem", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", color: "#374151" }}>
                <Bell size={16} />
              </button>
              {alertCount > 0 && (
                <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ef4444", color: "#fff", borderRadius: "50%", width: "17px", height: "17px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800 }}>
                  {alertCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "1.25rem 1.75rem 2rem" }}>
          {renderPage()}
        </div>
      </div>

      {/* ── Modals (outside page tree — no remount on form change) ── */}
      <AppModals
        modal={modal}
        form={form}
        setForm={setForm}
        formErr={formErr}
        closeModal={closeModal}
        suppliers={suppliers}
        onSubmitSale={submitSale}
        onSubmitStock={submitStock}
        onSubmitPolicy={submitPolicy}
        onSubmitSupplier={submitSupplier}
        onSubmitExpense={submitExpense}
        saving={saving}
      />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────
export default function App() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Loader size={32} color="#f59e0b" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
  return user ? <AppShell /> : <LoginScreen />;
}
