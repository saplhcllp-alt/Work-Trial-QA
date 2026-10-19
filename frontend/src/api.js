// Central API helper. Base URL points at the Flask backend.
export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

// VULNERABLE: auth token kept in localStorage (readable by any XSS payload).
export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(t) {
  localStorage.setItem("token", t);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && getToken()) {
    headers["Authorization"] = `Bearer ${getToken()}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data.error || data.detail || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/api/login", { method: "POST", body: { email, password }, auth: false }),
  verify2fa: (user_id, otp) =>
    request("/api/verify-2fa", { method: "POST", body: { user_id, otp }, auth: false }),
  listBrds: () => request("/api/brds"),
  getBrd: (id) => request(`/api/brds/${id}`),
  createBrd: (payload) => request("/api/brds", { method: "POST", body: payload }),
  updateBrd: (id, payload) =>
    request(`/api/brds/${id}`, { method: "PUT", body: payload }),
  createShare: (id) => request(`/api/brds/${id}/share`, { method: "POST" }),
  listSubmissions: (id) => request(`/api/brds/${id}/submissions`),
  publicForm: (token) =>
    request(`/api/public/form/${token}`, { auth: false }),
  submitForm: (token, payload) =>
    request(`/api/public/form/${token}`, { method: "POST", body: payload, auth: false }),
  pdfUrl: (id) => `${API_BASE}/api/brds/${id}/pdf`,
};
