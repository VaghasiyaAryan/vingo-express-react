/**
 * The single door to the Express API.
 *
 * Everything goes through same-origin relative URLs — Express serves the
 * built app in production, and Vite proxies /api in development — so the
 * httpOnly admin session cookie rides along without any CORS or credential
 * juggling.
 */

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  /** True when the server rejected the session — the caller should send the user to login. */
  get isUnauthorized() {
    return this.status === 401;
  }
}

// ------------------------------------------------------- in-flight tracking

const listeners = new Set();
let inFlight = 0;

function notify() {
  for (const listener of listeners) listener(inFlight);
}

/**
 * Subscribes to the number of requests currently in flight. The admin
 * progress bar reads this; polling requests opt out via `background: true`
 * so a page that pings every second doesn't pin the bar on permanently.
 */
export function onRequestCountChange(listener) {
  listeners.add(listener);
  listener(inFlight);
  return () => listeners.delete(listener);
}

// ----------------------------------------------------------------- request

/**
 * `body` is sent as JSON. A `file` (a File or Blob) is sent as-is instead,
 * with its own type as the Content-Type — used for photo uploads.
 */
async function request(path, { method = "GET", body, file, signal, background = false } = {}) {
  if (!background) {
    inFlight += 1;
    notify();
  }

  try {
    const response = await fetch(path, {
      method,
      signal,
      headers: file ? { "Content-Type": file.type } : body === undefined ? undefined : { "Content-Type": "application/json" },
      body: file ?? (body === undefined ? undefined : JSON.stringify(body)),
    });

    // 204 and HEAD responses have nothing to parse.
    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // A non-JSON body from an API route means something upstream broke.
        throw new ApiError("The server returned an unexpected response.", { status: response.status });
      }
    }

    if (!response.ok) {
      throw new ApiError(data?.error || `Request failed (${response.status})`, { status: response.status, data });
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.name === "AbortError") throw err;
    throw new ApiError("We could not reach the server. Please check your connection and try again.", { status: 0 });
  } finally {
    if (!background) {
      inFlight -= 1;
      notify();
    }
  }
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

// ------------------------------------------------------------------ routes

export const endpoints = {
  session: (options) => api.get("/api/auth/session", options),
  login: (password) => api.post("/api/auth/login", { password }),
  logout: () => api.post("/api/auth/logout"),

  products: (options) => api.get("/api/products", options),
  product: (slug, options) => api.get(`/api/products/${encodeURIComponent(slug)}`, options),
  submitInquiry: (payload) => api.post("/api/inquiry", payload),

  admin: {
    stats: (options) => api.get("/api/admin/stats", options),
    config: (options) => api.get("/api/admin/config", options),
    health: () => api.get("/api/admin/health", { background: true }),
    catalogSummary: (options) => api.get("/api/admin/catalog-summary", options),

    inquiries: (options) => api.get("/api/admin/inquiries", options),
    setInquiryStatus: (id, status) => api.patch(`/api/admin/inquiries/${id}`, { status }),
    deleteInquiry: (id) => api.delete(`/api/admin/inquiries/${id}`),
    replyToInquiry: (id, subject, message) => api.post(`/api/admin/inquiries/${id}/reply`, { subject, message }),

    products: (options) => api.get("/api/admin/products", options),
    product: (id, options) => api.get(`/api/admin/products/${id}`, options),
    createProduct: (data) => api.post("/api/admin/products", data),
    updateProduct: (id, data) => api.put(`/api/admin/products/${id}`, data),
    setProductActive: (id, active) => api.patch(`/api/admin/products/${id}/active`, { active }),
    deleteProduct: (id) => api.delete(`/api/admin/products/${id}`),
    uploadImage: (file) => request("/api/admin/images", { method: "POST", file }),
  },
};
