import pool from "../lib/db.js";
import { upsertCustomer, recomputeCustomerTypes } from "../lib/customerSync.js";

export async function getPolicies(req, res) {
  try {
    const { status } = req.query;
    let q = `SELECT *, DATEDIFF(expiry, CURDATE()) AS days_until_expiry,
      CASE
        WHEN expiry < CURDATE() THEN 'expired'
        WHEN DATEDIFF(expiry, CURDATE()) <= 7  THEN 'critical'
        WHEN DATEDIFF(expiry, CURDATE()) <= 30 THEN 'due-soon'
        ELSE 'active'
      END AS renewal_status
      FROM policies WHERE 1=1`;
    if (status === "expired")  q += " AND expiry < CURDATE()";
    if (status === "renewals") q += " AND expiry >= CURDATE() AND DATEDIFF(expiry, CURDATE()) <= 30";
    if (status === "active")   q += " AND expiry >= CURDATE()";
    q += " ORDER BY expiry ASC";
    const [rows] = await pool.query(q);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function getPolicy(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT *, DATEDIFF(expiry, CURDATE()) AS days_until_expiry FROM policies WHERE id = ?",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Policy not found" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createPolicy(req, res) {
  const { client: clientName, phone, kra_pin, vehicle, insurer, expiry, premium } = req.body;
  if (!clientName || !vehicle || !expiry)
    return res.status(400).json({ error: "client, vehicle and expiry are required" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const prem = Number(premium) || 0;
    const commission = Math.round(prem * 0.1);
    const [result] = await conn.query(
      "INSERT INTO policies (client, phone, kra_pin, vehicle, insurer, expiry, premium, commission) VALUES (?,?,?,?,?,?,?,?)",
      [clientName, phone, kra_pin, vehicle, insurer, expiry, prem, commission]
    );
    await upsertCustomer(conn, { name: clientName, phone, type: "Insurance", last_order: expiry });
    await conn.commit();
    const [rows] = await pool.query("SELECT * FROM policies WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
}

export async function updatePolicy(req, res) {
  const { client: clientName, phone, kra_pin, vehicle, insurer, expiry, premium, status } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const prem = Number(premium) || 0;
    const commission = Math.round(prem * 0.1);
    await conn.query(
      "UPDATE policies SET client=?, phone=?, kra_pin=?, vehicle=?, insurer=?, expiry=?, premium=?, commission=?, status=? WHERE id=?",
      [clientName, phone, kra_pin, vehicle, insurer, expiry, prem, commission, status || "active", req.params.id]
    );
    await upsertCustomer(conn, { name: clientName, phone, type: "Insurance", last_order: expiry });
    await conn.commit();
    const [rows] = await pool.query("SELECT * FROM policies WHERE id = ?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Policy not found" });
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
}

export async function markRenewed(req, res) {
  try {
    await pool.query("UPDATE policies SET status='renewed' WHERE id=?", [req.params.id]);
    const [rows] = await pool.query("SELECT * FROM policies WHERE id=?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Policy not found" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function deletePolicy(req, res) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT * FROM policies WHERE id=?", [req.params.id]);
    if (!rows[0]) { await conn.rollback(); return res.status(404).json({ error: "Policy not found" }); }
    const clientName = rows[0].client;
    await conn.query("DELETE FROM policies WHERE id=?", [req.params.id]);
    await recomputeCustomerTypes(conn, clientName);
    await conn.commit();
    res.json({ deleted: req.params.id });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
}

export async function getRenewalsSummary(req, res) {
  try {
    const [[row]] = await pool.query(`
      SELECT
        COUNT(CASE WHEN expiry >= CURDATE() THEN 1 END)                                    AS active,
        COUNT(CASE WHEN expiry < CURDATE() THEN 1 END)                                     AS expired,
        COUNT(CASE WHEN DATEDIFF(expiry, CURDATE()) BETWEEN 0 AND 30 THEN 1 END)           AS due_30_days,
        COUNT(CASE WHEN DATEDIFF(expiry, CURDATE()) BETWEEN 0 AND 7  THEN 1 END)           AS due_7_days,
        COALESCE(SUM(commission),0)                                                        AS total_commission
      FROM policies
    `);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
}
