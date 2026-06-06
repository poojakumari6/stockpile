// Centralised API client. The base URL comes from the build-time env var
// VITE_API_URL so the same image works locally and in production.
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);

async function request(path, { method = "GET", body } = {}) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, opts);
  } catch {
    throw new Error("Network error — is the backend reachable?");
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message)) ||
      (typeof data === "string" ? data : null) ||
      `Request failed (${res.status})`;
    throw new Error(
      Array.isArray(detail) ? detail.map((d) => d.msg).join(", ") : detail
    );
  }
  return data;
}

export const api = {
  baseUrl: BASE_URL,

  // Products
  listProducts: () => request("/products"),
  createProduct: (p) => request("/products", { method: "POST", body: p }),
  updateProduct: (id, p) => request(`/products/${id}`, { method: "PUT", body: p }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  // Customers
  listCustomers: () => request("/customers"),
  createCustomer: (c) => request("/customers", { method: "POST", body: c }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: "DELETE" }),

  // Orders
  listOrders: () => request("/orders"),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (o) => request("/orders", { method: "POST", body: o }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: "DELETE" }),

  // Dashboard
  dashboard: (threshold = 10) =>
    request(`/dashboard/summary?low_stock_threshold=${threshold}`),
};
