import pool from "./db.js";
import dotenv from "dotenv";
dotenv.config();

const RESET = process.argv.includes("--reset");

const dropAll = `
  DROP TABLE IF EXISTS
    expenses, stock_in, rice_sales,
    suppliers, policies, customers, users
  CASCADE;
`;

const createUsers = `
  CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'staff'
                CHECK (role IN ('admin','staff')),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
`;

const createCustomers = `
  CREATE TABLE IF NOT EXISTS customers (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    phone      VARCHAR(20),
    location   VARCHAR(150),
    types      TEXT[]       NOT NULL DEFAULT '{}',
    last_order DATE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
`;

const createSuppliers = `
  CREATE TABLE IF NOT EXISTS suppliers (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    contact    VARCHAR(20),
    location   VARCHAR(150),
    terms      VARCHAR(100),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
`;

const createPolicies = `
  CREATE TABLE IF NOT EXISTS policies (
    id          SERIAL PRIMARY KEY,
    client      VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    kra_pin     VARCHAR(20),
    vehicle     VARCHAR(20)  NOT NULL,
    insurer     VARCHAR(100),
    expiry      DATE         NOT NULL,
    premium     NUMERIC(12,2) NOT NULL DEFAULT 0,
    commission  NUMERIC(12,2) NOT NULL DEFAULT 0,
    status      VARCHAR(20)  NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','expired','renewed')),
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
`;

const createRiceSales = `
  CREATE TABLE IF NOT EXISTS rice_sales (
    id          SERIAL PRIMARY KEY,
    customer    VARCHAR(100) NOT NULL,
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    qty         NUMERIC(10,2) NOT NULL,
    ppkg        NUMERIC(10,2) NOT NULL,
    total       NUMERIC(12,2) NOT NULL,
    method      VARCHAR(20)  NOT NULL DEFAULT 'Cash'
                CHECK (method IN ('Cash','M-Pesa')),
    sale_date   DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
`;

const createStockIn = `
  CREATE TABLE IF NOT EXISTS stock_in (
    id           SERIAL PRIMARY KEY,
    supplier_id  INT REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier     VARCHAR(100) NOT NULL,
    qty          NUMERIC(10,2) NOT NULL,
    cost         NUMERIC(12,2) NOT NULL,
    stock_date   DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
`;

const createExpenses = `
  CREATE TABLE IF NOT EXISTS expenses (
    id           SERIAL PRIMARY KEY,
    description  VARCHAR(255) NOT NULL,
    amount       NUMERIC(12,2) NOT NULL,
    category     VARCHAR(50)  NOT NULL DEFAULT 'Operations'
                 CHECK (category IN ('Stock','Operations','Utilities','Other')),
    expense_date DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("🔄 Running IBM database migration...\n");

    if (RESET) {
      console.log("⚠️  Resetting — dropping all tables...");
      await client.query(dropAll);
    }

    await client.query(createUsers);      console.log("✅ users");
    await client.query(createCustomers);  console.log("✅ customers");
    await client.query(createSuppliers);  console.log("✅ suppliers");
    await client.query(createPolicies);   console.log("✅ policies");
    await client.query(createRiceSales);  console.log("✅ rice_sales");
    await client.query(createStockIn);    console.log("✅ stock_in");
    await client.query(createExpenses);   console.log("✅ expenses");

    console.log("\n🎉 Migration complete.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
