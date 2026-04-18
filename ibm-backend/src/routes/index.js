import { Router } from "express";
import { login, getMe } from "../controllers/authController.js";
import {
  getSales, createSale, deleteSale,
  getStock, getStockBalance, createStockEntry,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getRiceReport
} from "../controllers/riceController.js";
import {
  getPolicies, getPolicy, createPolicy, updatePolicy,
  markRenewed, deletePolicy, getRenewalsSummary
} from "../controllers/insuranceController.js";
import {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getCustomers, createCustomer, updateCustomer,
  getDashboard
} from "../controllers/generalController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// ── Auth ──────────────────────────────────────────────────
router.post("/auth/login",        login);
router.get ("/auth/me",           authenticate, getMe);

// ── Dashboard ─────────────────────────────────────────────
router.get ("/dashboard",         authenticate, getDashboard);

// ── Rice: Sales ───────────────────────────────────────────
router.get ("/rice/sales",        authenticate, getSales);
router.post("/rice/sales",        authenticate, createSale);
router.delete("/rice/sales/:id",  authenticate, requireAdmin, deleteSale);

// ── Rice: Stock ───────────────────────────────────────────
router.get ("/rice/stock",        authenticate, getStock);
router.get ("/rice/stock/balance",authenticate, getStockBalance);
router.post("/rice/stock",        authenticate, createStockEntry);

// ── Rice: Suppliers ───────────────────────────────────────
router.get ("/rice/suppliers",    authenticate, getSuppliers);
router.post("/rice/suppliers",    authenticate, requireAdmin, createSupplier);
router.put ("/rice/suppliers/:id",authenticate, requireAdmin, updateSupplier);
router.delete("/rice/suppliers/:id", authenticate, requireAdmin, deleteSupplier);

// ── Rice: Reports ─────────────────────────────────────────
router.get ("/rice/reports",      authenticate, getRiceReport);

// ── Insurance: Policies ───────────────────────────────────
router.get ("/insurance/policies",          authenticate, getPolicies);
router.get ("/insurance/policies/summary",  authenticate, getRenewalsSummary);
router.get ("/insurance/policies/:id",      authenticate, getPolicy);
router.post("/insurance/policies",          authenticate, createPolicy);
router.put ("/insurance/policies/:id",      authenticate, updatePolicy);
router.patch("/insurance/policies/:id/renew", authenticate, markRenewed);
router.delete("/insurance/policies/:id",    authenticate, requireAdmin, deletePolicy);

// ── Expenses ──────────────────────────────────────────────
router.get ("/expenses",          authenticate, getExpenses);
router.post("/expenses",          authenticate, createExpense);
router.put ("/expenses/:id",      authenticate, requireAdmin, updateExpense);
router.delete("/expenses/:id",    authenticate, requireAdmin, deleteExpense);

// ── Customers ─────────────────────────────────────────────
router.get ("/customers",         authenticate, getCustomers);
router.post("/customers",         authenticate, createCustomer);
router.put ("/customers/:id",     authenticate, updateCustomer);

export default router;
