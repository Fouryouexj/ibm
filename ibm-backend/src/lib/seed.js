import bcrypt from "bcryptjs";
import pool from "./db.js";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
  const client = await pool.connect();
  try {
    console.log("🌱 Seeding IBM database...\n");

    // ── Users ────────────────────────────────────────────
    const adminHash = await bcrypt.hash("admin123", 10);
    const staffHash = await bcrypt.hash("staff123", 10);

    await client.query(`
      INSERT INTO users (name, email, password, role) VALUES
        ('Irene Karanja', 'irene@ibm.local',  $1, 'admin'),
        ('Staff User',    'staff@ibm.local',  $2, 'staff')
      ON CONFLICT (email) DO NOTHING;
    `, [adminHash, staffHash]);
    console.log("✅ users (admin: irene@ibm.local / admin123)");

    // ── Suppliers ────────────────────────────────────────
    await client.query(`
      INSERT INTO suppliers (name, contact, location, terms) VALUES
        ('Mwea Rice Millers',   '0701 234 567', 'Mwea, Kirinyaga', 'Cash on delivery'),
        ('Ahero Farmers Co-op', '0712 345 670', 'Ahero, Kisumu',   '30 days credit')
      ON CONFLICT DO NOTHING;
    `);
    console.log("✅ suppliers");

    // ── Customers ────────────────────────────────────────
    await client.query(`
      INSERT INTO customers (name, phone, types, last_order) VALUES
        ('Agnes Wachira',  '0711 223 344', ARRAY['Rice'],              '2026-04-15'),
        ('James Mwangi',   '0712 345 678', ARRAY['Insurance'],         '2026-04-10'),
        ('John Kariuki',   '0722 334 455', ARRAY['Rice'],              '2026-04-15'),
        ('Mary Njeri',     '0723 456 789', ARRAY['Insurance'],         '2026-04-01'),
        ('Sarah Muthoni',  '0733 445 566', ARRAY['Rice','Insurance'],  '2026-04-14'),
        ('Robert Otieno',  '0744 556 677', ARRAY['Rice'],              '2026-04-13'),
        ('Grace Wanjiku',  '0745 678 901', ARRAY['Insurance'],         '2026-03-28'),
        ('David Kamau',    '0756 789 012', ARRAY['Insurance'],         '2026-04-01'),
        ('Alice Odhiambo', '0767 890 123', ARRAY['Insurance'],         '2026-03-15'),
        ('Joyce Wairimu',  '0778 901 234', ARRAY['Rice'],              '2026-04-12')
      ON CONFLICT DO NOTHING;
    `);
    console.log("✅ customers");

    // ── Policies ─────────────────────────────────────────
    await client.query(`
      INSERT INTO policies (client, phone, vehicle, insurer, expiry, premium, commission) VALUES
        ('James Mwangi',   '0712 345 678', 'KCA 123A', 'Jubilee Insurance', '2026-05-01', 12500, 1250),
        ('Mary Njeri',     '0723 456 789', 'KBB 456B', 'APA Insurance',     '2026-04-20',  8900,  890),
        ('Peter Ochieng',  '0734 567 890', 'KCC 789C', 'Britam',            '2026-04-17', 15200, 1520),
        ('Grace Wanjiku',  '0745 678 901', 'KDD 012D', 'AAR Insurance',     '2026-03-28',  9500,  950),
        ('David Kamau',    '0756 789 012', 'KEE 345E', 'UAP Insurance',     '2026-06-15', 11000, 1100),
        ('Alice Odhiambo', '0767 890 123', 'KFF 678F', 'Jubilee Insurance', '2026-07-01',  7800,  780)
      ON CONFLICT DO NOTHING;
    `);
    console.log("✅ policies");

    // ── Stock In ─────────────────────────────────────────
    await client.query(`
      INSERT INTO stock_in (supplier, qty, cost, stock_date) VALUES
        ('Mwea Rice Millers', 500, 55000, '2026-04-10'),
        ('Ahero Farmers',     350, 38500, '2026-03-28'),
        ('Mwea Rice Millers', 200, 21000, '2026-03-10')
      ON CONFLICT DO NOTHING;
    `);
    console.log("✅ stock_in");

    // ── Rice Sales ───────────────────────────────────────
    await client.query(`
      INSERT INTO rice_sales (customer, qty, ppkg, total, method, sale_date) VALUES
        ('Agnes Wachira',  25,  120, 3000,  'M-Pesa', '2026-04-15'),
        ('John Kariuki',   50,  118, 5900,  'Cash',   '2026-04-15'),
        ('Sarah Muthoni',  10,  120, 1200,  'M-Pesa', '2026-04-14'),
        ('Robert Otieno',  100, 115, 11500, 'Cash',   '2026-04-13'),
        ('Joyce Wairimu',  20,  120, 2400,  'M-Pesa', '2026-04-12'),
        ('Agnes Wachira',  30,  120, 3600,  'Cash',   '2026-04-11')
      ON CONFLICT DO NOTHING;
    `);
    console.log("✅ rice_sales");

    // ── Expenses ─────────────────────────────────────────
    await client.query(`
      INSERT INTO expenses (description, amount, category, expense_date) VALUES
        ('Rice Purchase – Mwea',  55000, 'Stock',      '2026-04-10'),
        ('Rice Purchase – Ahero', 38500, 'Stock',      '2026-03-28'),
        ('Transport',              3500, 'Operations', '2026-04-10'),
        ('Rent – April',           8000, 'Operations', '2026-04-01'),
        ('Rice Purchase – Mwea',  21000, 'Stock',      '2026-03-10')
      ON CONFLICT DO NOTHING;
    `);
    console.log("✅ expenses");

    console.log("\n🎉 Seed complete.");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
