import pool from "../lib/db.js";
import { upsertCustomer, recomputeCustomerTypes } from "../lib/customerSync.js";

export async function getSales(req, res) {
  try {
    const { from, to, method } = req.query;
    let q = "SELECT * FROM rice_sales WHERE 1=1";
    const params = [];
    if (from)   { q += " AND sale_date >= ?"; params.push(from); }
    if (to)     { q += " AND sale_date <= ?"; params.push(to); }
    if (method) { q += " AND method = ?";     params.push(method); }
    q += " ORDER BY sale_date DESC, created_at DESC";
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createSale(req, res) {
  const { customer, qty, ppkg, method, sale_date } = req.body;
  if (!customer || !qty || !ppkg)
    return res.status(400).json({ error: "customer, qty and ppkg are required" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const saleDate = sale_date || new Date().toISOString().slice(0, 10);
    const total    = Number(qty) * Number(ppkg);
    const [result] = await conn.query(
      "INSERT INTO rice_sales (customer, qty, ppkg, total, method, sale_date) VALUES (?,?,?,?,?,?)",
      [customer, qty, ppkg, total, method || "Cash", saleDate]
    );
    await upsertCustomer(conn, { name: customer, type: "Rice", last_order: saleDate });
    await conn.commit();
    const [rows] = await pool.query("SELECT * FROM rice_sales WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
}

export async function deleteSale(req, res) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT * FROM rice_sales WHERE id = ?", [req.params.id]);
    if (!rows[0]) { await conn.rollback(); return res.status(404).json({ error: "Sale not found" }); }
    const customerName = rows[0].customer;
    await conn.query("DELETE FROM rice_sales WHERE id = ?", [req.params.id]);
    await recomputeCustomerTypes(conn, customerName);
    await conn.commit();
    res.json({ deleted: req.params.id });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
}

export async function getStock(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM stock_in ORDER BY stock_date DESC, created_at DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function getStockBalance(req, res) {
  try {
    const [[si]]  = await pool.query("SELECT COALESCE(SUM(qty),0) AS total FROM stock_in");
    const [[sol]] = await pool.query("SELECT COALESCE(SUM(qty),0) AS total FROM rice_sales");
    res.json({
      total_received: Number(si.total),
      total_sold:     Number(sol.total),
      current_stock:  Number(si.total) - Number(sol.total),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createStockEntry(req, res) {
  const { supplier, qty, cost, stock_date } = req.body;
  if (!supplier || !qty || !cost)
    return res.status(400).json({ error: "supplier, qty and cost are required" });
  try {
    const [result] = await pool.query(
      "INSERT INTO stock_in (supplier, qty, cost, stock_date) VALUES (?,?,?,?)",
      [supplier, qty, cost, stock_date || new Date().toISOString().slice(0, 10)]
    );
    const [rows] = await pool.query("SELECT * FROM stock_in WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function getSuppliers(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM suppliers ORDER BY name");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createSupplier(req, res) {
  const { name, contact, location, terms } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    const [result] = await pool.query(
      "INSERT INTO suppliers (name, contact, location, terms) VALUES (?,?,?,?)",
      [name, contact, location, terms]
    );
    const [rows] = await pool.query("SELECT * FROM suppliers WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function updateSupplier(req, res) {
  const { name, contact, location, terms } = req.body;
  try {
    await pool.query(
      "UPDATE suppliers SET name=?, contact=?, location=?, terms=? WHERE id=?",
      [name, contact, location, terms, req.params.id]
    );
    const [rows] = await pool.query("SELECT * FROM suppliers WHERE id = ?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Supplier not found" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function deleteSupplier(req, res) {
  try {
    const [result] = await pool.query("DELETE FROM suppliers WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Supplier not found" });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function getRiceReport(req, res) {
  try {
    const { period = "all" } = req.query;
    let df = "";
    if (period === "today") df = "AND sale_date = CURDATE()";
    if (period === "week")  df = "AND sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    if (period === "month") df = "AND sale_date >= DATE_FORMAT(CURDATE(),'%Y-%m-01')";

    const [[rev]]  = await pool.query(`SELECT COALESCE(SUM(total),0) AS total, COALESCE(SUM(qty),0) AS qty, COUNT(*) AS transactions FROM rice_sales WHERE 1=1 ${df}`);
    const [meth]   = await pool.query(`SELECT method, COALESCE(SUM(total),0) AS total, COUNT(*) AS count FROM rice_sales WHERE 1=1 ${df} GROUP BY method`);
    const [[cost]] = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE category='Stock'");

    res.json({
      revenue:      Number(rev.total),
      qty_sold:     Number(rev.qty),
      transactions: Number(rev.transactions),
      by_method:    meth,
      stock_cost:   Number(cost.total),
      gross_profit: Number(rev.total) - Number(cost.total),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
