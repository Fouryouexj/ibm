# IBM Backend — Setup Guide (Linux)

## Prerequisites
Make sure you have these installed:
- Node.js v18+ (you have v22 ✅)
- PostgreSQL 14+

---

## 1. Install PostgreSQL (if not already installed)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 2. Create the database and user

```bash
sudo -u postgres psql
```

Inside psql, run:

```sql
CREATE DATABASE ibm_db;
CREATE USER ibm_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE ibm_db TO ibm_user;
\q
```

---

## 3. Clone / place the backend folder

Put the `ibm-backend` folder wherever you keep your projects, e.g.:

```bash
cd ~/projects
# folder is already here as ibm-backend
cd ibm-backend
```

## 4. Install dependencies

```bash
npm install
```

## 5. Set up environment variables

```bash
cp .env.example .env
nano .env   # or use any editor
```

Edit these values in `.env`:

```
DB_NAME=ibm_db
DB_USER=ibm_user
DB_PASSWORD=yourpassword
JWT_SECRET=pick_any_long_random_string_here
```

Leave everything else as-is for local dev.

---

## 6. Run the database migration

This creates all 7 tables:

```bash
npm run db:migrate
```

You should see:
```
✅ users
✅ customers
✅ suppliers
✅ policies
✅ rice_sales
✅ stock_in
✅ expenses
🎉 Migration complete.
```

## 7. Seed the database

This loads all the existing data from the app (Irene's current records):

```bash
npm run db:seed
```

---

## 8. Start the server

Development mode (auto-restarts on file changes):

```bash
npm run dev
```

You should see:
```
✅ PostgreSQL connected
🚀 IBM API running on http://localhost:5000
```

---

## 9. Test it's working

Open a new terminal and run:

```bash
# Health check
curl http://localhost:5000/health

# Login (should return a JWT token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"irene@ibm.local","password":"admin123"}'

# Save the token from above, then test a protected route:
TOKEN="paste_token_here"
curl http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## Default login credentials

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | irene@ibm.local    | admin123  |
| Staff | staff@ibm.local    | staff123  |

> Change these passwords after first login in production.

---

## API Endpoints Reference

### Auth
| Method | Endpoint        | Access |
|--------|----------------|--------|
| POST   | /api/auth/login | Public |
| GET    | /api/auth/me    | Auth   |

### Dashboard
| Method | Endpoint        | Access |
|--------|----------------|--------|
| GET    | /api/dashboard  | Auth   |

### Rice — Sales
| Method | Endpoint                    | Access      |
|--------|-----------------------------|-------------|
| GET    | /api/rice/sales             | Auth        |
| POST   | /api/rice/sales             | Auth        |
| DELETE | /api/rice/sales/:id         | Admin only  |

Query params for GET: `?from=2026-04-01&to=2026-04-15&method=M-Pesa`

### Rice — Stock
| Method | Endpoint                    | Access |
|--------|-----------------------------|--------|
| GET    | /api/rice/stock             | Auth   |
| GET    | /api/rice/stock/balance     | Auth   |
| POST   | /api/rice/stock             | Auth   |

### Rice — Suppliers
| Method | Endpoint                    | Access     |
|--------|-----------------------------|------------|
| GET    | /api/rice/suppliers         | Auth       |
| POST   | /api/rice/suppliers         | Admin only |
| PUT    | /api/rice/suppliers/:id     | Admin only |
| DELETE | /api/rice/suppliers/:id     | Admin only |

### Rice — Reports
| Method | Endpoint                    | Access |
|--------|-----------------------------|--------|
| GET    | /api/rice/reports           | Auth   |

Query params: `?period=today` or `week` or `month` or `all`

### Insurance — Policies
| Method | Endpoint                              | Access     |
|--------|---------------------------------------|------------|
| GET    | /api/insurance/policies               | Auth       |
| GET    | /api/insurance/policies/summary       | Auth       |
| GET    | /api/insurance/policies/:id           | Auth       |
| POST   | /api/insurance/policies               | Auth       |
| PUT    | /api/insurance/policies/:id           | Auth       |
| PATCH  | /api/insurance/policies/:id/renew     | Auth       |
| DELETE | /api/insurance/policies/:id           | Admin only |

Query params for GET: `?status=active` or `expired` or `renewals`

### Expenses
| Method | Endpoint            | Access     |
|--------|---------------------|------------|
| GET    | /api/expenses       | Auth       |
| POST   | /api/expenses       | Auth       |
| PUT    | /api/expenses/:id   | Admin only |
| DELETE | /api/expenses/:id   | Admin only |

### Customers
| Method | Endpoint            | Access |
|--------|---------------------|--------|
| GET    | /api/customers      | Auth   |
| POST   | /api/customers      | Auth   |
| PUT    | /api/customers/:id  | Auth   |

Query params for GET: `?search=Agnes&type=Rice`

---

## File Structure

```
ibm-backend/
├── src/
│   ├── index.js                   ← Express server entry point
│   ├── routes/
│   │   └── index.js               ← All API routes
│   ├── controllers/
│   │   ├── authController.js      ← Login, getMe
│   │   ├── riceController.js      ← Sales, stock, suppliers, reports
│   │   ├── insuranceController.js ← Policies, renewals
│   │   └── generalController.js   ← Expenses, customers, dashboard
│   ├── middleware/
│   │   └── auth.js                ← JWT authenticate + requireAdmin
│   └── lib/
│       ├── db.js                  ← PostgreSQL connection pool
│       ├── migrate.js             ← Creates all tables
│       └── seed.js                ← Loads initial data
├── .env.example                   ← Copy to .env and fill in values
├── package.json
└── README.md
```

---

## Next Steps — Phase 2

Once the backend is running, Phase 2 connects the React frontend to these API endpoints, replacing all `useState` with real API calls.
