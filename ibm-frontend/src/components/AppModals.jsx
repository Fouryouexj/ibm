import { Modal, Field, ErrMsg, inp, sel, btnP, btnS, fmt } from "./ui.jsx";

export default function AppModals({
  modal, form, setForm, formErr,
  closeModal, suppliers,
  onSubmitSale, onSubmitStock, onSubmitPolicy,
  onSubmitSupplier, onSubmitExpense,
  saving,
}) {
  const val  = k => form[k] ?? "";
  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  if (!modal) return null;

  // ── Record Rice Sale ──────────────────────────────────────
  if (modal === "addSale") return (
    <Modal title="Record Rice Sale" onClose={closeModal}>
      {formErr && <ErrMsg msg={formErr} />}
      <Field label="Customer Name">
        <input style={inp} placeholder="e.g. Jane Mwangi"
          value={val("customer")} onChange={setF("customer")} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Quantity (kg)">
          <input style={inp} type="number" placeholder="25" min="0"
            value={val("qty")} onChange={setF("qty")} />
        </Field>
        <Field label="Price per kg (KSh)">
          <input style={inp} type="number" placeholder="120" min="0"
            value={val("ppkg")} onChange={setF("ppkg")} />
        </Field>
      </div>
      {form.qty && form.ppkg && (
        <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "0.7rem 0.9rem", marginBottom: "1rem", fontWeight: 700, color: "#15803d", fontSize: "0.9rem", border: "1.5px solid #86efac" }}>
          Total: {fmt(Number(form.qty) * Number(form.ppkg))}
        </div>
      )}
      <Field label="Payment Method">
        <select style={sel} value={val("method") || "Cash"} onChange={setF("method")}>
          <option value="Cash">Cash</option>
          <option value="M-Pesa">M-Pesa</option>
        </select>
      </Field>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button style={btnS} onClick={closeModal}>Cancel</button>
        <button style={{ ...btnP, opacity: saving ? 0.7 : 1 }}
          onClick={onSubmitSale} disabled={saving}>
          {saving ? "Saving…" : "Save Sale"}
        </button>
      </div>
    </Modal>
  );

  // ── Add Stock ─────────────────────────────────────────────
  if (modal === "addStock") return (
    <Modal title="Add Rice Stock" onClose={closeModal}>
      {formErr && <ErrMsg msg={formErr} />}
      <Field label="Supplier">
        <select style={sel} value={val("supplier")} onChange={setF("supplier")}>
          <option value="">Select supplier…</option>
          {(suppliers || []).map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
          <option value="Other">Other</option>
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Quantity (kg)">
          <input style={inp} type="number" placeholder="200" min="0"
            value={val("qty")} onChange={setF("qty")} />
        </Field>
        <Field label="Total Cost (KSh)">
          <input style={inp} type="number" placeholder="22000" min="0"
            value={val("cost")} onChange={setF("cost")} />
        </Field>
      </div>
      {form.qty && form.cost && Number(form.qty) > 0 && (
        <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "0.7rem 0.9rem", marginBottom: "1rem", fontSize: "0.82rem", color: "#6b7280", fontWeight: 600 }}>
          Cost per kg: {fmt(Math.round(Number(form.cost) / Number(form.qty)))}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button style={btnS} onClick={closeModal}>Cancel</button>
        <button style={{ ...btnP, opacity: saving ? 0.7 : 1 }}
          onClick={onSubmitStock} disabled={saving}>
          {saving ? "Saving…" : "Add Stock"}
        </button>
      </div>
    </Modal>
  );

  // ── Add Policy ────────────────────────────────────────────
  if (modal === "addPolicy") return (
    <Modal title="Add Insurance Policy" onClose={closeModal}>
      {formErr && <ErrMsg msg={formErr} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Client Name">
          <input style={inp} placeholder="Full name"
            value={val("client")} onChange={setF("client")} />
        </Field>
        <Field label="Phone Number">
          <input style={inp} placeholder="07XX XXX XXX"
            value={val("phone")} onChange={setF("phone")} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="KRA PIN">
          <input style={inp} placeholder="A000000000Z"
            value={val("kra_pin")} onChange={setF("kra_pin")} />
        </Field>
        <Field label="Vehicle Reg. No.">
          <input style={inp} placeholder="KXX 000X"
            value={val("vehicle")} onChange={setF("vehicle")} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Insurance Company">
          <input style={inp} placeholder="e.g. Jubilee"
            value={val("insurer")} onChange={setF("insurer")} />
        </Field>
        <Field label="Premium (KSh)">
          <input style={inp} type="number" placeholder="12500" min="0"
            value={val("premium")} onChange={setF("premium")} />
        </Field>
      </div>
      <Field label="Policy Expiry">
        <input style={{ ...inp, colorScheme: "light" }} type="date"
          value={val("expiry")} onChange={setF("expiry")} />
      </Field>
      {form.premium && Number(form.premium) > 0 && (
        <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "0.7rem 0.9rem", marginBottom: "1rem", fontWeight: 700, color: "#15803d", fontSize: "0.875rem", border: "1.5px solid #86efac" }}>
          Your commission (10%): {fmt(Math.round(Number(form.premium) * 0.1))}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button style={btnS} onClick={closeModal}>Cancel</button>
        <button style={{ ...btnP, opacity: saving ? 0.7 : 1 }}
          onClick={onSubmitPolicy} disabled={saving}>
          {saving ? "Saving…" : "Save Policy"}
        </button>
      </div>
    </Modal>
  );

  // ── Add Supplier ──────────────────────────────────────────
  if (modal === "addSupplier") return (
    <Modal title="Add Supplier" onClose={closeModal}>
      {formErr && <ErrMsg msg={formErr} />}
      <Field label="Supplier Name">
        <input style={inp} placeholder="Supplier name"
          value={val("name")} onChange={setF("name")} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Contact">
          <input style={inp} placeholder="07XX XXX XXX"
            value={val("contact")} onChange={setF("contact")} />
        </Field>
        <Field label="Location">
          <input style={inp} placeholder="Town, County"
            value={val("location")} onChange={setF("location")} />
        </Field>
      </div>
      <Field label="Payment Terms">
        <input style={inp} placeholder="e.g. Cash on delivery"
          value={val("terms")} onChange={setF("terms")} />
      </Field>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button style={btnS} onClick={closeModal}>Cancel</button>
        <button style={{ ...btnP, opacity: saving ? 0.7 : 1 }}
          onClick={onSubmitSupplier} disabled={saving}>
          {saving ? "Saving…" : "Save Supplier"}
        </button>
      </div>
    </Modal>
  );

  // ── Add Expense ───────────────────────────────────────────
  if (modal === "addExpense") return (
    <Modal title="Record Expense" onClose={closeModal}>
      {formErr && <ErrMsg msg={formErr} />}
      <Field label="Description">
        <input style={inp} placeholder="e.g. Transport"
          value={val("description")} onChange={setF("description")} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Amount (KSh)">
          <input style={inp} type="number" placeholder="3500" min="0"
            value={val("amount")} onChange={setF("amount")} />
        </Field>
        <Field label="Category">
          <select style={sel} value={val("category") || "Operations"} onChange={setF("category")}>
            <option value="Operations">Operations</option>
            <option value="Stock">Stock</option>
            <option value="Utilities">Utilities</option>
            <option value="Other">Other</option>
          </select>
        </Field>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button style={btnS} onClick={closeModal}>Cancel</button>
        <button style={{ ...btnP, opacity: saving ? 0.7 : 1 }}
          onClick={onSubmitExpense} disabled={saving}>
          {saving ? "Saving…" : "Save Expense"}
        </button>
      </div>
    </Modal>
  );

  return null;
}
