import pool from "./db.js";
import dotenv from "dotenv";
dotenv.config();

const RESET = process.argv.includes("--reset");

const dropAll = `
  SET FOREIGN_KEY_CHECKS = 0;
  DROP TABLE IF EXISTS expenses;
  DROP TABLE IF EXISTS stock_in;
  DROP TABLE IF EXISTS rice_sales;
  DROP TABLE IF EXISTS suppliers;
  DROP TABLE IF EXISTS policies;
  DROP TABLE IF EXISTS customers;
  DROP TABLE IF EXISTS users;
  SET FOREIGN_KEY_CHECKS = 1;
`;

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log("🔄 Running IBM database migration...\n");

    if (RESET) {
      console.log("⚠️  Resetting — dropping all tables...");
      for (const sql of dropAll.split(";").filter(s => s.trim())) {
        await conn.query(sql);
      }
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(150) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        role       ENUM('admin','staff') NOT NULL DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ users");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        phone      VARCHAR(20),
        location   VARCHAR(150),
        types      JSON NOT NULL DEFAULT ('[]'),
        last_order DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ customers");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        contact    VARCHAR(20),
        location   VARCHAR(150),
        terms      VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ suppliers");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        client      VARCHAR(100) NOT NULL,
        phone       VARCHAR(20),
        kra_pin     VARCHAR(20),
        vehicle     VARCHAR(20) NOT NULL,
        insurer     VARCHAR(100),
        expiry      DATE NOT NULL,
        premium     DECIMAL(12,2) NOT NULL DEFAULT 0,
        commission  DECIMAL(12,2) NOT NULL DEFAULT 0,
        status      ENUM('active','expired','renewed') NOT NULL DEFAULT 'active',
        customer_id INT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ policies");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS rice_sales (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        customer    VARCHAR(100) NOT NULL,
        customer_id INT,
        qty         DECIMAL(10,2) NOT NULL,
        ppkg        DECIMAL(10,2) NOT NULL,
        total       DECIMAL(12,2) NOT NULL,
        method      ENUM('Cash','M-Pesa') NOT NULL DEFAULT 'Cash',
        sale_date   DATE NOT NULL DEFAULT (CURRENT_DATE),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ rice_sales");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS stock_in (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        supplier_id INT,
        supplier    VARCHAR(100) NOT NULL,
        qty         DECIMAL(10,2) NOT NULL,
        cost        DECIMAL(12,2) NOT NULL,
        stock_date  DATE NOT NULL DEFAULT (CURRENT_DATE),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ stock_in");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        description  VARCHAR(255) NOT NULL,
        amount       DECIMAL(12,2) NOT NULL,
        category     ENUM('Stock','Operations','Utilities','Other') NOT NULL DEFAULT 'Operations',
        expense_date DATE NOT NULL DEFAULT (CURRENT_DATE),
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ expenses");

    console.log("\n🎉 Migration complete.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate();
