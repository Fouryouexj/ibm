import pool from "../lib/db.js";

// ── Expenses ─────────────────────────────────────────────

export async function getExpenses(req, res) {
  try {
    const { category } = req.query;
    let q = "SELECT * FROM expenses WHERE 1=1";
    const params = [];
    if (category) { params.push(category); q += ` AND category=$${params.length}`; }
    q += " ORDER BY expense_date DESC, created_at DESC";
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createExpense(req, res) {
  const { description, amount, category, expense_date } = req.body;
  if (!description || !amount) {
    return res.status(400).json({ error: "description and amount are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO expenses (description, amount, category, expense_date)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [description, amount, category || "Operations",
       expense_date || new Date().toISOString().slice(0,10)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateExpense(req, res) {
  const { description, amount, category, expense_date } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE expenses SET description=$1, amount=$2, category=$3, expense_date=$4
       WHERE id=$5 RETURNING *`,
      [description, amount, category, expense_date, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Expense not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteExpense(req, res) {
  try {
    const { rows } = await pool.query(
      "DELETE FROM expenses WHERE id=$1 RETURNING id", [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Expense not found" });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Customers ────────────────────────────────────────────

export async function getCustomers(req, res) {
  try {
    const { search, type } = req.query;
    let q = "SELECT * FROM customers WHERE 1=1";
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      q += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length})`;
    }
    if (type) {
      params.push(type);
      q += ` AND $${params.length} = ANY(types)`;
    }
    q += " ORDER BY name";
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createCustomer(req, res) {
  const { name, phone, location, types } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO customers (name, phone, location, types)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, phone, location, types || []]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateCustomer(req, res) {
  const { name, phone, location, types } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE customers SET name=$1, phone=$2, location=$3, types=$4
       WHERE id=$5 RETURNING *`,
      [name, phone, location, types, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Customer not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Dashboard summary ────────────────────────────────────

export async function getDashboard(req, res) {
  try {
    const [riceRev, insComm, expenses, stock, policies, todaySales] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(total),0) AS total FROM rice_sales"),
      pool.query("SELECT COALESCE(SUM(commission),0) AS total FROM policies"),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM expenses"),
      pool.query(`
        SELECT
          COALESCE((SELECT SUM(qty) FROM stock_in),0) -
          COALESCE((SELECT SUM(qty) FROM rice_sales),0) AS balance
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE expiry >= CURRENT_DATE)          AS active,
          COUNT(*) FILTER (WHERE expiry - CURRENT_DATE <= 30
                           AND expiry >= CURRENT_DATE)            AS renewals_due,
          COUNT(*) FILTER (WHERE expiry - CURRENT_DATE <= 7
                           AND expiry >= CURRENT_DATE)            AS critical
        FROM policies
      `),
      pool.query(`
        SELECT COALESCE(SUM(total),0) AS total, COALESCE(SUM(qty),0) AS qty
        FROM rice_sales WHERE sale_date = CURRENT_DATE
      `)
    ]);

    const rice  = Number(riceRev.rows[0].total);
    const comm  = Number(insComm.rows[0].total);
    const exp   = Number(expenses.rows[0].total);

    res.json({
      rice_revenue:    rice,
      ins_commission:  comm,
      total_expenses:  exp,
      net_profit:      rice + comm - exp,
      current_stock:   Number(stock.rows[0].balance),
      policies:        policies.rows[0],
      today_rice_rev:  Number(todaySales.rows[0].total),
      today_rice_qty:  Number(todaySales.rows[0].qty),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
