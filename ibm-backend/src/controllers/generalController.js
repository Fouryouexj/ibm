import pool from "../lib/db.js";

// ── Expenses ─────────────────────────────────────────────

export async function getExpenses(req, res) {
  try {
    const { category } = req.query;
    let q = "SELECT * FROM expenses WHERE 1=1";
    const params = [];
    if (category) { q += " AND category = ?"; params.push(category); }
    q += " ORDER BY expense_date DESC, created_at DESC";
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createExpense(req, res) {
  const { description, amount, category, expense_date } = req.body;
  if (!description || !amount)
    return res.status(400).json({ error: "description and amount are required" });
  try {
    const [result] = await pool.query(
      "INSERT INTO expenses (description, amount, category, expense_date) VALUES (?,?,?,?)",
      [description, amount, category || "Operations", expense_date || new Date().toISOString().slice(0,10)]
    );
    const [rows] = await pool.query("SELECT * FROM expenses WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function updateExpense(req, res) {
  const { description, amount, category, expense_date } = req.body;
  try {
    await pool.query(
      "UPDATE expenses SET description=?, amount=?, category=?, expense_date=? WHERE id=?",
      [description, amount, category, expense_date, req.params.id]
    );
    const [rows] = await pool.query("SELECT * FROM expenses WHERE id=?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Expense not found" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function deleteExpense(req, res) {
  try {
    const [result] = await pool.query("DELETE FROM expenses WHERE id=?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Expense not found" });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// ── Customers ─────────────────────────────────────────────

export async function getCustomers(req, res) {
  try {
    const { search, type } = req.query;
    let q = "SELECT * FROM customers WHERE 1=1";
    const params = [];
    if (search) {
      q += " AND (name LIKE ? OR phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (type) {
      q += " AND JSON_CONTAINS(types, ?)";
      params.push(JSON.stringify(type));
    }
    q += " ORDER BY name";
    const [rows] = await pool.query(q, params);
    // Parse types JSON for each row
    const parsed = rows.map(r => ({ ...r, types: JSON.parse(r.types || "[]") }));
    res.json(parsed);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createCustomer(req, res) {
  const { name, phone, location, types } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    const [result] = await pool.query(
      "INSERT INTO customers (name, phone, location, types) VALUES (?,?,?,?)",
      [name, phone, location, JSON.stringify(types || [])]
    );
    const [rows] = await pool.query("SELECT * FROM customers WHERE id=?", [result.insertId]);
    const r = rows[0];
    res.status(201).json({ ...r, types: JSON.parse(r.types || "[]") });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function updateCustomer(req, res) {
  const { name, phone, location, types } = req.body;
  try {
    await pool.query(
      "UPDATE customers SET name=?, phone=?, location=?, types=? WHERE id=?",
      [name, phone, location, JSON.stringify(types || []), req.params.id]
    );
    const [rows] = await pool.query("SELECT * FROM customers WHERE id=?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Customer not found" });
    const r = rows[0];
    res.json({ ...r, types: JSON.parse(r.types || "[]") });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// ── Dashboard ─────────────────────────────────────────────

export async function getDashboard(req, res) {
  try {
    const [[riceRev]]   = await pool.query("SELECT COALESCE(SUM(total),0) AS total FROM rice_sales");
    const [[insComm]]   = await pool.query("SELECT COALESCE(SUM(commission),0) AS total FROM policies");
    const [[expenses]]  = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM expenses");
    const [[stockBal]]  = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(qty),0) FROM stock_in) -
        (SELECT COALESCE(SUM(qty),0) FROM rice_sales) AS balance
    `);
    const [[policies]]  = await pool.query(`
      SELECT
        COUNT(CASE WHEN expiry >= CURDATE() THEN 1 END)                          AS active,
        COUNT(CASE WHEN DATEDIFF(expiry, CURDATE()) BETWEEN 0 AND 30 THEN 1 END) AS renewals_due,
        COUNT(CASE WHEN DATEDIFF(expiry, CURDATE()) BETWEEN 0 AND 7  THEN 1 END) AS critical
      FROM policies
    `);
    const [[today]]     = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS total, COALESCE(SUM(qty),0) AS qty
      FROM rice_sales WHERE sale_date = CURDATE()
    `);

    const rice = Number(riceRev.total);
    const comm = Number(insComm.total);
    const exp  = Number(expenses.total);

    res.json({
      rice_revenue:   rice,
      ins_commission: comm,
      total_expenses: exp,
      net_profit:     rice + comm - exp,
      current_stock:  Number(stockBal.balance),
      policies,
      today_rice_rev: Number(today.total),
      today_rice_qty: Number(today.qty),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
