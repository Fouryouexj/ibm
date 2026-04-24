import pool from "./db.js";

export async function upsertCustomer(conn, { name, phone, type, last_order }) {
  const [rows] = await conn.query(
    "SELECT * FROM customers WHERE LOWER(name) = LOWER(?) LIMIT 1", [name]
  );

  if (rows[0]) {
    const c = rows[0];
    const types = JSON.parse(c.types || "[]");
    const newTypes = types.includes(type) ? types : [...types, type];
    const newPhone = c.phone || phone || null;
    const newLast = last_order
      ? (!c.last_order || last_order > c.last_order ? last_order : c.last_order)
      : c.last_order;

    await conn.query(
      "UPDATE customers SET types=?, phone=?, last_order=? WHERE id=?",
      [JSON.stringify(newTypes), newPhone, newLast, c.id]
    );
    return rows[0];
  }

  const [result] = await conn.query(
    "INSERT INTO customers (name, phone, types, last_order) VALUES (?,?,?,?)",
    [name, phone || null, JSON.stringify(type ? [type] : []), last_order || null]
  );
  return { id: result.insertId, name, phone, types: JSON.stringify(type ? [type] : []) };
}

export async function recomputeCustomerTypes(conn, customerName) {
  const [[hasSale]]   = await conn.query("SELECT 1 FROM rice_sales WHERE LOWER(customer) = LOWER(?) LIMIT 1", [customerName]);
  const [[hasPolicy]] = await conn.query("SELECT 1 FROM policies  WHERE LOWER(client)   = LOWER(?) LIMIT 1", [customerName]);

  const types = [];
  if (hasSale)   types.push("Rice");
  if (hasPolicy) types.push("Insurance");

  if (types.length === 0) {
    await conn.query("DELETE FROM customers WHERE LOWER(name) = LOWER(?)", [customerName]);
    return null;
  }

  const [[latestSale]]   = await conn.query("SELECT MAX(sale_date) AS d FROM rice_sales WHERE LOWER(customer) = LOWER(?)", [customerName]);
  const [[latestPolicy]] = await conn.query("SELECT MAX(expiry)    AS d FROM policies  WHERE LOWER(client)   = LOWER(?)", [customerName]);

  const dates = [latestSale?.d, latestPolicy?.d].filter(Boolean);
  const lastOrder = dates.length ? dates.sort().reverse()[0] : null;

  await conn.query(
    "UPDATE customers SET types=?, last_order=? WHERE LOWER(name) = LOWER(?)",
    [JSON.stringify(types), lastOrder, customerName]
  );
}
