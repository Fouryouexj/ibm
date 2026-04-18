import pool from "../lib/db.js";

export async function getPolicies(req, res) {
  try {
    const { status } = req.query;
    let q = `
      SELECT *,
        (expiry - CURRENT_DATE) AS days_until_expiry,
        CASE
          WHEN expiry < CURRENT_DATE THEN 'expired'
          WHEN expiry - CURRENT_DATE <= 7  THEN 'critical'
          WHEN expiry - CURRENT_DATE <= 30 THEN 'due-soon'
          ELSE 'active'
        END AS renewal_status
      FROM policies WHERE 1=1
    `;
    const params = [];
    if (status === "expired")  q += " AND expiry < CURRENT_DATE";
    if (status === "renewals") q += " AND expiry >= CURRENT_DATE AND expiry - CURRENT_DATE <= 30";
    if (status === "active")   q += " AND expiry >= CURRENT_DATE";

    q += " ORDER BY expiry ASC";
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPolicy(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT *, (expiry - CURRENT_DATE) AS days_until_expiry FROM policies WHERE id=$1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Policy not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createPolicy(req, res) {
  const { client, phone, kra_pin, vehicle, insurer, expiry, premium } = req.body;
  if (!client || !vehicle || !expiry) {
    return res.status(400).json({ error: "client, vehicle and expiry are required" });
  }
  try {
    const prem       = Number(premium) || 0;
    const commission = Math.round(prem * 0.1);
    const { rows } = await pool.query(
      `INSERT INTO policies (client, phone, kra_pin, vehicle, insurer, expiry, premium, commission)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [client, phone, kra_pin, vehicle, insurer, expiry, prem, commission]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updatePolicy(req, res) {
  const { client, phone, kra_pin, vehicle, insurer, expiry, premium, status } = req.body;
  try {
    const prem       = Number(premium) || 0;
    const commission = Math.round(prem * 0.1);
    const { rows } = await pool.query(
      `UPDATE policies SET
         client=$1, phone=$2, kra_pin=$3, vehicle=$4, insurer=$5,
         expiry=$6, premium=$7, commission=$8, status=$9
       WHERE id=$10 RETURNING *`,
      [client, phone, kra_pin, vehicle, insurer, expiry, prem, commission, status || "active", req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Policy not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function markRenewed(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE policies SET status='renewed' WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Policy not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deletePolicy(req, res) {
  try {
    const { rows } = await pool.query(
      "DELETE FROM policies WHERE id=$1 RETURNING id", [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Policy not found" });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getRenewalsSummary(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE expiry >= CURRENT_DATE)                              AS active,
        COUNT(*) FILTER (WHERE expiry < CURRENT_DATE)                               AS expired,
        COUNT(*) FILTER (WHERE expiry - CURRENT_DATE BETWEEN 0 AND 30)             AS due_30_days,
        COUNT(*) FILTER (WHERE expiry - CURRENT_DATE BETWEEN 0 AND 7)              AS due_7_days,
        COALESCE(SUM(commission),0)                                                 AS total_commission
      FROM policies
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
