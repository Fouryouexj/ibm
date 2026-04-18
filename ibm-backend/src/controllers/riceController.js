import pool from "../lib/db.js";

// ── Sales ────────────────────────────────────────────────

export async function getSales(req, res) {
  try {
    const { from, to, method } = req.query;
    let q = "SELECT * FROM rice_sales WHERE 1=1";
    const params = [];

    if (from)   { params.push(from);   q += ` AND sale_date >= $${params.length}`; }
    if (to)     { params.push(to);     q += ` AND sale_date <= $${params.length}`; }
    if (method) { params.push(method); q += ` AND method = $${params.length}`; }

    q += " ORDER BY sale_date DESC, created_at DESC";
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createSale(req, res) {
  const { customer, qty, ppkg, method, sale_date } = req.body;
  if (!customer || !qty || !ppkg) {
    return res.status(400).json({ error: "customer, qty and ppkg are required" });
  }
  try {
    const total = Number(qty) * Number(ppkg);
    const { rows } = await pool.query(
      `INSERT INTO rice_sales (customer, qty, ppkg, total, method, sale_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [customer, qty, ppkg, total, method || "Cash", sale_date || new Date().toISOString().slice(0,10)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteSale(req, res) {
  try {
    const { rows } = await pool.query(
      "DELETE FROM rice_sales WHERE id=$1 RETURNING id", [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Sale not found" });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Stock ────────────────────────────────────────────────

export async function getStock(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM stock_in ORDER BY stock_date DESC, created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getStockBalance(req, res) {
  try {
    const stockIn = await pool.query("SELECT COALESCE(SUM(qty),0) AS total FROM stock_in");
    const sold    = await pool.query("SELECT COALESCE(SUM(qty),0) AS total FROM rice_sales");
    const balance = Number(stockIn.rows[0].total) - Number(sold.rows[0].total);
    res.json({
      total_received: Number(stockIn.rows[0].total),
      total_sold:     Number(sold.rows[0].total),
      current_stock:  balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createStockEntry(req, res) {
  const { supplier, qty, cost, stock_date } = req.body;
  if (!supplier || !qty || !cost) {
    return res.status(400).json({ error: "supplier, qty and cost are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO stock_in (supplier, qty, cost, stock_date)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [supplier, qty, cost, stock_date || new Date().toISOString().slice(0,10)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Suppliers ────────────────────────────────────────────

export async function getSuppliers(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM suppliers ORDER BY name");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createSupplier(req, res) {
  const { name, contact, location, terms } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO suppliers (name, contact, location, terms)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, contact, location, terms]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateSupplier(req, res) {
  const { name, contact, location, terms } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE suppliers SET name=$1, contact=$2, location=$3, terms=$4
       WHERE id=$5 RETURNING *`,
      [name, contact, location, terms, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Supplier not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteSupplier(req, res) {
  try {
    const { rows } = await pool.query(
      "DELETE FROM suppliers WHERE id=$1 RETURNING id", [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Supplier not found" });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Reports ──────────────────────────────────────────────

export async function getRiceReport(req, res) {
  try {
    const { period = "all" } = req.query;
    let dateFilter = "";
    if (period === "today")  dateFilter = "AND sale_date = CURRENT_DATE";
    if (period === "week")   dateFilter = "AND sale_date >= CURRENT_DATE - INTERVAL '7 days'";
    if (period === "month")  dateFilter = "AND sale_date >= DATE_TRUNC('month', CURRENT_DATE)";

    const revenue = await pool.query(
      `SELECT COALESCE(SUM(total),0) AS total, COALESCE(SUM(qty),0) AS qty,
              COUNT(*) AS transactions
       FROM rice_sales WHERE 1=1 ${dateFilter}`
    );
    const byMethod = await pool.query(
      `SELECT method, COALESCE(SUM(total),0) AS total, COUNT(*) AS count
       FROM rice_sales WHERE 1=1 ${dateFilter}
       GROUP BY method`
    );
    const stockCost = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE category='Stock'"
    );

    res.json({
      revenue:     Number(revenue.rows[0].total),
      qty_sold:    Number(revenue.rows[0].qty),
      transactions: Number(revenue.rows[0].transactions),
      by_method:   byMethod.rows,
      stock_cost:  Number(stockCost.rows[0].total),
      gross_profit: Number(revenue.rows[0].total) - Number(stockCost.rows[0].total)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
