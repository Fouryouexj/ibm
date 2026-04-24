// ─── Base config ─────────────────────────────────────────
const BASE = "https://ibmanager.co.ke/api";

function getToken() {
  return localStorage.getItem("ibm_token");
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const get  = (path)        => request("GET",    path);
const post = (path, body)  => request("POST",   path, body);
const put  = (path, body)  => request("PUT",    path, body);
const patch= (path, body)  => request("PATCH",  path, body);
const del  = (path)        => request("DELETE", path);

// ─── Auth ─────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email, password) => post("/auth/login", { email, password }),
    me:    ()                => get("/auth/me"),
  },

  // ─── Dashboard ──────────────────────────────────────────
  dashboard: {
    get: () => get("/dashboard"),
  },

  // ─── Rice ───────────────────────────────────────────────
  rice: {
    getSales:      (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return get(`/rice/sales${q ? "?" + q : ""}`);
    },
    createSale:    (body) => post("/rice/sales", body),
    deleteSale:    (id)   => del(`/rice/sales/${id}`),

    getStock:      ()     => get("/rice/stock"),
    getBalance:    ()     => get("/rice/stock/balance"),
    addStock:      (body) => post("/rice/stock", body),

    getSuppliers:  ()     => get("/rice/suppliers"),
    createSupplier:(body) => post("/rice/suppliers", body),
    updateSupplier:(id, body) => put(`/rice/suppliers/${id}`, body),
    deleteSupplier:(id)   => del(`/rice/suppliers/${id}`),

    getReport:     (period = "all") => get(`/rice/reports?period=${period}`),
  },

  // ─── Insurance ──────────────────────────────────────────
  insurance: {
    getPolicies:  (status) => {
      const q = status ? `?status=${status}` : "";
      return get(`/insurance/policies${q}`);
    },
    getSummary:   ()       => get("/insurance/policies/summary"),
    getPolicy:    (id)     => get(`/insurance/policies/${id}`),
    createPolicy: (body)   => post("/insurance/policies", body),
    updatePolicy: (id, body) => put(`/insurance/policies/${id}`, body),
    markRenewed:  (id)     => patch(`/insurance/policies/${id}/renew`),
    deletePolicy: (id)     => del(`/insurance/policies/${id}`),
  },

  // ─── Expenses ───────────────────────────────────────────
  expenses: {
    getAll:   (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return get(`/expenses${q ? "?" + q : ""}`);
    },
    create:   (body)       => post("/expenses", body),
    update:   (id, body)   => put(`/expenses/${id}`, body),
    delete:   (id)         => del(`/expenses/${id}`),
  },

  // ─── Customers ──────────────────────────────────────────
  customers: {
    getAll:   (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return get(`/customers${q ? "?" + q : ""}`);
    },
    create:   (body)       => post("/customers", body),
    update:   (id, body)   => put(`/customers/${id}`, body),
  },
};
